from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user, require_roles
from app.models import (
    Feedback,
    Order,
    PaymentStatus,
    Provider,
    Subscription,
    SubscriptionMeal,
    SubscriptionMealStatus,
    SubscriptionStatus,
    User,
    UserRole,
    WalletTransaction,
    WalletTransactionType,
)
from app.schemas import (
    SubscriptionCheckoutRequest,
    SubscriptionCheckoutResponse,
    SubscriptionMealCancelRequest,
    SubscriptionMealCancelResponse,
    SubscriptionMealResponse,
    SubscriptionDetailResponse,
    SubscriptionManageRequest,
    SubscriptionResponse,
)
from app.services import (
    default_end_date,
    ensure_subscription_meals,
    get_or_create_wallet,
    get_plan_price,
    now_utc,
    quantize_money,
    record_wallet_transaction,
)


router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


def _resolve_provider(db: Session, current_user: User, provider_id: int | None) -> Provider:
    if provider_id is not None:
        provider = db.get(Provider, provider_id)
        if not provider:
            raise HTTPException(status_code=404, detail="Provider not found")
        if (
            current_user.role == UserRole.provider
            and provider.owner_user_id != current_user.user_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view subscriptions for this provider",
            )
        return provider

    provider = (
        db.query(Provider).filter(Provider.owner_user_id == current_user.user_id).first()
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    return provider


@router.post("/manage", response_model=SubscriptionResponse)
def manage_subscription(
    payload: SubscriptionManageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.customer.value)),
):
    provider = db.get(Provider, payload.provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # Pricing validation: provider must have set pricing before accepting subscriptions
    if provider.weekly_price <= 0 or provider.monthly_price <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provider has not configured pricing yet. Please try again later.",
        )

    # Start-date validation: subscription cannot start in the past
    if payload.start_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subscription start date cannot be in the past.",
        )

    if payload.status == SubscriptionStatus.active:
        existing_active = (
            db.query(Subscription)
            .filter(
                Subscription.user_id == current_user.user_id,
                Subscription.provider_id == payload.provider_id,
                Subscription.plan_type == payload.plan_type,
                Subscription.status == SubscriptionStatus.active,
                Subscription.end_date >= payload.start_date,
            )
            .first()
        )

        if existing_active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Active {payload.plan_type.value.title()} subscription already exists from {existing_active.start_date} to {existing_active.end_date}. Please cancel it first.",
            )

    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.user_id,
            Subscription.provider_id == payload.provider_id,
        )
        .order_by(Subscription.subscription_id.desc())
        .first()
    )

    if subscription:
        subscription.plan_type = payload.plan_type
        subscription.start_date = payload.start_date
        subscription.end_date = payload.end_date
        subscription.status = payload.status
        db.commit()
        db.refresh(subscription)
        return subscription

    new_subscription = Subscription(
        user_id=current_user.user_id,
        provider_id=payload.provider_id,
        plan_type=payload.plan_type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        status=payload.status,
    )
    db.add(new_subscription)
    db.commit()
    db.refresh(new_subscription)
    return new_subscription


@router.post("/checkout", response_model=SubscriptionCheckoutResponse, status_code=status.HTTP_201_CREATED)
def create_subscription_checkout(
    payload: SubscriptionCheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.customer.value)),
):
    provider = db.get(Provider, payload.provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    if payload.start_date < date.today():
        raise HTTPException(status_code=400, detail="Subscription start date cannot be in the past.")

    existing_active = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.user_id,
            Subscription.provider_id == payload.provider_id,
            Subscription.status == SubscriptionStatus.active,
            Subscription.end_date >= payload.start_date,
        )
        .first()
    )
    if existing_active:
        raise HTTPException(status_code=409, detail="You already have an active subscription for this provider.")

    end_date = default_end_date(payload.start_date, payload.plan_type)
    total_amount = get_plan_price(provider, payload.plan_type)
    wallet = get_or_create_wallet(db, current_user)
    wallet_balance_used = min(quantize_money(wallet.balance), total_amount)
    payable_amount = quantize_money(total_amount - wallet_balance_used)

    order = Order(
        user_id=current_user.user_id,
        provider_id=payload.provider_id,
        order_type="subscription",
        payment_status=PaymentStatus.pending,
        start_date=payload.start_date,
        end_date=end_date,
        total_amount=total_amount,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return {
        "order_id": order.order_id,
        "provider_id": payload.provider_id,
        "plan_type": payload.plan_type,
        "start_date": payload.start_date,
        "end_date": end_date,
        "total_amount": total_amount,
        "wallet_balance_used": wallet_balance_used,
        "payable_amount": payable_amount,
    }


@router.get("/provider", response_model=list[SubscriptionDetailResponse])
def list_provider_subscriptions(
    provider_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.provider.value, UserRole.admin.value)),
):
    provider = _resolve_provider(db, current_user, provider_id)

    subscriptions = (
        db.query(Subscription)
        .filter(Subscription.provider_id == provider.provider_id)
        .order_by(Subscription.created_at.desc())
        .all()
    )

    response: list[SubscriptionDetailResponse] = []
    for sub in subscriptions:
        customer = db.get(User, sub.user_id)
        latest_feedback = (
            db.query(Feedback)
            .filter(Feedback.user_id == sub.user_id, Feedback.provider_id == sub.provider_id)
            .order_by(Feedback.created_at.desc())
            .first()
        )
        cancelled_meals_count = db.query(SubscriptionMeal).filter(
            SubscriptionMeal.subscription_id == sub.subscription_id,
            SubscriptionMeal.status == SubscriptionMealStatus.cancelled,
        ).count()
        wallet_credit_generated = (
            db.query(func.coalesce(func.sum(WalletTransaction.amount), 0))
            .filter(
                WalletTransaction.transaction_type == WalletTransactionType.credit,
                WalletTransaction.source_type == "meal_cancellation",
            )
            .join(
                SubscriptionMeal,
                SubscriptionMeal.subscription_meal_id == WalletTransaction.source_id,
            )
            .filter(SubscriptionMeal.subscription_id == sub.subscription_id)
            .scalar()
        )
        response.append(
            {
                "subscription_id": sub.subscription_id,
                "user_id": sub.user_id,
                "provider_id": sub.provider_id,
                "plan_type": sub.plan_type,
                "start_date": sub.start_date,
                "end_date": sub.end_date,
                "status": sub.status,
                "customer_name": customer.name if customer else None,
                "customer_email": customer.email if customer else None,
                "customer_phone": customer.phone if customer else None,
                "customer_location": customer.location if customer else None,
                "duration_days": (sub.end_date - sub.start_date).days + 1,
                "created_at": sub.created_at,
                "latest_feedback_rating": latest_feedback.rating if latest_feedback else None,
                "latest_feedback_comment": latest_feedback.comment if latest_feedback else None,
                "latest_feedback_at": latest_feedback.created_at if latest_feedback else None,
                "cancelled_meals_count": cancelled_meals_count,
                "wallet_credit_generated": quantize_money(wallet_credit_generated or 0),
            }
        )
    return response


@router.get("/me", response_model=list[SubscriptionDetailResponse])
def list_my_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.customer.value)),
):
    subscriptions = (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.user_id)
        .order_by(Subscription.created_at.desc())
        .all()
    )

    response: list[SubscriptionDetailResponse] = []
    for sub in subscriptions:
        provider = db.get(Provider, sub.provider_id)
        latest_feedback = (
            db.query(Feedback)
            .filter(Feedback.user_id == current_user.user_id, Feedback.provider_id == sub.provider_id)
            .order_by(Feedback.created_at.desc())
            .first()
        )
        cancelled_meals_count = db.query(SubscriptionMeal).filter(
            SubscriptionMeal.subscription_id == sub.subscription_id,
            SubscriptionMeal.status == SubscriptionMealStatus.cancelled,
        ).count()
        wallet_credit_generated = (
            db.query(func.coalesce(func.sum(WalletTransaction.amount), 0))
            .filter(
                WalletTransaction.transaction_type == WalletTransactionType.credit,
                WalletTransaction.source_type == "meal_cancellation",
            )
            .join(
                SubscriptionMeal,
                SubscriptionMeal.subscription_meal_id == WalletTransaction.source_id,
            )
            .filter(SubscriptionMeal.subscription_id == sub.subscription_id)
            .scalar()
        )
        response.append(
            {
                "subscription_id": sub.subscription_id,
                "user_id": sub.user_id,
                "provider_id": sub.provider_id,
                "plan_type": sub.plan_type,
                "start_date": sub.start_date,
                "end_date": sub.end_date,
                "status": sub.status,
                "customer_name": provider.mess_name if provider else None,
                "duration_days": (sub.end_date - sub.start_date).days + 1,
                "created_at": sub.created_at,
                "latest_feedback_rating": latest_feedback.rating if latest_feedback else None,
                "latest_feedback_comment": latest_feedback.comment if latest_feedback else None,
                "latest_feedback_at": latest_feedback.created_at if latest_feedback else None,
                "cancelled_meals_count": cancelled_meals_count,
                "wallet_credit_generated": quantize_money(wallet_credit_generated or 0),
            }
        )
    return response


@router.get("/meals/me", response_model=list[SubscriptionMealResponse])
def list_my_subscription_meals(
    subscription_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.customer.value)),
):
    query = db.query(SubscriptionMeal).filter(SubscriptionMeal.user_id == current_user.user_id)
    if subscription_id is not None:
        query = query.filter(SubscriptionMeal.subscription_id == subscription_id)
    meals = query.order_by(SubscriptionMeal.service_date.asc(), SubscriptionMeal.meal_type.asc()).all()
    return meals


@router.post("/meals/cancel", response_model=SubscriptionMealCancelResponse)
def cancel_subscription_meals(
    payload: SubscriptionMealCancelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.customer.value)),
):
    meals = (
        db.query(SubscriptionMeal)
        .filter(
            SubscriptionMeal.subscription_meal_id.in_(payload.subscription_meal_ids),
            SubscriptionMeal.user_id == current_user.user_id,
        )
        .all()
    )
    if not meals:
        raise HTTPException(status_code=404, detail="No eligible meals found.")

    wallet = get_or_create_wallet(db, current_user)
    cancelled: list[SubscriptionMeal] = []
    credited_amount = quantize_money("0")
    current_time = now_utc()

    for meal in meals:
        if meal.status != SubscriptionMealStatus.scheduled:
            continue
        if current_time > meal.cutoff_at:
            continue
        meal.status = SubscriptionMealStatus.cancelled
        meal.cancelled_at = current_time
        credited_amount = quantize_money(credited_amount + meal.unit_price)
        record_wallet_transaction(
            db,
            wallet,
            WalletTransactionType.credit,
            meal.unit_price,
            source_type="meal_cancellation",
            source_id=meal.subscription_meal_id,
            note=f"Credit for cancelled {meal.meal_type.value} on {meal.service_date.isoformat()}",
        )
        db.add(meal)
        cancelled.append(meal)

    if not cancelled:
        raise HTTPException(status_code=400, detail="Selected meals cannot be cancelled after the cutoff.")

    db.commit()
    return {
        "cancelled_meals": cancelled,
        "wallet_balance": wallet.balance,
        "credited_amount": credited_amount,
    }

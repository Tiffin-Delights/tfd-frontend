from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user, require_roles
from app.models import Provider, Subscription, SubscriptionStatus, User, UserRole
from app.schemas import (
    SubscriptionDetailResponse,
    SubscriptionManageRequest,
    SubscriptionResponse,
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
                detail=f"You already have an active {payload.plan_type.value} subscription with this mess.",
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


@router.get("/provider", response_model=list[SubscriptionDetailResponse])
def list_provider_subscriptions(
    provider_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.provider.value, UserRole.admin.value)),
):
    provider = _resolve_provider(db, current_user, provider_id)

    subscriptions = (
        db.query(Subscription, User.name.label("customer_name"))
        .join(User, Subscription.user_id == User.user_id)
        .filter(Subscription.provider_id == provider.provider_id)
        .order_by(Subscription.created_at.desc())
        .all()
    )

    return [
        {
            "subscription_id": sub.subscription_id,
            "user_id": sub.user_id,
            "provider_id": sub.provider_id,
            "plan_type": sub.plan_type,
            "start_date": sub.start_date,
            "end_date": sub.end_date,
            "status": sub.status,
            "customer_name": customer_name,
            "duration_days": (sub.end_date - sub.start_date).days,
            "created_at": sub.created_at,
        }
        for sub, customer_name in subscriptions
    ]


@router.get("/me", response_model=list[SubscriptionDetailResponse])
def list_my_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.customer.value)),
):
    subscriptions = (
        db.query(Subscription, Provider.mess_name.label("provider_name"))
        .join(Provider, Subscription.provider_id == Provider.provider_id)
        .filter(Subscription.user_id == current_user.user_id)
        .order_by(Subscription.created_at.desc())
        .all()
    )

    return [
        {
            "subscription_id": sub.subscription_id,
            "user_id": sub.user_id,
            "provider_id": sub.provider_id,
            "plan_type": sub.plan_type,
            "start_date": sub.start_date,
            "end_date": sub.end_date,
            "status": sub.status,
            "customer_name": provider_name,
            "duration_days": (sub.end_date - sub.start_date).days,
            "created_at": sub.created_at,
        }
        for sub, provider_name in subscriptions
    ]

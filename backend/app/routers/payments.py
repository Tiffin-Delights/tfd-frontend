import hmac
import hashlib

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db import get_db
from app.deps import get_current_user
from app.models import Order, Payment, PaymentStatus, Provider, Subscription, SubscriptionPlan, SubscriptionStatus, User, WalletTransactionType
from app.schemas import PaymentCreateRequest, PaymentCreateResponse, PaymentResponse, PaymentVerifyRequest
from app.services import (
    default_end_date,
    ensure_subscription_meals,
    get_or_create_wallet,
    payment_transaction_id,
    quantize_money,
    record_wallet_transaction,
)


router = APIRouter(prefix="/payments", tags=["Payments"])


def _verify_razorpay_signature(transaction_id: str, amount: str, signature: str | None) -> bool:
    if not signature:
        return False

    payload = f"{transaction_id}|{amount}".encode("utf-8")
    expected = hmac.new(
        settings.razorpay_webhook_secret.encode("utf-8"),
        payload,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/create", response_model=PaymentCreateResponse, status_code=status.HTTP_201_CREATED)
def create_payment_intent(
    payload: PaymentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.get(Order, payload.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.role.value != "admin" and order.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You cannot create a payment for this order")

    wallet = get_or_create_wallet(db, current_user)
    wallet_balance_used = min(quantize_money(wallet.balance), quantize_money(order.total_amount))
    payable_amount = quantize_money(order.total_amount - wallet_balance_used)

    return {
        "order_id": order.order_id,
        "transaction_id": payment_transaction_id(),
        "amount": payable_amount,
        "payment_gateway": payload.payment_gateway,
    }


@router.post("/verify", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def verify_payment(
    payload: PaymentVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.get(Order, payload.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.role.value != "admin" and order.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You cannot verify this payment")

    existing = db.query(Payment).filter(Payment.transaction_id == payload.transaction_id).first()
    if existing:
        return existing

    if payload.status == PaymentStatus.paid and payload.payment_gateway != "tfd_direct":
        is_valid_signature = _verify_razorpay_signature(
            payload.transaction_id, str(payload.amount), payload.razorpay_signature
        )
        if not is_valid_signature:
            raise HTTPException(status_code=400, detail="Invalid payment signature")

    payment = Payment(
        user_id=order.user_id,
        order_id=payload.order_id,
        amount=payload.amount,
        status=payload.status,
        payment_gateway=payload.payment_gateway,
        transaction_id=payload.transaction_id,
    )
    db.add(payment)

    order.payment_status = payload.status

    if payload.status == PaymentStatus.paid:
        order_user = db.get(User, order.user_id)
        if not order_user:
            raise HTTPException(status_code=404, detail="Order user not found")
        wallet = get_or_create_wallet(db, order_user)
        wallet_discount = min(quantize_money(wallet.balance), quantize_money(order.total_amount))
        if wallet_discount > 0:
            record_wallet_transaction(
                db,
                wallet,
                WalletTransactionType.debit,
                wallet_discount,
                source_type="order_payment",
                source_id=order.order_id,
                note=f"Wallet discount applied on order #{order.order_id}",
            )

        provider = db.get(Provider, order.provider_id)
        if not provider:
            raise HTTPException(status_code=404, detail="Provider not found")

        active_subscription = (
            db.query(Subscription)
            .filter(
                Subscription.user_id == order.user_id,
                Subscription.provider_id == order.provider_id,
                Subscription.start_date == order.start_date,
                Subscription.end_date == order.end_date,
                Subscription.status == SubscriptionStatus.active,
            )
            .first()
        )
        if not active_subscription:
            total_days = ((order.end_date - order.start_date).days + 1) if order.end_date else 7
            plan_type = SubscriptionPlan.weekly if total_days <= 7 else SubscriptionPlan.monthly
            active_subscription = Subscription(
                user_id=order.user_id,
                provider_id=order.provider_id,
                plan_type=plan_type,
                start_date=order.start_date,
                end_date=order.end_date or default_end_date(order.start_date, plan_type),
                status=SubscriptionStatus.active,
            )
            db.add(active_subscription)
            db.flush()

        ensure_subscription_meals(db, active_subscription, provider)

    db.commit()
    db.refresh(payment)
    return payment

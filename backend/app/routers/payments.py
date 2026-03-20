import hmac
import hashlib

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db import get_db
from app.deps import get_current_user
from app.models import Order, Payment, PaymentStatus, User
from app.schemas import PaymentResponse, PaymentVerifyRequest


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

    if payload.status == PaymentStatus.paid:
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

    db.commit()
    db.refresh(payment)
    return payment

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_roles
from app.models import Order, PaymentStatus, Provider, User, UserRole
from app.schemas import OrderCreateRequest, OrderDetailResponse, OrderResponse


router = APIRouter(prefix="/orders", tags=["Orders"])


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
                detail="Not authorized to view orders for this provider",
            )
        return provider

    provider = (
        db.query(Provider).filter(Provider.owner_user_id == current_user.user_id).first()
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    return provider


@router.post("/create", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.customer.value)),
):
    provider = db.get(Provider, payload.provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    if payload.order_type.value == "subscription" and payload.end_date is None:
        raise HTTPException(status_code=400, detail="end_date is required for subscription")

    order = Order(
        user_id=current_user.user_id,
        provider_id=payload.provider_id,
        order_type=payload.order_type,
        payment_status=PaymentStatus.pending,
        start_date=payload.start_date,
        end_date=payload.end_date,
        total_amount=payload.total_amount,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("/provider", response_model=list[OrderDetailResponse])
def list_provider_orders(
    provider_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.provider.value, UserRole.admin.value)),
):
    provider = _resolve_provider(db, current_user, provider_id)

    orders = (
        db.query(Order, User.name.label("customer_name"))
        .join(User, Order.user_id == User.user_id)
        .filter(Order.provider_id == provider.provider_id)
        .order_by(Order.created_at.desc())
        .all()
    )

    return [
        {
            "order_id": order.order_id,
            "user_id": order.user_id,
            "provider_id": order.provider_id,
            "order_type": order.order_type,
            "payment_status": order.payment_status,
            "start_date": order.start_date,
            "end_date": order.end_date,
            "total_amount": order.total_amount,
            "created_at": order.created_at,
            "customer_name": customer_name,
        }
        for order, customer_name in orders
    ]

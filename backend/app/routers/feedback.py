from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import func
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_roles
from app.models import Feedback, Order, Provider, Subscription, User, UserRole
from app.schemas import FeedbackDetailResponse, FeedbackResponse, FeedbackSubmitRequest


router = APIRouter(prefix="/feedback", tags=["Feedback"])


def _resolve_provider(
    db: Session, current_user: User, provider_id: int | None
) -> Provider:
    if provider_id is not None:
        provider = db.get(Provider, provider_id)
        if not provider:
            raise HTTPException(status_code=404, detail="Provider not found")
        if (
            current_user.role == UserRole.provider
            and provider.owner_user_id != current_user.user_id
        ):
            raise HTTPException(status_code=403, detail="Access denied for this provider")
        return provider

    provider = (
        db.query(Provider)
        .filter(Provider.owner_user_id == current_user.user_id)
        .first()
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    return provider


@router.post("/submit", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    payload: FeedbackSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.customer.value)),
):
    provider = db.get(Provider, payload.provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    has_order = (
        db.query(Order)
        .filter(
            Order.user_id == current_user.user_id,
            Order.provider_id == payload.provider_id,
        )
        .first()
    )

    has_subscription = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.user_id,
            Subscription.provider_id == payload.provider_id,
        )
        .first()
    )

    if not has_order and not has_subscription:
        raise HTTPException(
            status_code=400,
            detail="Please subscribe before submitting feedback for this mess",
        )

    feedback = (
        db.query(Feedback)
        .filter(
            Feedback.user_id == current_user.user_id,
            Feedback.provider_id == payload.provider_id,
        )
        .order_by(Feedback.created_at.desc())
        .first()
    )
    if feedback:
        feedback.rating = payload.rating
        feedback.comment = payload.comment
        db.add(feedback)
    else:
        feedback = Feedback(
            user_id=current_user.user_id,
            provider_id=payload.provider_id,
            rating=payload.rating,
            comment=payload.comment,
        )
        db.add(feedback)

    db.commit()
    db.refresh(feedback)

    avg_rating = (
        db.query(func.avg(Feedback.rating))
        .filter(Feedback.provider_id == payload.provider_id)
        .scalar()
    )
    provider.rating = Decimal(str(avg_rating or 0)).quantize(
        Decimal("0.1"), rounding=ROUND_HALF_UP
    )
    db.commit()

    return feedback


@router.get("/provider", response_model=list[FeedbackDetailResponse])
def list_provider_feedback(
    provider_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.provider.value, UserRole.admin.value)),
):
    provider = _resolve_provider(db, current_user, provider_id)

    feedback_rows = (
        db.query(Feedback, User.name.label("customer_name"))
        .join(User, Feedback.user_id == User.user_id)
        .filter(Feedback.provider_id == provider.provider_id)
        .order_by(Feedback.created_at.desc())
        .all()
    )

    return [
        {
            "feedback_id": fb.feedback_id,
            "user_id": fb.user_id,
            "provider_id": fb.provider_id,
            "rating": fb.rating,
            "comment": fb.comment,
            "created_at": fb.created_at,
            "customer_name": customer_name,
        }
        for fb, customer_name in feedback_rows
    ]

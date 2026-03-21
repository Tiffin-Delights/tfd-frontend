from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user, require_roles
from app.models import (
    Feedback,
    MenuItem,
    Order,
    Provider,
    Subscription,
    SubscriptionStatus,
    User,
    UserRole,
)
from app.schemas import ProviderCreateRequest, ProviderResponse, ProviderPricingResponse, ProviderPricingUpdateRequest


router = APIRouter(prefix="/providers", tags=["Providers"])


def _format_rating(value: Decimal | float | None) -> Decimal:
    if value in (None, ""):
        return Decimal("0.0")
    return Decimal(str(value)).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)


@router.post("/create", response_model=ProviderResponse, status_code=status.HTTP_201_CREATED)
def create_provider(
    payload: ProviderCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.provider.value, UserRole.admin.value)),
):
    if current_user.role == UserRole.provider:
        existing = (
            db.query(Provider).filter(Provider.owner_user_id == current_user.user_id).first()
        )
        if existing:
            raise HTTPException(status_code=409, detail="Provider profile already exists")

        provider = Provider(
            owner_user_id=current_user.user_id,
            owner_name=payload.owner_name,
            mess_name=payload.mess_name,
            city=payload.city,
            contact=payload.contact,
        )
        db.add(provider)
        db.commit()
        db.refresh(provider)
        return provider

    raise HTTPException(status_code=400, detail="Admin provider creation is not enabled")


@router.get("", response_model=list[ProviderResponse])
def list_providers(
    city: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    ratings_subquery = (
        db.query(
            Feedback.provider_id.label("provider_id"),
            func.avg(Feedback.rating).label("avg_rating"),
        )
        .group_by(Feedback.provider_id)
        .subquery()
    )

    computed_rating = func.coalesce(ratings_subquery.c.avg_rating, 0)

    query = (
        db.query(Provider, computed_rating.label("computed_rating"))
        .outerjoin(ratings_subquery, Provider.provider_id == ratings_subquery.c.provider_id)
    )
    if city:
        query = query.filter(Provider.city.ilike(f"%{city}%"))

    results = (
        query.order_by(computed_rating.desc(), Provider.provider_id.desc()).all()
    )

    providers: list[Provider] = []
    for provider, rating_value in results:
        provider.rating = _format_rating(rating_value)
        providers.append(provider)
    return providers


@router.get("/profile", response_model=dict)
def get_provider_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.provider.value, UserRole.admin.value)),
):
    """Get current provider's profile with stats"""
    provider = db.query(Provider).filter(Provider.owner_user_id == current_user.user_id).first()
    
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    
    # Get active subscription count (unique customers)
    active_subscriptions = db.query(Subscription).filter(
        Subscription.provider_id == provider.provider_id,
        Subscription.status == SubscriptionStatus.active,
    ).all()
    
    unique_customers = len(set(sub.user_id for sub in active_subscriptions))
    
    # Get total orders
    total_orders = db.query(Order).filter(
        Order.provider_id == provider.provider_id
    ).count()
    
    # Get menu items count
    menu_items_count = db.query(MenuItem).filter(
        MenuItem.provider_id == provider.provider_id
    ).count()
    
    avg_rating = (
        db.query(func.avg(Feedback.rating))
        .filter(Feedback.provider_id == provider.provider_id)
        .scalar()
    )

    return {
        "provider_id": provider.provider_id,
        "owner_user_id": provider.owner_user_id,
        "owner_name": provider.owner_name,
        "mess_name": provider.mess_name,
        "city": provider.city,
        "contact": provider.contact,
        "rating": _format_rating(avg_rating),
        "created_at": provider.created_at.isoformat() if provider.created_at else None,
        "active_customers": unique_customers,
        "total_orders": total_orders,
        "menu_items_count": menu_items_count,
    }


@router.get("/pricing", response_model=ProviderPricingResponse)
def get_current_provider_pricing(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.provider.value)),
):
    """Get current provider's subscription pricing."""
    provider = db.query(Provider).filter(Provider.owner_user_id == current_user.user_id).first()
    
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    
    return {
        "weekly_price": provider.weekly_price,
        "monthly_price": provider.monthly_price,
    }


@router.put("/pricing", response_model=ProviderPricingResponse)
def update_provider_pricing(
    payload: ProviderPricingUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.provider.value)),
):
    """Update current provider's subscription pricing."""
    provider = db.query(Provider).filter(Provider.owner_user_id == current_user.user_id).first()
    
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    
    provider.weekly_price = payload.weekly_price
    provider.monthly_price = payload.monthly_price
    db.commit()
    db.refresh(provider)
    
    return {
        "weekly_price": provider.weekly_price,
        "monthly_price": provider.monthly_price,
    }


@router.get("/{provider_id}/pricing", response_model=ProviderPricingResponse)
def get_provider_pricing(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get any provider's pricing (for customers viewing providers)."""
    provider = db.query(Provider).filter(Provider.provider_id == provider_id).first()
    
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    return {
        "weekly_price": provider.weekly_price,
        "monthly_price": provider.monthly_price,
    }


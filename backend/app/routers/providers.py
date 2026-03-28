from decimal import Decimal, ROUND_HALF_UP
import math
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.deps import get_current_user, require_roles
from app.models import (
    Feedback,
    MenuItem,
    Order,
    Provider,
    ProviderPhoto,
    SubscriptionMeal,
    SubscriptionMealStatus,
    Subscription,
    SubscriptionStatus,
    User,
    UserRole,
    WalletTransaction,
    WalletTransactionType,
)
from app.schemas import (
    ProviderCreateRequest,
    ProviderDashboardResponse,
    ProviderLocationUpdateRequest,
    ProviderPhotoResponse,
    ProviderPricingResponse,
    ProviderPricingUpdateRequest,
    ProviderResponse,
)
from app.services import next_display_order, provider_photo_folder, provider_photo_url


router = APIRouter(prefix="/providers", tags=["Providers"])

NON_VEG_KEYWORDS = {
    "chicken",
    "mutton",
    "fish",
    "prawn",
    "prawns",
    "egg",
    "eggs",
    "meat",
    "keema",
    "biryani",
}
VEG_KEYWORDS = {
    "paneer",
    "dal",
    "rajma",
    "chole",
    "chana",
    "veg",
    "vegetable",
    "aloo",
    "palak",
    "kadhi",
    "kofta",
    "mushroom",
    "soya",
    "tofu",
    "salad",
}


def _format_rating(value: Decimal | float | None) -> Decimal:
    if value in (None, ""):
        return Decimal("0.0")
    return Decimal(str(value)).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)


def _provider_offers_veg(provider: Provider) -> bool:
    dishes = [
        str(dish).strip().lower()
        for menu_item in provider.menu_items
        for dish in (menu_item.dishes or [])
        if str(dish).strip()
    ]

    if not dishes:
        return True

    has_veg_dish = any(keyword in dish for dish in dishes for keyword in VEG_KEYWORDS)
    has_non_veg_dish = any(keyword in dish for dish in dishes for keyword in NON_VEG_KEYWORDS)

    if has_veg_dish:
        return True

    return not has_non_veg_dish


def _to_decimal(value: float | Decimal | None, digits: str = "0.01") -> Decimal | None:
    if value is None:
        return None
    return Decimal(str(value)).quantize(Decimal(digits), rounding=ROUND_HALF_UP)


def _distance_km(
    provider_lat: Decimal | None,
    provider_lng: Decimal | None,
    customer_lat: Decimal | None,
    customer_lng: Decimal | None,
) -> Decimal | None:
    if None in (provider_lat, provider_lng, customer_lat, customer_lng):
        return None

    lat1 = math.radians(float(provider_lat))
    lng1 = math.radians(float(provider_lng))
    lat2 = math.radians(float(customer_lat))
    lng2 = math.radians(float(customer_lng))

    dlat = lat2 - lat1
    dlng = lng2 - lng1
    hav = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    distance = 6371.0 * 2 * math.atan2(math.sqrt(hav), math.sqrt(1 - hav))
    return _to_decimal(distance)


def _serialize_provider(
    provider: Provider,
    rating_value: Decimal | float | None,
    customer_latitude: Decimal | None = None,
    customer_longitude: Decimal | None = None,
) -> ProviderResponse:
    distance = _distance_km(
        provider.service_latitude,
        provider.service_longitude,
        customer_latitude,
        customer_longitude,
    )
    return ProviderResponse(
        provider_id=provider.provider_id,
        owner_name=provider.owner_name,
        mess_name=provider.mess_name,
        city=provider.city,
        contact=provider.contact,
        service_address_text=provider.service_address_text,
        service_place_id=provider.service_place_id,
        service_latitude=provider.service_latitude,
        service_longitude=provider.service_longitude,
        service_radius_km=provider.service_radius_km,
        rating=_format_rating(rating_value),
        weekly_price=provider.weekly_price,
        monthly_price=provider.monthly_price,
        distance_km=distance,
        photo_urls=[
            provider_photo_url(photo.file_path)
            for photo in sorted(provider.photos, key=lambda item: (item.display_order, item.photo_id))
        ],
    )


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
            service_address_text=payload.service_address_text,
            service_place_id=payload.service_place_id,
            service_latitude=payload.service_latitude,
            service_longitude=payload.service_longitude,
            service_radius_km=payload.service_radius_km,
        )
        db.add(provider)
        db.commit()
        db.refresh(provider)
        return _serialize_provider(provider, provider.rating)

    raise HTTPException(status_code=400, detail="Admin provider creation is not enabled")


@router.get("", response_model=list[ProviderResponse])
def list_providers(
    city: str | None = Query(default=None),
    diet_mode: str | None = Query(default=None, pattern="^(veg|nonveg)$"),
    customer_latitude: Decimal | None = Query(default=None, ge=-90, le=90),
    customer_longitude: Decimal | None = Query(default=None, ge=-180, le=180),
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
        .options(selectinload(Provider.menu_items), selectinload(Provider.photos))
        .outerjoin(ratings_subquery, Provider.provider_id == ratings_subquery.c.provider_id)
    )
    if city:
        query = query.filter(Provider.city.ilike(f"%{city}%"))

    results = query.order_by(computed_rating.desc(), Provider.provider_id.desc()).all()

    providers: list[ProviderResponse] = []
    for provider, rating_value in results:
        if diet_mode == "veg" and not _provider_offers_veg(provider):
            continue
        if customer_latitude is not None or customer_longitude is not None:
            if customer_latitude is None or customer_longitude is None:
                continue
            distance = _distance_km(
                provider.service_latitude,
                provider.service_longitude,
                customer_latitude,
                customer_longitude,
            )
            if distance is None or provider.service_radius_km is None or distance > provider.service_radius_km:
                continue

        providers.append(
            _serialize_provider(
                provider,
                rating_value,
                customer_latitude=customer_latitude,
                customer_longitude=customer_longitude,
            )
        )
    return providers


@router.get("/profile", response_model=ProviderDashboardResponse)
def get_provider_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.provider.value, UserRole.admin.value)),
):
    provider = (
        db.query(Provider)
        .options(selectinload(Provider.photos))
        .filter(Provider.owner_user_id == current_user.user_id)
        .first()
    )

    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    active_subscriptions = db.query(Subscription).filter(
        Subscription.provider_id == provider.provider_id,
        Subscription.status == SubscriptionStatus.active,
    ).all()
    unique_customers = len(set(sub.user_id for sub in active_subscriptions))

    total_orders = db.query(Order).filter(Order.provider_id == provider.provider_id).count()
    menu_items_count = db.query(MenuItem).filter(MenuItem.provider_id == provider.provider_id).count()
    avg_rating = (
        db.query(func.avg(Feedback.rating))
        .filter(Feedback.provider_id == provider.provider_id)
        .scalar()
    )
    next_service_date = (
        db.query(func.min(SubscriptionMeal.service_date))
        .filter(
            SubscriptionMeal.provider_id == provider.provider_id,
            SubscriptionMeal.status == SubscriptionMealStatus.scheduled,
        )
        .scalar()
    )
    upcoming_breakfast_count = db.query(SubscriptionMeal).filter(
        SubscriptionMeal.provider_id == provider.provider_id,
        SubscriptionMeal.service_date == next_service_date,
        SubscriptionMeal.meal_type == "breakfast",
        SubscriptionMeal.status == SubscriptionMealStatus.scheduled,
    ).count() if next_service_date else 0
    upcoming_lunch_count = db.query(SubscriptionMeal).filter(
        SubscriptionMeal.provider_id == provider.provider_id,
        SubscriptionMeal.service_date == next_service_date,
        SubscriptionMeal.meal_type == "lunch",
        SubscriptionMeal.status == SubscriptionMealStatus.scheduled,
    ).count() if next_service_date else 0
    upcoming_dinner_count = db.query(SubscriptionMeal).filter(
        SubscriptionMeal.provider_id == provider.provider_id,
        SubscriptionMeal.service_date == next_service_date,
        SubscriptionMeal.meal_type == "dinner",
        SubscriptionMeal.status == SubscriptionMealStatus.scheduled,
    ).count() if next_service_date else 0
    cancelled_meals_count = db.query(SubscriptionMeal).filter(
        SubscriptionMeal.provider_id == provider.provider_id,
        SubscriptionMeal.status == SubscriptionMealStatus.cancelled,
    ).count()
    wallet_credit_issued = (
        db.query(func.coalesce(func.sum(WalletTransaction.amount), 0))
        .filter(
            WalletTransaction.transaction_type == WalletTransactionType.credit,
            WalletTransaction.source_type == "meal_cancellation",
        )
        .join(User, User.user_id == WalletTransaction.user_id)
        .join(SubscriptionMeal, SubscriptionMeal.subscription_meal_id == WalletTransaction.source_id)
        .filter(SubscriptionMeal.provider_id == provider.provider_id)
        .scalar()
    )

    return {
        "provider_id": provider.provider_id,
        "owner_user_id": provider.owner_user_id,
        "owner_name": provider.owner_name,
        "mess_name": provider.mess_name,
        "city": provider.city,
        "contact": provider.contact,
        "service_address_text": provider.service_address_text,
        "service_place_id": provider.service_place_id,
        "service_latitude": provider.service_latitude,
        "service_longitude": provider.service_longitude,
        "service_radius_km": provider.service_radius_km,
        "rating": _format_rating(avg_rating),
        "created_at": provider.created_at.isoformat() if provider.created_at else None,
        "active_customers": unique_customers,
        "total_orders": total_orders,
        "menu_items_count": menu_items_count,
        "next_service_date": next_service_date,
        "upcoming_breakfast_count": upcoming_breakfast_count,
        "upcoming_lunch_count": upcoming_lunch_count,
        "upcoming_dinner_count": upcoming_dinner_count,
        "cancelled_meals_count": cancelled_meals_count,
        "wallet_credit_issued": _to_decimal(wallet_credit_issued or 0),
        "photos": [
            {
                "photo_id": photo.photo_id,
                "photo_url": provider_photo_url(photo.file_path),
                "display_order": photo.display_order,
                "is_primary": photo.is_primary,
                "created_at": photo.created_at,
            }
            for photo in sorted(provider.photos, key=lambda item: (item.display_order, item.photo_id))
        ],
    }


@router.put("/profile/location", response_model=ProviderResponse)
def update_provider_location(
    payload: ProviderLocationUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.provider.value)),
):
    provider = db.query(Provider).filter(Provider.owner_user_id == current_user.user_id).first()

    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    provider.city = payload.city
    provider.service_address_text = payload.service_address_text
    provider.service_place_id = payload.service_place_id
    provider.service_latitude = payload.service_latitude
    provider.service_longitude = payload.service_longitude
    provider.service_radius_km = payload.service_radius_km
    current_user.location = payload.city[:120]

    db.add(provider)
    db.add(current_user)
    db.commit()
    db.refresh(provider)
    return _serialize_provider(provider, provider.rating)


@router.get("/pricing", response_model=ProviderPricingResponse)
def get_current_provider_pricing(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.provider.value)),
):
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
    provider = db.query(Provider).filter(Provider.provider_id == provider_id).first()

    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    return {
        "weekly_price": provider.weekly_price,
        "monthly_price": provider.monthly_price,
    }


@router.get("/photos", response_model=list[ProviderPhotoResponse])
def list_provider_photos(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.provider.value)),
):
    provider = db.query(Provider).filter(Provider.owner_user_id == current_user.user_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    photos = (
        db.query(ProviderPhoto)
        .filter(ProviderPhoto.provider_id == provider.provider_id)
        .order_by(ProviderPhoto.display_order.asc(), ProviderPhoto.photo_id.asc())
        .all()
    )
    return [
        {
            "photo_id": photo.photo_id,
            "photo_url": provider_photo_url(photo.file_path),
            "display_order": photo.display_order,
            "is_primary": photo.is_primary,
            "created_at": photo.created_at,
        }
        for photo in photos
    ]


@router.post("/photos", response_model=list[ProviderPhotoResponse], status_code=status.HTTP_201_CREATED)
def upload_provider_photos(
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.provider.value)),
):
    provider = db.query(Provider).filter(Provider.owner_user_id == current_user.user_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    existing_count = db.query(ProviderPhoto).filter(ProviderPhoto.provider_id == provider.provider_id).count()
    if existing_count + len(files) > 5:
        raise HTTPException(status_code=400, detail="You can upload at most 5 photos.")

    target_folder = provider_photo_folder(provider, current_user)
    created: list[ProviderPhoto] = []

    for file in files:
        suffix = Path(file.filename or "photo.jpg").suffix or ".jpg"
        file_name = f"{provider.provider_id}-{provider.owner_user_id}-{existing_count + len(created)}-{abs(hash(file.filename or 'photo')) % 100000}{suffix}"
        destination = target_folder / file_name
        content = file.file.read()
        destination.write_bytes(content)

        photo = ProviderPhoto(
            provider_id=provider.provider_id,
            file_path=str(destination),
            display_order=next_display_order(db, provider.provider_id) + len(created),
            is_primary=(existing_count == 0 and len(created) == 0),
        )
        db.add(photo)
        created.append(photo)

    db.commit()
    for photo in created:
        db.refresh(photo)

    return [
        {
            "photo_id": photo.photo_id,
            "photo_url": provider_photo_url(photo.file_path),
            "display_order": photo.display_order,
            "is_primary": photo.is_primary,
            "created_at": photo.created_at,
        }
        for photo in created
    ]


@router.delete("/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_provider_photo(
    photo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.provider.value)),
):
    provider = db.query(Provider).filter(Provider.owner_user_id == current_user.user_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    photo = (
        db.query(ProviderPhoto)
        .filter(ProviderPhoto.photo_id == photo_id, ProviderPhoto.provider_id == provider.provider_id)
        .first()
    )
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    file_path = Path(photo.file_path)
    if file_path.exists():
        file_path.unlink()

    db.delete(photo)
    db.commit()
    return None

from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user, require_roles
from app.models import DishFoodType, MenuItem, Provider, ProviderFoodCategory, User, UserRole
from app.schemas import MenuItemResponse, MenuUploadRequest


router = APIRouter(prefix="/menu", tags=["Menu"])


def _normalize_dish_items(payload: MenuUploadRequest) -> list[dict[str, str]]:
    if payload.dish_items:
        normalized = [
            {
                "name": item.name.strip(),
                "food_type": item.food_type.value,
            }
            for item in payload.dish_items
            if item.name.strip()
        ]
        if normalized:
            return normalized

    if payload.dishes:
        normalized = [
            {
                "name": dish.strip(),
                "food_type": DishFoodType.veg.value,
            }
            for dish in payload.dishes
            if dish.strip()
        ]
        if normalized:
            return normalized

    raise HTTPException(status_code=400, detail="At least one dish is required")


def _ensure_dish_items(item: MenuItem) -> bool:
    if item.dish_items:
        return False

    item.dish_items = [
        {
            "name": str(dish).strip(),
            "food_type": DishFoodType.veg.value,
        }
        for dish in (item.dishes or [])
        if str(dish).strip()
    ]
    return True


@router.post("/upload", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED)
def upload_menu(
    payload: MenuUploadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.provider.value, UserRole.admin.value)),
):
    # Get current user's provider
    provider = (
        db.query(Provider)
        .filter(Provider.owner_user_id == current_user.user_id)
        .first()
    )
    
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    dish_items = _normalize_dish_items(payload)
    if (
        provider.provider_food_category == ProviderFoodCategory.pure_veg
        and any(item["food_type"] == DishFoodType.nonveg.value for item in dish_items)
    ):
        raise HTTPException(
            status_code=400,
            detail="Pure veg providers cannot add non-veg dishes.",
        )

    dishes = [item["name"] for item in dish_items]

    existing = (
        db.query(MenuItem)
        .filter(
            MenuItem.provider_id == provider.provider_id,
            MenuItem.day == payload.day,
            MenuItem.meal_type == payload.meal_type,
        )
        .first()
    )

    if existing:
        existing.dishes = dishes
        existing.dish_items = dish_items
        existing.price = Decimal('0')  # Price managed separately in subscription settings
        existing.image_url = None
        db.commit()
        db.refresh(existing)
        return existing

    item = MenuItem(
        provider_id=provider.provider_id,
        day=payload.day,
        meal_type=payload.meal_type,
        dishes=dishes,
        dish_items=dish_items,
        price=Decimal('0'),  # Price managed separately in subscription settings
        image_url=None,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/me", response_model=list[MenuItemResponse])
def get_my_menu(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.provider.value)),
):
    """Get current provider's menu items"""
    provider = (
        db.query(Provider)
        .filter(Provider.owner_user_id == current_user.user_id)
        .first()
    )
    
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    items = (
        db.query(MenuItem)
        .filter(MenuItem.provider_id == provider.provider_id)
        .order_by(MenuItem.day, MenuItem.meal_type)
        .all()
    )
    changed = False
    for item in items:
        changed = _ensure_dish_items(item) or changed
    if changed:
        db.commit()
    return items


@router.get("/provider/{provider_id}", response_model=list[MenuItemResponse])
def get_provider_menu(
    provider_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Get menu items for a specific provider"""
    provider = db.get(Provider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    items = (
        db.query(MenuItem)
        .filter(MenuItem.provider_id == provider_id)
        .order_by(MenuItem.day, MenuItem.meal_type)
        .all()
    )
    changed = False
    for item in items:
        changed = _ensure_dish_items(item) or changed
    if changed:
        db.commit()
    return items


@router.get("/public/provider/{provider_id}", response_model=list[MenuItemResponse])
def get_public_provider_menu(
    provider_id: int,
    db: Session = Depends(get_db),
):
    """Get menu items for a specific provider without authentication."""
    provider = db.get(Provider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    return (
        db.query(MenuItem)
        .filter(MenuItem.provider_id == provider_id)
        .order_by(MenuItem.day, MenuItem.meal_type)
        .all()
    )


@router.delete("/{menu_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu_item(
    menu_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.provider.value)),
):
    """Delete a menu item - only provider who owns it can delete"""
    menu_item = db.get(MenuItem, menu_id)
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    # Check if provider owns this menu item
    if menu_item.provider.owner_user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Cannot delete another provider's menu item")

    db.delete(menu_item)
    db.commit()
    return None

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import UserLocationUpdateRequest, UserResponse


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=UserResponse)
def profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile/location", response_model=UserResponse)
def update_location(
    payload: UserLocationUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.location = payload.location_text[:120]
    current_user.location_text = payload.location_text
    current_user.place_id = payload.place_id
    current_user.current_latitude = payload.current_latitude
    current_user.current_longitude = payload.current_longitude

    if payload.delivery_address:
        current_user.delivery_address = payload.delivery_address

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

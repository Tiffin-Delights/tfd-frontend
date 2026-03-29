from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import (
    ChangePasswordRequest,
    MessageResponse,
    UserLocationUpdateRequest,
    UserResponse,
    WalletSummaryResponse,
)
from app.services import get_or_create_wallet


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=UserResponse)
def profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wallet = get_or_create_wallet(db, current_user)
    db.commit()
    db.refresh(current_user)
    return {
        **UserResponse.model_validate(current_user).model_dump(),
        "wallet_balance": wallet.balance,
    }


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
    wallet = get_or_create_wallet(db, current_user)
    db.commit()
    return {
        **UserResponse.model_validate(current_user).model_dump(),
        "wallet_balance": wallet.balance,
    }


@router.get("/wallet", response_model=WalletSummaryResponse)
def get_wallet(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wallet = get_or_create_wallet(db, current_user)
    transactions = list(reversed(wallet.transactions[-20:])) if wallet.transactions else []
    db.commit()
    return {
        "balance": wallet.balance,
        "transactions": transactions,
    }


@router.put("/password", response_model=MessageResponse)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password",
        )

    current_user.password_hash = hash_password(payload.new_password)
    db.add(current_user)
    db.commit()
    return {"message": "Password updated successfully."}

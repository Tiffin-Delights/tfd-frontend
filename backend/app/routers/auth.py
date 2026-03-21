from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.db import get_db
from app.models import Provider, User, UserRole
from app.schemas import LoginRequest, TokenResponse, UserRegisterRequest, UserResponse


router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    if payload.role == UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin self-registration is not allowed")

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    existing_phone = db.query(User).filter(User.phone == payload.phone).first()
    if existing_phone:
        raise HTTPException(status_code=409, detail="Phone already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=payload.role,
        location=payload.location,
        delivery_address=payload.delivery_address,
    )
    db.add(user)
    db.flush()

    if payload.role == UserRole.provider:
        if not payload.mess_name or not payload.city:
            raise HTTPException(
                status_code=400,
                detail="Provider registration requires mess_name and city",
            )

        provider_profile = Provider(
            owner_user_id=user.user_id,
            owner_name=payload.name,
            mess_name=payload.mess_name,
            city=payload.city,
            contact=payload.contact or payload.phone,
        )
        db.add(provider_profile)

    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(subject=str(user.user_id), role=user.role.value)
    return TokenResponse(access_token=token, user=user)

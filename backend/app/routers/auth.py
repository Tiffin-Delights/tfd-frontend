from datetime import datetime, timedelta, timezone
import re
from secrets import token_urlsafe

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.db import get_db
from app.models import Provider, User, UserRole
from app.schemas import (
    LoginRequest,
    MessageResponse,
    PasswordResetOtpConfirmResponse,
    PasswordResetOtpConfirmRequest,
    PasswordResetOtpRequest,
    PasswordResetOtpResponse,
    TokenResponse,
    UserRegisterRequest,
    UserResponse,
)
from app.services_otp import generate_numeric_otp, send_email_otp, send_sms_otp


router = APIRouter(prefix="/auth", tags=["Auth"])


OTP_CHALLENGE_STORE: dict[str, dict] = {}
LAST_OTP_REQUEST_AT: dict[str, datetime] = {}


def _normalize_phone_variants(raw_phone: str) -> tuple[list[str], str]:
    stripped = (raw_phone or "").strip()
    if not stripped:
        raise HTTPException(status_code=400, detail="Phone is required for phone OTP.")

    digits_only = re.sub(r"\D", "", stripped)
    if stripped.startswith("+"):
        if not re.fullmatch(r"\+[1-9]\d{7,14}", stripped):
            raise HTTPException(
                status_code=400,
                detail="Phone must be in E.164 format, for example +919876543210.",
            )
        e164 = stripped
    else:
        if len(digits_only) == 10:
            e164 = f"+91{digits_only}"
        elif len(digits_only) == 12 and digits_only.startswith("91"):
            e164 = f"+{digits_only}"
        elif len(digits_only) == 11 and digits_only.startswith("0"):
            e164 = f"+91{digits_only[-10:]}"
        else:
            raise HTTPException(
                status_code=400,
                detail="Phone must be a valid Indian number (10 digits) or E.164 format (+91XXXXXXXXXX).",
            )

    e164_digits = e164.lstrip("+")
    local_10 = e164_digits[-10:]
    variants = [
        e164,
        e164_digits,
        local_10,
        f"91{local_10}",
        f"+91{local_10}",
    ]
    deduped_variants = list(dict.fromkeys(variants))
    return deduped_variants, e164


def _mask_email(email: str | None) -> str | None:
    if not email or "@" not in email:
        return None

    local_part, domain = email.split("@", 1)
    if len(local_part) <= 2:
        masked_local = local_part[0] + "*" * max(len(local_part) - 1, 0)
    else:
        masked_local = local_part[:2] + "*" * (len(local_part) - 2)
    return f"{masked_local}@{domain}"


def _purge_expired_otp_challenges() -> None:
    now = datetime.now(timezone.utc)
    expired = [
        challenge_id
        for challenge_id, payload in OTP_CHALLENGE_STORE.items()
        if payload.get("expires_at") is None or payload["expires_at"] < now
    ]
    for challenge_id in expired:
        OTP_CHALLENGE_STORE.pop(challenge_id, None)


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
        location=(payload.location or payload.location_text or "")[:120] or None,
        location_text=payload.location_text or payload.location,
        place_id=payload.place_id,
        current_latitude=payload.current_latitude,
        current_longitude=payload.current_longitude,
        delivery_address=payload.delivery_address,
    )
    db.add(user)
    db.flush()

    if payload.role == UserRole.provider:
        if (
            not payload.mess_name
            or not payload.city
            or not payload.service_address_text
            or not payload.service_place_id
            or payload.service_latitude is None
            or payload.service_longitude is None
            or payload.service_radius_km is None
        ):
            raise HTTPException(
                status_code=400,
                detail="Provider registration requires service location and delivery radius",
            )

        provider_profile = Provider(
            owner_user_id=user.user_id,
            owner_name=payload.name,
            mess_name=payload.mess_name,
            city=payload.city,
            contact=payload.contact or payload.phone,
            service_address_text=payload.service_address_text,
            service_place_id=payload.service_place_id,
            service_latitude=payload.service_latitude,
            service_longitude=payload.service_longitude,
            service_radius_km=payload.service_radius_km,
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


@router.post("/password-reset/request-otp", response_model=PasswordResetOtpResponse)
def request_password_reset_otp(payload: PasswordResetOtpRequest, db: Session = Depends(get_db)):
    _purge_expired_otp_challenges()
    now = datetime.now(timezone.utc)

    if payload.channel == "email":
        if not payload.email:
            raise HTTPException(status_code=400, detail="Email is required for email OTP.")
        lookup_key = f"email:{payload.email.strip().lower()}"
        user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
        sms_target = None
    else:
        variants, normalized_phone = _normalize_phone_variants(payload.phone or "")
        lookup_key = f"phone:{normalized_phone}"
        user = (
            db.query(User)
            .filter(User.phone.in_(variants))
            .first()
        )
        sms_target = normalized_phone

    if not user:
        raise HTTPException(status_code=404, detail="No account found for the selected channel.")

    if payload.channel == "email" and not user.email:
        raise HTTPException(status_code=400, detail="Selected account does not have an email configured.")

    if payload.channel == "phone" and not user.phone:
        raise HTTPException(status_code=400, detail="Selected account does not have a phone configured.")

    last_requested_at = LAST_OTP_REQUEST_AT.get(lookup_key)
    if last_requested_at:
        elapsed_seconds = int((now - last_requested_at).total_seconds())
        if elapsed_seconds < settings.otp_resend_after_seconds:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {settings.otp_resend_after_seconds - elapsed_seconds} seconds before requesting a new OTP.",
            )

    otp_code = generate_numeric_otp()
    expires_at = now + timedelta(minutes=settings.otp_expiry_minutes)
    challenge_id = token_urlsafe(24)

    if payload.channel == "email":
        send_email_otp(user.email, otp_code)
    else:
        send_sms_otp(sms_target or user.phone, otp_code)

    OTP_CHALLENGE_STORE[challenge_id] = {
        "user_id": user.user_id,
        "otp_code": otp_code,
        "channel": payload.channel,
        "expires_at": expires_at,
        "attempts": 0,
    }
    LAST_OTP_REQUEST_AT[lookup_key] = now

    return {
        "message": "OTP sent successfully.",
        "challenge_id": challenge_id,
        "expires_in_minutes": settings.otp_expiry_minutes,
        "resend_after_seconds": settings.otp_resend_after_seconds,
        "account_email_hint": _mask_email(user.email),
        "account_login_email": user.email if payload.channel == "phone" else None,
    }


@router.post("/password-reset/confirm", response_model=PasswordResetOtpConfirmResponse)
def confirm_password_reset_otp(payload: PasswordResetOtpConfirmRequest, db: Session = Depends(get_db)):
    _purge_expired_otp_challenges()

    challenge = OTP_CHALLENGE_STORE.get(payload.challenge_id)
    if not challenge:
        raise HTTPException(status_code=400, detail="Invalid or expired challenge.")

    if challenge["attempts"] >= settings.otp_max_attempts:
        OTP_CHALLENGE_STORE.pop(payload.challenge_id, None)
        raise HTTPException(status_code=400, detail="Maximum OTP attempts exceeded. Request a new OTP.")

    if str(payload.otp).strip() != challenge["otp_code"]:
        challenge["attempts"] += 1
        remaining = max(settings.otp_max_attempts - challenge["attempts"], 0)
        raise HTTPException(status_code=400, detail=f"Invalid OTP. Attempts left: {remaining}.")

    user = db.get(User, challenge["user_id"])
    if not user:
        OTP_CHALLENGE_STORE.pop(payload.challenge_id, None)
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(payload.new_password)
    db.add(user)
    db.commit()

    channel = challenge.get("channel")
    OTP_CHALLENGE_STORE.pop(payload.challenge_id, None)
    return {
        "message": "Password has been reset successfully.",
        "login_email": user.email if channel == "phone" else None,
    }

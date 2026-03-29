from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import jwt
from passlib.exc import UnknownHashError
from passlib.context import CryptContext

from app.core.config import settings


pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

BCRYPT_PREFIXES = ("$2a$", "$2b$", "$2y$")
PBKDF2_SHA256_PREFIX = "$pbkdf2-sha256$"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False

    if hashed_password.startswith(PBKDF2_SHA256_PREFIX):
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except (UnknownHashError, ValueError):
            return False

    if hashed_password.startswith(BCRYPT_PREFIXES):
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        except ValueError:
            return False

    return plain_password == hashed_password


def needs_password_rehash(hashed_password: str) -> bool:
    return not hashed_password.startswith(PBKDF2_SHA256_PREFIX)


def create_access_token(subject: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)

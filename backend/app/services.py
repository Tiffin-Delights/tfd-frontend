from __future__ import annotations

import re
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from uuid import uuid4

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import (
    MealType,
    Provider,
    ProviderPhoto,
    Subscription,
    SubscriptionMeal,
    SubscriptionMealStatus,
    SubscriptionPlan,
    User,
    Wallet,
    WalletTransaction,
    WalletTransactionType,
)


MEAL_TYPES = [MealType.breakfast, MealType.lunch, MealType.dinner]


def quantize_money(value: Decimal | int | float | str) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def get_plan_days(plan_type: SubscriptionPlan) -> int:
    return 7 if plan_type == SubscriptionPlan.weekly else 30


def get_plan_price(provider: Provider, plan_type: SubscriptionPlan) -> Decimal:
    return quantize_money(provider.weekly_price if plan_type == SubscriptionPlan.weekly else provider.monthly_price)


def get_or_create_wallet(db: Session, user: User) -> Wallet:
    wallet = db.query(Wallet).filter(Wallet.user_id == user.user_id).first()
    if wallet:
        return wallet

    wallet = Wallet(user_id=user.user_id, balance=quantize_money("0"))
    db.add(wallet)
    db.flush()
    return wallet


def record_wallet_transaction(
    db: Session,
    wallet: Wallet,
    transaction_type: WalletTransactionType,
    amount: Decimal,
    source_type: str | None = None,
    source_id: int | None = None,
    note: str | None = None,
) -> WalletTransaction:
    money = quantize_money(amount)
    if money <= 0:
        raise ValueError("Wallet transaction amount must be positive.")

    if transaction_type == WalletTransactionType.credit:
        wallet.balance = quantize_money(wallet.balance + money)
    else:
        wallet.balance = quantize_money(wallet.balance - money)

    transaction = WalletTransaction(
        wallet_id=wallet.wallet_id,
        user_id=wallet.user_id,
        transaction_type=transaction_type,
        amount=money,
        source_type=source_type,
        source_id=source_id,
        note=note,
    )
    db.add(wallet)
    db.add(transaction)
    db.flush()
    return transaction


def build_subscription_schedule(
    subscription: Subscription,
    provider: Provider,
) -> list[SubscriptionMeal]:
    total_days = (subscription.end_date - subscription.start_date).days + 1
    base_price = get_plan_price(provider, subscription.plan_type)
    total_units = max(total_days * len(MEAL_TYPES), 1)
    unit_price = quantize_money(base_price / Decimal(total_units))

    meals: list[SubscriptionMeal] = []
    for day_index in range(total_days):
        service_date = subscription.start_date + timedelta(days=day_index)
        cutoff_date = service_date - timedelta(days=1)
        cutoff_at = datetime.combine(
            cutoff_date,
            time(hour=settings.meal_cancellation_cutoff_hour),
            tzinfo=timezone.utc,
        )
        for meal_type in MEAL_TYPES:
            meals.append(
                SubscriptionMeal(
                    subscription_id=subscription.subscription_id,
                    provider_id=subscription.provider_id,
                    user_id=subscription.user_id,
                    service_date=service_date,
                    meal_type=meal_type,
                    unit_price=unit_price,
                    cutoff_at=cutoff_at,
                    status=SubscriptionMealStatus.scheduled,
                )
            )
    return meals


def ensure_subscription_meals(db: Session, subscription: Subscription, provider: Provider) -> list[SubscriptionMeal]:
    existing = (
        db.query(SubscriptionMeal)
        .filter(SubscriptionMeal.subscription_id == subscription.subscription_id)
        .all()
    )
    if existing:
        return existing

    meals = build_subscription_schedule(subscription, provider)
    for meal in meals:
        db.add(meal)
    db.flush()
    return meals


def provider_photo_folder(provider: Provider, user: User) -> Path:
    def slug(value: str | None) -> str:
        raw = (value or "unknown").strip().lower()
        return re.sub(r"[^a-z0-9]+", "-", raw).strip("-") or "unknown"

    folder_name = "__".join(
        [
            slug(provider.mess_name),
            slug(user.email),
            slug(provider.contact or user.phone or str(provider.provider_id)),
        ]
    )
    folder = Path(settings.uploads_dir) / "providers" / folder_name
    folder.mkdir(parents=True, exist_ok=True)
    return folder


def provider_photo_url(file_path: str) -> str:
    uploads_root = Path(settings.uploads_dir).resolve()
    relative = Path(file_path).resolve().relative_to(uploads_root)
    return f"/uploads/{relative.as_posix()}"


def next_display_order(db: Session, provider_id: int) -> int:
    current_count = db.query(ProviderPhoto).filter(ProviderPhoto.provider_id == provider_id).count()
    return current_count


def payment_transaction_id() -> str:
    return f"TFD-{uuid4().hex[:12].upper()}"


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def default_end_date(start_date: date, plan_type: SubscriptionPlan) -> date:
    return start_date + timedelta(days=get_plan_days(plan_type) - 1)

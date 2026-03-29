from datetime import date, datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Enum as SqlEnum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class UserRole(str, Enum):
    customer = "customer"
    provider = "provider"
    admin = "admin"


class MealType(str, Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    snacks = "snacks"
    dinner = "dinner"


class DayOfWeek(str, Enum):
    monday = "monday"
    tuesday = "tuesday"
    wednesday = "wednesday"
    thursday = "thursday"
    friday = "friday"
    saturday = "saturday"
    sunday = "sunday"


class OrderType(str, Enum):
    subscription = "subscription"
    one_time = "one-time"


class PaymentStatus(str, Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"


class SubscriptionPlan(str, Enum):
    weekly = "weekly"
    monthly = "monthly"


class SubscriptionStatus(str, Enum):
    active = "active"
    paused = "paused"
    cancelled = "cancelled"
    expired = "expired"


class SubscriptionMealStatus(str, Enum):
    scheduled = "scheduled"
    cancelled = "cancelled"
    consumed = "consumed"


class WalletTransactionType(str, Enum):
    credit = "credit"
    debit = "debit"


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SqlEnum(UserRole), nullable=False, index=True)
    location: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    location_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    place_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    current_latitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    current_longitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    delivery_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    provider_profile: Mapped["Provider | None"] = relationship(
        back_populates="owner", uselist=False
    )
    wallet: Mapped["Wallet | None"] = relationship(back_populates="user", uselist=False)


class Provider(Base):
    __tablename__ = "providers"

    provider_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False
    )
    owner_name: Mapped[str] = mapped_column(String(120), nullable=False)
    mess_name: Mapped[str] = mapped_column(String(180), nullable=False, index=True)
    city: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    contact: Mapped[str] = mapped_column(String(20), nullable=False)
    service_address_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    service_place_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    service_latitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    service_longitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    service_radius_km: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    rating: Mapped[Decimal] = mapped_column(Numeric(2, 1), nullable=False, server_default="0")
    weekly_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, server_default="899")
    monthly_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, server_default="3299")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    owner: Mapped[User] = relationship(back_populates="provider_profile")
    menu_items: Mapped[list["MenuItem"]] = relationship(back_populates="provider")
    photos: Mapped[list["ProviderPhoto"]] = relationship(
        back_populates="provider", cascade="all, delete-orphan"
    )


class MenuItem(Base):
    __tablename__ = "menu"

    menu_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    provider_id: Mapped[int] = mapped_column(
        ForeignKey("providers.provider_id", ondelete="CASCADE"), nullable=False, index=True
    )
    day: Mapped[DayOfWeek] = mapped_column(SqlEnum(DayOfWeek), nullable=False)
    meal_type: Mapped[MealType] = mapped_column(SqlEnum(MealType), nullable=False)
    dishes: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    provider: Mapped[Provider] = relationship(back_populates="menu_items")

    __table_args__ = (
        Index("idx_menu_provider_day_meal", "provider_id", "day", "meal_type", unique=True),
    )


class Order(Base):
    __tablename__ = "orders"

    order_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True
    )
    provider_id: Mapped[int] = mapped_column(
        ForeignKey("providers.provider_id", ondelete="CASCADE"), nullable=False, index=True
    )
    order_type: Mapped[OrderType] = mapped_column(SqlEnum(OrderType), nullable=False)
    payment_status: Mapped[PaymentStatus] = mapped_column(
        SqlEnum(PaymentStatus), nullable=False, server_default=PaymentStatus.pending.value
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        CheckConstraint("total_amount >= 0", name="chk_orders_total_amount_non_negative"),
    )


class Subscription(Base):
    __tablename__ = "subscriptions"

    subscription_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True
    )
    provider_id: Mapped[int] = mapped_column(
        ForeignKey("providers.provider_id", ondelete="CASCADE"), nullable=False, index=True
    )
    plan_type: Mapped[SubscriptionPlan] = mapped_column(SqlEnum(SubscriptionPlan), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[SubscriptionStatus] = mapped_column(
        SqlEnum(SubscriptionStatus), nullable=False, server_default=SubscriptionStatus.active.value
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    meals: Mapped[list["SubscriptionMeal"]] = relationship(
        back_populates="subscription", cascade="all, delete-orphan"
    )


class Payment(Base):
    __tablename__ = "payments"

    payment_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True
    )
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.order_id", ondelete="CASCADE"), nullable=False, index=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(SqlEnum(PaymentStatus), nullable=False)
    payment_gateway: Mapped[str] = mapped_column(String(32), nullable=False, default="razorpay")
    transaction_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Feedback(Base):
    __tablename__ = "feedback"

    feedback_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True
    )
    provider_id: Mapped[int] = mapped_column(
        ForeignKey("providers.provider_id", ondelete="CASCADE"), nullable=False, index=True
    )
    rating: Mapped[Decimal] = mapped_column(Numeric(2, 1), nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        CheckConstraint(
            "rating BETWEEN 1 AND 5 AND mod(rating * 10, 5) = 0",
            name="chk_feedback_rating_range",
        ),
        Index("idx_feedback_provider_created", "provider_id", "created_at"),
    )


class Wallet(Base):
    __tablename__ = "wallets"

    wallet_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    balance: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, server_default="0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped[User] = relationship(back_populates="wallet")
    transactions: Mapped[list["WalletTransaction"]] = relationship(
        back_populates="wallet", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("balance >= 0", name="chk_wallet_balance_non_negative"),
    )


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    wallet_transaction_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    wallet_id: Mapped[int] = mapped_column(
        ForeignKey("wallets.wallet_id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True
    )
    transaction_type: Mapped[WalletTransactionType] = mapped_column(
        SqlEnum(WalletTransactionType), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    source_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    source_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    wallet: Mapped[Wallet] = relationship(back_populates="transactions")


class SubscriptionMeal(Base):
    __tablename__ = "subscription_meals"

    subscription_meal_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subscription_id: Mapped[int] = mapped_column(
        ForeignKey("subscriptions.subscription_id", ondelete="CASCADE"), nullable=False, index=True
    )
    provider_id: Mapped[int] = mapped_column(
        ForeignKey("providers.provider_id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True
    )
    service_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    meal_type: Mapped[MealType] = mapped_column(SqlEnum(MealType), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[SubscriptionMealStatus] = mapped_column(
        SqlEnum(SubscriptionMealStatus),
        nullable=False,
        server_default=SubscriptionMealStatus.scheduled.value,
        index=True,
    )
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cutoff_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    subscription: Mapped[Subscription] = relationship(back_populates="meals")

    __table_args__ = (
        Index(
            "idx_subscription_meal_unique",
            "subscription_id",
            "service_date",
            "meal_type",
            unique=True,
        ),
    )


class ProviderPhoto(Base):
    __tablename__ = "provider_photos"

    photo_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    provider_id: Mapped[int] = mapped_column(
        ForeignKey("providers.provider_id", ondelete="CASCADE"), nullable=False, index=True
    )
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    is_primary: Mapped[bool] = mapped_column(nullable=False, default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    provider: Mapped[Provider] = relationship(back_populates="photos")


Index("idx_orders_user_provider", Order.user_id, Order.provider_id)
Index("idx_subscriptions_user_provider", Subscription.user_id, Subscription.provider_id)
Index("idx_users_role_location", User.role, User.location)
Index("idx_users_geo_coords", User.current_latitude, User.current_longitude)
Index("idx_providers_geo_coords", Provider.service_latitude, Provider.service_longitude)
Index("idx_wallet_transactions_user_created", WalletTransaction.user_id, WalletTransaction.created_at)
Index(
    "idx_subscription_meals_provider_date_status",
    SubscriptionMeal.provider_id,
    SubscriptionMeal.service_date,
    SubscriptionMeal.status,
)

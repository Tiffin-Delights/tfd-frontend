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
    # TODO: v2.0 - Remove one-time after subscription MVP is stable; MVP is subscription-only
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


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SqlEnum(UserRole), nullable=False, index=True)
    location: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
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
    rating: Mapped[Decimal] = mapped_column(Numeric(2, 1), nullable=False, server_default="0")
    weekly_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, server_default="899")
    monthly_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, server_default="3299")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    owner: Mapped[User] = relationship(back_populates="provider_profile")
    menu_items: Mapped[list["MenuItem"]] = relationship(back_populates="provider")


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
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="chk_feedback_rating_range"),
        Index("idx_feedback_provider_created", "provider_id", "created_at"),
    )


Index("idx_orders_user_provider", Order.user_id, Order.provider_id)
Index("idx_subscriptions_user_provider", Subscription.user_id, Subscription.provider_id)
Index("idx_users_role_location", User.role, User.location)

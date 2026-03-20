from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.models import (
    DayOfWeek,
    MealType,
    OrderType,
    PaymentStatus,
    SubscriptionPlan,
    SubscriptionStatus,
    UserRole,
)


class UserRegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=8, max_length=20)
    password: str = Field(min_length=6, max_length=128)
    role: UserRole = UserRole.customer
    location: str | None = Field(default=None, max_length=120)
    delivery_address: str | None = Field(default=None, min_length=8, max_length=500)
    mess_name: str | None = Field(default=None, min_length=2, max_length=180)
    city: str | None = Field(default=None, min_length=2, max_length=120)
    contact: str | None = Field(default=None, min_length=8, max_length=20)


class UserResponse(BaseModel):
    class Config:
        from_attributes = True

    user_id: int
    name: str
    email: EmailStr
    phone: str | None
    role: UserRole
    location: str | None
    delivery_address: str | None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ProviderCreateRequest(BaseModel):
    owner_name: str = Field(min_length=2, max_length=120)
    mess_name: str = Field(min_length=2, max_length=180)
    city: str = Field(min_length=2, max_length=120)
    contact: str = Field(min_length=8, max_length=20)


class ProviderResponse(BaseModel):
    class Config:
        from_attributes = True

    provider_id: int
    owner_name: str
    mess_name: str
    city: str
    contact: str
    rating: Decimal
    weekly_price: Decimal
    monthly_price: Decimal


class ProviderPricingResponse(BaseModel):
    class Config:
        from_attributes = True

    weekly_price: Decimal
    monthly_price: Decimal


class ProviderPricingUpdateRequest(BaseModel):
    weekly_price: Decimal = Field(gt=0)
    monthly_price: Decimal = Field(gt=0)


class MenuUploadRequest(BaseModel):
    day: DayOfWeek
    meal_type: MealType
    dishes: list[str] = Field(min_length=1)


class MenuItemResponse(BaseModel):
    class Config:
        from_attributes = True
        populate_by_name = True

    menu_id: int
    provider_id: int
    day: DayOfWeek
    meal_type: MealType
    dishes: list[str]

    @property
    def id(self):
        """Alias for menu_id for frontend compatibility"""
        return self.menu_id


class OrderCreateRequest(BaseModel):
    """Create a subscription order (subscription-only; one-time orders not supported).
    
    Note: This MVP accepts only order_type='subscription'. All transactions are subscription-based.
    Use /subscriptions/manage endpoint to create subscriptions with pricing and plan details.
    """
    provider_id: int
    order_type: OrderType
    start_date: date
    end_date: date | None = None
    total_amount: Decimal = Field(gt=0)


class OrderResponse(BaseModel):
    class Config:
        from_attributes = True

    order_id: int
    user_id: int
    provider_id: int
    order_type: OrderType
    payment_status: PaymentStatus
    start_date: date
    end_date: date | None
    total_amount: Decimal


class OrderDetailResponse(OrderResponse):
    customer_name: str | None = None
    created_at: datetime | None = None


class SubscriptionManageRequest(BaseModel):
    provider_id: int
    plan_type: SubscriptionPlan
    start_date: date
    end_date: date
    status: SubscriptionStatus = SubscriptionStatus.active


class SubscriptionResponse(BaseModel):
    class Config:
        from_attributes = True

    subscription_id: int
    user_id: int
    provider_id: int
    plan_type: SubscriptionPlan
    start_date: date
    end_date: date
    status: SubscriptionStatus


class SubscriptionDetailResponse(SubscriptionResponse):
    customer_name: str | None = None
    customer_email: str | None = None
    customer_phone: str | None = None
    customer_location: str | None = None
    duration_days: int | None = None
    created_at: datetime | None = None


class PaymentVerifyRequest(BaseModel):
    order_id: int
    amount: Decimal = Field(gt=0)
    status: PaymentStatus
    transaction_id: str = Field(min_length=5, max_length=255)
    payment_gateway: Literal["razorpay"] = "razorpay"
    razorpay_signature: str | None = None


class PaymentResponse(BaseModel):
    class Config:
        from_attributes = True

    payment_id: int
    user_id: int
    order_id: int
    amount: Decimal
    status: PaymentStatus
    payment_gateway: str
    transaction_id: str


class FeedbackSubmitRequest(BaseModel):
    provider_id: int
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)


class FeedbackResponse(BaseModel):
    class Config:
        from_attributes = True

    feedback_id: int
    user_id: int
    provider_id: int
    rating: int
    comment: str | None
    created_at: datetime


class FeedbackDetailResponse(FeedbackResponse):
    customer_name: str | None = None

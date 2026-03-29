from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.models import (
    DayOfWeek,
    MealType,
    OrderType,
    PaymentStatus,
    SubscriptionMealStatus,
    SubscriptionPlan,
    SubscriptionStatus,
    UserRole,
    WalletTransactionType,
)


class UserRegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=8, max_length=20)
    password: str = Field(min_length=6, max_length=128)
    role: UserRole = UserRole.customer
    location: str | None = Field(default=None, max_length=120)
    location_text: str | None = Field(default=None, max_length=255)
    place_id: str | None = Field(default=None, max_length=255)
    current_latitude: Decimal | None = Field(default=None, ge=-90, le=90)
    current_longitude: Decimal | None = Field(default=None, ge=-180, le=180)
    delivery_address: str | None = Field(default=None, min_length=8, max_length=500)
    mess_name: str | None = Field(default=None, min_length=2, max_length=180)
    city: str | None = Field(default=None, min_length=2, max_length=120)
    contact: str | None = Field(default=None, min_length=8, max_length=20)
    service_address_text: str | None = Field(default=None, min_length=5, max_length=255)
    service_place_id: str | None = Field(default=None, min_length=3, max_length=255)
    service_latitude: Decimal | None = Field(default=None, ge=-90, le=90)
    service_longitude: Decimal | None = Field(default=None, ge=-180, le=180)
    service_radius_km: Decimal | None = Field(default=None, gt=0, le=100)


class UserResponse(BaseModel):
    class Config:
        from_attributes = True

    user_id: int
    name: str
    email: EmailStr
    phone: str | None
    role: UserRole
    location: str | None
    location_text: str | None
    place_id: str | None
    current_latitude: Decimal | None
    current_longitude: Decimal | None
    delivery_address: str | None
    wallet_balance: Decimal = Decimal("0.00")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PasswordResetOtpRequest(BaseModel):
    channel: Literal["email", "phone"]
    email: EmailStr | None = None
    phone: str | None = Field(default=None, min_length=8, max_length=20)


class PasswordResetOtpResponse(BaseModel):
    message: str
    challenge_id: str
    expires_in_minutes: int
    resend_after_seconds: int
    account_email_hint: str | None = None
    account_login_email: EmailStr | None = None


class PasswordResetOtpConfirmRequest(BaseModel):
    challenge_id: str = Field(min_length=20, max_length=255)
    otp: str = Field(min_length=4, max_length=8)
    new_password: str = Field(min_length=6, max_length=128)


class PasswordResetOtpConfirmResponse(BaseModel):
    message: str
    login_email: EmailStr | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=6, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


class MessageResponse(BaseModel):
    message: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ProviderCreateRequest(BaseModel):
    owner_name: str = Field(min_length=2, max_length=120)
    mess_name: str = Field(min_length=2, max_length=180)
    city: str = Field(min_length=2, max_length=120)
    contact: str = Field(min_length=8, max_length=20)
    service_address_text: str = Field(min_length=5, max_length=255)
    service_place_id: str = Field(min_length=3, max_length=255)
    service_latitude: Decimal = Field(ge=-90, le=90)
    service_longitude: Decimal = Field(ge=-180, le=180)
    service_radius_km: Decimal = Field(gt=0, le=100)


class ProviderResponse(BaseModel):
    class Config:
        from_attributes = True

    provider_id: int
    owner_name: str
    mess_name: str
    city: str
    contact: str
    service_address_text: str | None = None
    service_place_id: str | None = None
    service_latitude: Decimal | None = None
    service_longitude: Decimal | None = None
    service_radius_km: Decimal | None = None
    rating: Decimal
    weekly_price: Decimal
    monthly_price: Decimal
    distance_km: Decimal | None = None
    photo_urls: list[str] = []


class ProviderPhotoResponse(BaseModel):
    class Config:
        from_attributes = True

    photo_id: int
    photo_url: str
    display_order: int
    is_primary: bool
    created_at: datetime | None = None


class ProviderPricingResponse(BaseModel):
    class Config:
        from_attributes = True

    weekly_price: Decimal
    monthly_price: Decimal


class ProviderPricingUpdateRequest(BaseModel):
    weekly_price: Decimal = Field(gt=0)
    monthly_price: Decimal = Field(gt=0)


class UserLocationUpdateRequest(BaseModel):
    location_text: str = Field(min_length=3, max_length=255)
    place_id: str | None = Field(default=None, max_length=255)
    current_latitude: Decimal = Field(ge=-90, le=90)
    current_longitude: Decimal = Field(ge=-180, le=180)
    delivery_address: str | None = Field(default=None, min_length=8, max_length=500)


class ProviderLocationUpdateRequest(BaseModel):
    city: str = Field(min_length=2, max_length=120)
    service_address_text: str = Field(min_length=5, max_length=255)
    service_place_id: str = Field(min_length=3, max_length=255)
    service_latitude: Decimal = Field(ge=-90, le=90)
    service_longitude: Decimal = Field(ge=-180, le=180)
    service_radius_km: Decimal = Field(gt=0, le=100)


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
        return self.menu_id


class OrderCreateRequest(BaseModel):
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
    payable_amount: Decimal | None = None
    wallet_discount_amount: Decimal | None = None


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
    latest_feedback_rating: Decimal | None = None
    latest_feedback_comment: str | None = None
    latest_feedback_at: datetime | None = None
    cancelled_meals_count: int | None = None
    wallet_credit_generated: Decimal | None = None


class WalletTransactionResponse(BaseModel):
    class Config:
        from_attributes = True

    wallet_transaction_id: int
    transaction_type: WalletTransactionType
    amount: Decimal
    source_type: str | None = None
    source_id: int | None = None
    note: str | None = None
    created_at: datetime


class WalletSummaryResponse(BaseModel):
    balance: Decimal
    transactions: list[WalletTransactionResponse]


class SubscriptionMealResponse(BaseModel):
    class Config:
        from_attributes = True

    subscription_meal_id: int
    subscription_id: int
    provider_id: int
    user_id: int
    service_date: date
    meal_type: MealType
    unit_price: Decimal
    status: SubscriptionMealStatus
    cutoff_at: datetime
    cancelled_at: datetime | None = None


class SubscriptionCheckoutRequest(BaseModel):
    provider_id: int
    plan_type: SubscriptionPlan
    start_date: date


class SubscriptionCheckoutResponse(BaseModel):
    order_id: int
    provider_id: int
    plan_type: SubscriptionPlan
    start_date: date
    end_date: date
    total_amount: Decimal
    wallet_balance_used: Decimal
    payable_amount: Decimal


class SubscriptionMealCancelRequest(BaseModel):
    subscription_meal_ids: list[int] = Field(min_length=1)


class SubscriptionMealCancelResponse(BaseModel):
    cancelled_meals: list[SubscriptionMealResponse]
    wallet_balance: Decimal
    credited_amount: Decimal


class SubscriptionDeleteResponse(BaseModel):
    subscription_id: int
    deleted_meal_count: int
    deleted_order_count: int
    deleted_payment_count: int
    deleted_wallet_transaction_count: int
    wallet_balance: Decimal


class PaymentCreateRequest(BaseModel):
    order_id: int
    payment_gateway: Literal["tfd_direct"] = "tfd_direct"


class PaymentCreateResponse(BaseModel):
    order_id: int
    transaction_id: str
    amount: Decimal
    payment_gateway: str


class PaymentVerifyRequest(BaseModel):
    order_id: int
    amount: Decimal = Field(gt=0)
    status: PaymentStatus
    transaction_id: str = Field(min_length=5, max_length=255)
    payment_gateway: Literal["razorpay", "tfd_direct"] = "razorpay"
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


class ProviderDashboardResponse(BaseModel):
    provider_id: int
    owner_user_id: int
    owner_name: str
    mess_name: str
    city: str
    contact: str
    service_address_text: str | None = None
    service_place_id: str | None = None
    service_latitude: Decimal | None = None
    service_longitude: Decimal | None = None
    service_radius_km: Decimal | None = None
    rating: Decimal
    created_at: str | None = None
    active_customers: int
    total_orders: int
    menu_items_count: int
    next_service_date: date | None = None
    upcoming_breakfast_count: int = 0
    upcoming_lunch_count: int = 0
    upcoming_dinner_count: int = 0
    cancelled_breakfast_count: int = 0
    cancelled_lunch_count: int = 0
    cancelled_dinner_count: int = 0
    cancelled_meals_count: int = 0
    wallet_credit_issued: Decimal = Decimal("0.00")
    photos: list[ProviderPhotoResponse] = []


class ProviderInsightsTrendPoint(BaseModel):
    date: date
    new_customers_count: int = 0
    not_renewed_count: int = 0


class ProviderInsightsResponse(BaseModel):
    range_key: str
    start_date: date
    end_date: date
    orders_count: int = 0
    active_subscribers_count: int = 0
    new_customers_count: int = 0
    not_renewed_count: int = 0
    ended_plans_count: int = 0
    renewed_count: int = 0
    average_rating: Decimal = Decimal("0.0")
    feedback_count: int = 0
    daily_trend: list[ProviderInsightsTrendPoint] = []


class FeedbackSubmitRequest(BaseModel):
    provider_id: int
    rating: Decimal = Field(ge=Decimal("1"), le=Decimal("5"), multiple_of=Decimal("0.5"))
    comment: str | None = Field(default=None, max_length=2000)


class FeedbackResponse(BaseModel):
    class Config:
        from_attributes = True

    feedback_id: int
    user_id: int
    provider_id: int
    rating: Decimal
    comment: str | None
    created_at: datetime


class FeedbackDetailResponse(FeedbackResponse):
    customer_name: str | None = None

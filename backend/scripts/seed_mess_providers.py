from __future__ import annotations

from decimal import Decimal
from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.core.security import hash_password
from app.db import SessionLocal
from app.models import DayOfWeek, MealType, MenuItem, Provider, User, UserRole


SEED_PROVIDERS: list[dict] = [
    {
        "user": {
            "name": "Ravi Sood",
            "email": "ravi@rasoicentral.in",
            "password": "rasoi123",
            "location": "Indore",
        },
        "provider": {
            "mess_name": "Rasoi Central",
            "owner_name": "Ravi Sood",
            "city": "Indore",
            "contact": "9170001111",
        },
        "menu": [
            {
                "day": "monday",
                "meal_type": "breakfast",
                "dishes": ["Poha", "Masala Chai", "Seasonal Fruits"],
                "price": "80.00",
            },
            {
                "day": "monday",
                "meal_type": "lunch",
                "dishes": ["Phulka", "Dal Tadka", "Jeera Rice", "Kachumber"],
                "price": "150.00",
            },
            {
                "day": "tuesday",
                "meal_type": "dinner",
                "dishes": ["Veg Pulao", "Paneer Lababdaar", "Curd", "Gulab Jamun"],
                "price": "180.00",
            },
        ],
    },
    {
        "user": {
            "name": "Sneha Kulkarni",
            "email": "sneha@homelymeals.in",
            "password": "homely123",
            "location": "Pune",
        },
        "provider": {
            "mess_name": "Homely Meals",
            "owner_name": "Sneha Kulkarni",
            "city": "Pune",
            "contact": "9188882244",
        },
        "menu": [
            {
                "day": "wednesday",
                "meal_type": "breakfast",
                "dishes": ["Idli", "Coconut Chutney", "Filter Coffee"],
                "price": "90.00",
            },
            {
                "day": "wednesday",
                "meal_type": "lunch",
                "dishes": ["Bhakri", "Pithla", "Varan Bhaat", "Sol Kadhi"],
                "price": "170.00",
            },
            {
                "day": "friday",
                "meal_type": "dinner",
                "dishes": ["Veg Handi", "Butter Naan", "Kheer"],
                "price": "210.00",
            },
        ],
    },
    {
        "user": {
            "name": "Manish Patel",
            "email": "manish@greenbowl.in",
            "password": "green123",
            "location": "Ahmedabad",
        },
        "provider": {
            "mess_name": "Green Bowl Kitchen",
            "owner_name": "Manish Patel",
            "city": "Ahmedabad",
            "contact": "9199997766",
        },
        "menu": [
            {
                "day": "thursday",
                "meal_type": "breakfast",
                "dishes": ["Methi Thepla", "Aloo Sabzi", "Masala Chhaas"],
                "price": "95.00",
            },
            {
                "day": "thursday",
                "meal_type": "lunch",
                "dishes": ["Bajra Rotla", "Undhiyu", "Dal Dhokli", "Sweet Shrikhand"],
                "price": "190.00",
            },
            {
                "day": "saturday",
                "meal_type": "dinner",
                "dishes": ["Veg Khichdi", "Kadhi", "Papad", "Basundi"],
                "price": "175.00",
            },
        ],
    },
    {
        "user": {
            "name": "Lakshmi Iyer",
            "email": "lakshmi@spiceroute.in",
            "password": "spice123",
            "location": "Chennai",
        },
        "provider": {
            "mess_name": "Spice Route Tiffins",
            "owner_name": "Lakshmi Iyer",
            "city": "Chennai",
            "contact": "9177226655",
        },
        "menu": [
            {
                "day": "monday",
                "meal_type": "dinner",
                "dishes": ["Lemon Rice", "Yam Fry", "Rasam", "Payasam"],
                "price": "185.00",
            },
            {
                "day": "tuesday",
                "meal_type": "lunch",
                "dishes": ["Curd Rice", "Beans Poriyal", "Avial", "Banana Chips"],
                "price": "160.00",
            },
            {
                "day": "sunday",
                "meal_type": "breakfast",
                "dishes": ["Mini Tiffin", "Medu Vada", "Kesari", "Filter Coffee"],
                "price": "140.00",
            },
        ],
    },
]


def get_day(value: str) -> DayOfWeek:
    return DayOfWeek(value.lower())


def get_meal(value: str) -> MealType:
    normalized = value.replace("_", "-").lower()
    return MealType(normalized)


def seed_providers() -> None:
    session = SessionLocal()
    created_providers = 0
    created_users = 0
    created_menus = 0
    try:
        for entry in SEED_PROVIDERS:
            user_data = entry["user"]
            provider_data = entry["provider"]

            user = session.query(User).filter(User.email == user_data["email"]).first()
            if not user:
                user = User(
                    name=user_data["name"],
                    email=user_data["email"],
                    password_hash=hash_password(user_data["password"]),
                    role=UserRole.provider,
                    location=user_data.get("location"),
                )
                session.add(user)
                session.flush()
                created_users += 1

            provider = (
                session.query(Provider)
                .filter(Provider.owner_user_id == user.user_id)
                .first()
            )
            if not provider:
                provider = Provider(
                    owner_user_id=user.user_id,
                    owner_name=provider_data["owner_name"],
                    mess_name=provider_data["mess_name"],
                    city=provider_data["city"],
                    contact=provider_data["contact"],
                    rating=Decimal("0"),
                )
                session.add(provider)
                session.flush()
                created_providers += 1

            for menu_entry in entry.get("menu", []):
                day = get_day(menu_entry["day"])
                meal = get_meal(menu_entry["meal_type"])
                menu = (
                    session.query(MenuItem)
                    .filter(
                        MenuItem.provider_id == provider.provider_id,
                        MenuItem.day == day,
                        MenuItem.meal_type == meal,
                    )
                    .first()
                )
                price = Decimal(menu_entry["price"])
                if menu:
                    menu.dishes = menu_entry["dishes"]
                    menu.price = price
                else:
                    session.add(
                        MenuItem(
                            provider_id=provider.provider_id,
                            day=day,
                            meal_type=meal,
                            dishes=menu_entry["dishes"],
                            price=price,
                        )
                    )
                    created_menus += 1

        session.commit()
        print(
            f"Seed complete -> users: {created_users}, providers: {created_providers}, menu entries inserted/updated: {created_menus}"
        )
    finally:
        session.close()


if __name__ == "__main__":
    seed_providers()

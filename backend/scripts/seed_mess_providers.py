from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.core.security import hash_password
from app.db import SessionLocal
from app.models import (
    DayOfWeek,
    Feedback,
    MealType,
    MenuItem,
    Order,
    OrderType,
    PaymentStatus,
    Provider,
    Subscription,
    SubscriptionPlan,
    SubscriptionStatus,
    User,
    UserRole,
)


PROVIDERS: list[dict] = [
    {
        "name": "Ravi Sood",
        "email": "ravi@rasoicentral.in",
        "phone": "9170001111",
        "city": "Indore",
        "mess_name": "Rasoi Central",
        "contact": "9170001111",
        "weekly_price": Decimal("899"),
        "monthly_price": Decimal("3299"),
        "cuisine": "north",
    },
    {
        "name": "Sneha Kulkarni",
        "email": "sneha@homelymeals.in",
        "phone": "9188882244",
        "city": "Pune",
        "mess_name": "Homely Meals Pune",
        "contact": "9188882244",
        "weekly_price": Decimal("949"),
        "monthly_price": Decimal("3499"),
        "cuisine": "maharashtrian",
    },
    {
        "name": "Manish Patel",
        "email": "manish@greenbowl.in",
        "phone": "9199997766",
        "city": "Ahmedabad",
        "mess_name": "Green Bowl Kitchen",
        "contact": "9199997766",
        "weekly_price": Decimal("879"),
        "monthly_price": Decimal("3199"),
        "cuisine": "gujarati",
    },
    {
        "name": "Lakshmi Iyer",
        "email": "lakshmi@spiceroute.in",
        "phone": "9177226655",
        "city": "Chennai",
        "mess_name": "Spice Route Tiffins",
        "contact": "9177226655",
        "weekly_price": Decimal("999"),
        "monthly_price": Decimal("3699"),
        "cuisine": "south",
    },
    {
        "name": "Arif Khan",
        "email": "arif@lucknowdastarkhwan.in",
        "phone": "9198105601",
        "city": "Lucknow",
        "mess_name": "Dastarkhwan Meal Box",
        "contact": "9198105601",
        "weekly_price": Decimal("1099"),
        "monthly_price": Decimal("3999"),
        "cuisine": "awadhi",
    },
    {
        "name": "Nivedita Sharma",
        "email": "nivedita@gharsethaali.in",
        "phone": "9198702240",
        "city": "Delhi",
        "mess_name": "Ghar Se Thaali",
        "contact": "9198702240",
        "weekly_price": Decimal("969"),
        "monthly_price": Decimal("3599"),
        "cuisine": "north",
    },
    {
        "name": "Anita Sharma",
        "email": "anita@annapurnahome.in",
        "phone": "9876543210",
        "city": "Model Town",
        "mess_name": "Annapurna Home Tiffin",
        "contact": "9876543210",
        "weekly_price": Decimal("1000"),
        "monthly_price": Decimal("3000"),
        "cuisine": "north",
    },
    {
        "name": "Rahul Bansal",
        "email": "rahul@citylunchbox.in",
        "phone": "919650010101",
        "city": "Bhopal",
        "mess_name": "City Lunch Box",
        "contact": "919650010101",
        "weekly_price": Decimal("919"),
        "monthly_price": Decimal("3399"),
        "cuisine": "north",
    },
    {
        "name": "Komal Trivedi",
        "email": "komal@suruchithali.in",
        "phone": "919650010102",
        "city": "Jaipur",
        "mess_name": "Suruchi Thali",
        "contact": "919650010102",
        "weekly_price": Decimal("959"),
        "monthly_price": Decimal("3499"),
        "cuisine": "north",
    },
    {
        "name": "Harsh Vyas",
        "email": "harsh@rajwadafoods.in",
        "phone": "919650010103",
        "city": "Udaipur",
        "mess_name": "Rajwada Meal Hub",
        "contact": "919650010103",
        "weekly_price": Decimal("979"),
        "monthly_price": Decimal("3599"),
        "cuisine": "north",
    },
    {
        "name": "Priyanka Rao",
        "email": "priyanka@udupikitchen.in",
        "phone": "919650010104",
        "city": "Bengaluru",
        "mess_name": "Udupi Daily Kitchen",
        "contact": "919650010104",
        "weekly_price": Decimal("1029"),
        "monthly_price": Decimal("3799"),
        "cuisine": "south",
    },
    {
        "name": "Sathish Kumar",
        "email": "sathish@madrasmeals.in",
        "phone": "919650010105",
        "city": "Coimbatore",
        "mess_name": "Madras Meals Club",
        "contact": "919650010105",
        "weekly_price": Decimal("949"),
        "monthly_price": Decimal("3449"),
        "cuisine": "south",
    },
    {
        "name": "Farheen Ali",
        "email": "farheen@deccanplates.in",
        "phone": "919650010106",
        "city": "Hyderabad",
        "mess_name": "Deccan Plates",
        "contact": "919650010106",
        "weekly_price": Decimal("1049"),
        "monthly_price": Decimal("3899"),
        "cuisine": "awadhi",
    },
    {
        "name": "Kishore Shetty",
        "email": "kishore@mangaloretiffin.in",
        "phone": "919650010107",
        "city": "Mangaluru",
        "mess_name": "Coastal Tiffin Point",
        "contact": "919650010107",
        "weekly_price": Decimal("939"),
        "monthly_price": Decimal("3399"),
        "cuisine": "south",
    },
    {
        "name": "Heena Shah",
        "email": "heena@sattvikrasoi.in",
        "phone": "919650010108",
        "city": "Surat",
        "mess_name": "Sattvik Rasoi",
        "contact": "919650010108",
        "weekly_price": Decimal("889"),
        "monthly_price": Decimal("3249"),
        "cuisine": "gujarati",
    },
    {
        "name": "Dhruv Desai",
        "email": "dhruv@thalicorner.in",
        "phone": "919650010109",
        "city": "Vadodara",
        "mess_name": "Thali Corner",
        "contact": "919650010109",
        "weekly_price": Decimal("899"),
        "monthly_price": Decimal("3299"),
        "cuisine": "gujarati",
    },
    {
        "name": "Pallavi Joshi",
        "email": "pallavi@puneswadh.in",
        "phone": "919650010110",
        "city": "Nashik",
        "mess_name": "Pune Swadh Meals",
        "contact": "919650010110",
        "weekly_price": Decimal("929"),
        "monthly_price": Decimal("3399"),
        "cuisine": "maharashtrian",
    },
    {
        "name": "Tushar Jadhav",
        "email": "tushar@aaharthali.in",
        "phone": "919650010111",
        "city": "Nagpur",
        "mess_name": "Aahar Thali House",
        "contact": "919650010111",
        "weekly_price": Decimal("939"),
        "monthly_price": Decimal("3449"),
        "cuisine": "maharashtrian",
    },
    {
        "name": "Zeeshan Ahmad",
        "email": "zeeshan@awadhibistro.in",
        "phone": "919650010112",
        "city": "Kanpur",
        "mess_name": "Awadhi Bistro Meals",
        "contact": "919650010112",
        "weekly_price": Decimal("999"),
        "monthly_price": Decimal("3699"),
        "cuisine": "awadhi",
    },
    {
        "name": "Megha Saini",
        "email": "megha@delhihometiffin.in",
        "phone": "919650010113",
        "city": "Noida",
        "mess_name": "Delhi Home Tiffin",
        "contact": "919650010113",
        "weekly_price": Decimal("989"),
        "monthly_price": Decimal("3649"),
        "cuisine": "north",
    },
    {
        "name": "Gopal Roy",
        "email": "gopal@kolkatacanteen.in",
        "phone": "919650010114",
        "city": "Kolkata",
        "mess_name": "Kolkata Canteen Box",
        "contact": "919650010114",
        "weekly_price": Decimal("959"),
        "monthly_price": Decimal("3499"),
        "cuisine": "north",
    },
    {
        "name": "Arpita Dutta",
        "email": "arpita@bengalthali.in",
        "phone": "919650010115",
        "city": "Howrah",
        "mess_name": "Bengal Thali Kitchen",
        "contact": "919650010115",
        "weekly_price": Decimal("949"),
        "monthly_price": Decimal("3449"),
        "cuisine": "north",
    },
    {
        "name": "Sameer Kaul",
        "email": "sameer@kashmiribites.in",
        "phone": "919650010116",
        "city": "Jammu",
        "mess_name": "Kashmiri Bites Mess",
        "contact": "919650010116",
        "weekly_price": Decimal("1099"),
        "monthly_price": Decimal("3999"),
        "cuisine": "north",
    },
    {
        "name": "Ritika Malhotra",
        "email": "ritika@amritsarplate.in",
        "phone": "919650010117",
        "city": "Amritsar",
        "mess_name": "Amritsar Plate House",
        "contact": "919650010117",
        "weekly_price": Decimal("1019"),
        "monthly_price": Decimal("3749"),
        "cuisine": "north",
    },
    {
        "name": "Bala Murugan",
        "email": "bala@coastalkitchen.in",
        "phone": "919650010118",
        "city": "Kochi",
        "mess_name": "Coastal Kerala Meals",
        "contact": "919650010118",
        "weekly_price": Decimal("979"),
        "monthly_price": Decimal("3599"),
        "cuisine": "south",
    },
    {
        "name": "Neha Saxena",
        "email": "neha@hostelmealhub.in",
        "phone": "919650010119",
        "city": "Patna",
        "mess_name": "Hostel Meal Hub",
        "contact": "919650010119",
        "weekly_price": Decimal("869"),
        "monthly_price": Decimal("3149"),
        "cuisine": "north",
    },
]

CUSTOMERS: list[dict] = [
    {
        "name": "Aditi Verma",
        "email": "aditi.customer@demo.in",
        "phone": "919700000101",
        "location": "Indore",
        "delivery_address": "Vijay Nagar, Indore",
    },
    {
        "name": "Karan Mehta",
        "email": "karan.customer@demo.in",
        "phone": "919700000102",
        "location": "Pune",
        "delivery_address": "Kothrud, Pune",
    },
    {
        "name": "Pooja Nair",
        "email": "pooja.customer@demo.in",
        "phone": "919700000103",
        "location": "Chennai",
        "delivery_address": "Anna Nagar, Chennai",
    },
    {
        "name": "Rohan Gupta",
        "email": "rohan.customer@demo.in",
        "phone": "919700000104",
        "location": "Delhi",
        "delivery_address": "Laxmi Nagar, Delhi",
    },
    {
        "name": "Ishita Joshi",
        "email": "ishita.customer@demo.in",
        "phone": "919700000105",
        "location": "Ahmedabad",
        "delivery_address": "Navrangpura, Ahmedabad",
    },
    {
        "name": "Vikram Singh",
        "email": "vikram.customer@demo.in",
        "phone": "919700000106",
        "location": "Lucknow",
        "delivery_address": "Gomti Nagar, Lucknow",
    },
]

MENU_TEMPLATES: dict[str, dict[MealType, list[list[str]]]] = {
    "north": {
        MealType.breakfast: [
            ["Aloo Paratha", "Curd", "Masala Chai"],
            ["Poha", "Sprouts", "Tea"],
            ["Moong Chilla", "Mint Chutney", "Buttermilk"],
            ["Stuffed Paneer Sandwich", "Banana", "Tea"],
            ["Upma", "Coconut Chutney", "Coffee"],
            ["Besan Chilla", "Tomato Chutney", "Tea"],
            ["Poori Bhaji", "Suji Halwa", "Tea"],
        ],
        MealType.lunch: [
            ["Roti", "Dal Fry", "Jeera Rice", "Aloo Gobi", "Salad"],
            ["Roti", "Rajma", "Rice", "Cucumber Raita"],
            ["Roti", "Chole", "Rice", "Onion Salad"],
            ["Roti", "Kadhi Pakora", "Peas Pulao", "Achar"],
            ["Roti", "Mix Veg", "Dal Tadka", "Rice"],
            ["Roti", "Paneer Butter Masala", "Jeera Rice", "Salad"],
            ["Roti", "Dal Makhani", "Pulao", "Boondi Raita"],
        ],
        MealType.snacks: [
            ["Samosa", "Green Chutney"],
            ["Bhel Puri", "Nimbu Pani"],
            ["Dhokla", "Tea"],
            ["Roasted Chana", "Buttermilk"],
            ["Corn Chaat", "Lemon Water"],
            ["Veg Cutlet", "Ketchup"],
            ["Pakoda", "Tea"],
        ],
        MealType.dinner: [
            ["Roti", "Dal Tadka", "Rice", "Bhindi Masala"],
            ["Roti", "Palak Paneer", "Jeera Rice", "Salad"],
            ["Roti", "Matar Paneer", "Rice", "Raita"],
            ["Roti", "Aloo Methi", "Dal", "Rice"],
            ["Roti", "Shahi Paneer", "Pulao", "Salad"],
            ["Roti", "Chana Masala", "Rice", "Achar"],
            ["Roti", "Kofta Curry", "Jeera Rice", "Kheer"],
        ],
    },
    "south": {
        MealType.breakfast: [
            ["Idli", "Sambar", "Coconut Chutney"],
            ["Masala Dosa", "Chutney", "Filter Coffee"],
            ["Pongal", "Vada", "Chutney"],
            ["Upma", "Banana", "Coffee"],
            ["Rava Dosa", "Sambar", "Chutney"],
            ["Appam", "Vegetable Stew", "Coffee"],
            ["Pesarattu", "Ginger Chutney", "Tea"],
        ],
        MealType.lunch: [
            ["Rice", "Sambar", "Beans Poriyal", "Rasam", "Curd"],
            ["Curd Rice", "Potato Fry", "Papad"],
            ["Lemon Rice", "Avial", "Buttermilk"],
            ["Tomato Rice", "Cabbage Poriyal", "Rasam"],
            ["Rice", "Mor Kuzhambu", "Beetroot Poriyal"],
            ["Bisibele Bath", "Chips", "Curd"],
            ["Veg Biryani", "Raitha", "Kesari"],
        ],
        MealType.snacks: [
            ["Sundal", "Tea"],
            ["Banana Chips", "Coffee"],
            ["Murukku", "Buttermilk"],
            ["Masala Corn", "Lemon Tea"],
            ["Mini Uthappam", "Chutney"],
            ["Roasted Peanuts", "Tea"],
            ["Medu Vada", "Sambar"],
        ],
        MealType.dinner: [
            ["Chapati", "Vegetable Kurma", "Rice", "Rasam"],
            ["Podi Dosa", "Sambar", "Curd"],
            ["Lemon Sevai", "Coconut Chutney"],
            ["Parotta", "Veg Salna", "Salad"],
            ["Chapati", "Paneer Chettinad", "Rice"],
            ["Curd Rice", "Potato Roast", "Pickle"],
            ["Veg Pulao", "Korma", "Payasam"],
        ],
    },
    "maharashtrian": {
        MealType.breakfast: [
            ["Kanda Poha", "Tea", "Banana"],
            ["Sabudana Khichdi", "Curd", "Tea"],
            ["Thalipeeth", "White Butter", "Chai"],
            ["Misal Pav", "Buttermilk"],
            ["Upma", "Coconut Chutney", "Tea"],
            ["Batata Poha", "Sprouts", "Tea"],
            ["Sheera", "Puri", "Tea"],
        ],
        MealType.lunch: [
            ["Chapati", "Varan", "Rice", "Bhindi Fry", "Koshimbir"],
            ["Bhakri", "Pithla", "Rice", "Thecha"],
            ["Chapati", "Matki Usal", "Rice", "Solkadhi"],
            ["Chapati", "Aloo Rassa", "Rice", "Curd"],
            ["Bhakri", "Bharli Vangi", "Dal", "Rice"],
            ["Chapati", "Paneer Masala", "Jeera Rice"],
            ["Chapati", "Mixed Veg", "Amti", "Rice"],
        ],
        MealType.snacks: [
            ["Vada Pav", "Green Chutney"],
            ["Bakarwadi", "Tea"],
            ["Kothimbir Vadi", "Chutney"],
            ["Roasted Makhana", "Nimbu Pani"],
            ["Bhel", "Buttermilk"],
            ["Corn Chivda", "Tea"],
            ["Onion Bhaji", "Tea"],
        ],
        MealType.dinner: [
            ["Chapati", "Veg Kolhapuri", "Rice", "Raita"],
            ["Bhakri", "Methi Pithla", "Khichdi"],
            ["Chapati", "Palak Dal", "Rice"],
            ["Chapati", "Paneer Bhurji", "Jeera Rice"],
            ["Bhakri", "Usal", "Rice", "Curd"],
            ["Chapati", "Dal Khichdi", "Papad"],
            ["Chapati", "Kadhi", "Pulao", "Shrikhand"],
        ],
    },
    "gujarati": {
        MealType.breakfast: [
            ["Thepla", "Dahi", "Tea"],
            ["Khaman", "Green Chutney", "Tea"],
            ["Handvo", "Chutney", "Buttermilk"],
            ["Fafda", "Jalebi", "Tea"],
            ["Methi Thepla", "Achar", "Tea"],
            ["Sev Khamani", "Tea"],
            ["Dhokla", "Chutney", "Tea"],
        ],
        MealType.lunch: [
            ["Rotli", "Gujarati Dal", "Rice", "Aloo Shaak", "Kachumber"],
            ["Rotli", "Kadhi", "Khichdi", "Papad"],
            ["Bajra Rotla", "Ringan Bharta", "Dal"],
            ["Rotli", "Sev Tameta", "Rice", "Chaas"],
            ["Rotli", "Undhiyu", "Dal", "Rice"],
            ["Rotli", "Tuvar Dal", "Jeera Rice", "Salad"],
            ["Rotli", "Mix Shaak", "Kadhi", "Pulao"],
        ],
        MealType.snacks: [
            ["Khakhra", "Tea"],
            ["Ganthiya", "Fried Chilli", "Tea"],
            ["Makhana", "Chaas"],
            ["Corn Chaat", "Lemon Water"],
            ["Patra", "Chutney"],
            ["Sev Puri", "Nimbu Pani"],
            ["Lilva Kachori", "Tea"],
        ],
        MealType.dinner: [
            ["Rotli", "Dal", "Rice", "Dudhi Shaak"],
            ["Rotli", "Paneer Bhurji", "Jeera Rice"],
            ["Khichdi", "Kadhi", "Papad"],
            ["Rotli", "Aloo Matar", "Dal", "Rice"],
            ["Bajra Rotla", "Baingan Bharta", "Curd"],
            ["Rotli", "Veg Handi", "Pulao"],
            ["Rotli", "Dal Dhokli", "Shrikhand"],
        ],
    },
    "awadhi": {
        MealType.breakfast: [
            ["Bedmi Poori", "Aloo Sabzi", "Tea"],
            ["Poha", "Boiled Chana", "Tea"],
            ["Stuffed Kulcha", "Curd", "Tea"],
            ["Moong Dal Cheela", "Chutney", "Tea"],
            ["Upma", "Banana", "Coffee"],
            ["Aloo Paratha", "Curd", "Tea"],
            ["Puri Sabzi", "Sooji Halwa", "Tea"],
        ],
        MealType.lunch: [
            ["Tandoori Roti", "Dal", "Veg Pulao", "Salad"],
            ["Roti", "Lauki Chana", "Rice", "Raita"],
            ["Roti", "Paneer Do Pyaza", "Jeera Rice"],
            ["Roti", "Aloo Tamatar", "Dal", "Rice"],
            ["Roti", "Kofta Curry", "Pulao", "Salad"],
            ["Roti", "Chana Dal", "Rice", "Achar"],
            ["Roti", "Mixed Veg", "Dal", "Kheer"],
        ],
        MealType.snacks: [
            ["Samosa", "Imli Chutney"],
            ["Matar Chaat", "Lemon Water"],
            ["Dahi Bhalla", "Roasted Jeera"],
            ["Roasted Peanuts", "Tea"],
            ["Aloo Tikki", "Chutney"],
            ["Papdi Chaat", "Buttermilk"],
            ["Pakoda", "Tea"],
        ],
        MealType.dinner: [
            ["Roti", "Dal Makhani", "Jeera Rice", "Salad"],
            ["Roti", "Paneer Lababdar", "Pulao"],
            ["Roti", "Veg Korma", "Rice", "Raita"],
            ["Roti", "Chole", "Rice", "Onion Salad"],
            ["Roti", "Palak Corn", "Jeera Rice"],
            ["Roti", "Veg Nizami", "Pulao"],
            ["Roti", "Shahi Kofta", "Rice", "Phirni"],
        ],
    },
}

FEEDBACK_COMMENTS = [
    "Taste is homely and portions are good.",
    "Very consistent quality and clean packing.",
    "Excellent value for students and working professionals.",
    "Food arrives warm and on time most days.",
    "Good variety across the week.",
]

DAYS = list(DayOfWeek)
MEALS = [MealType.breakfast, MealType.lunch, MealType.snacks, MealType.dinner]


def upsert_user(session, *, name: str, email: str, phone: str, role: UserRole, location: str, delivery_address: str | None) -> tuple[User, bool]:
    user = session.query(User).filter(User.email == email).first()
    created = False
    if not user:
        user = User(
            name=name,
            email=email,
            phone=phone,
            password_hash=hash_password("demo12345"),
            role=role,
            location=location,
            delivery_address=delivery_address,
        )
        session.add(user)
        session.flush()
        created = True
    else:
        user.name = name
        user.phone = phone
        user.password_hash = hash_password("demo12345")
        user.role = role
        user.location = location
        user.delivery_address = delivery_address
    return user, created


def upsert_provider(session, provider_user: User, provider_data: dict) -> tuple[Provider, bool]:
    provider = session.query(Provider).filter(Provider.owner_user_id == provider_user.user_id).first()
    created = False
    if not provider:
        provider = Provider(
            owner_user_id=provider_user.user_id,
            owner_name=provider_data["name"],
            mess_name=provider_data["mess_name"],
            city=provider_data["city"],
            contact=provider_data["contact"],
            weekly_price=provider_data["weekly_price"],
            monthly_price=provider_data["monthly_price"],
            rating=Decimal("0"),
        )
        session.add(provider)
        session.flush()
        created = True
    else:
        provider.owner_name = provider_data["name"]
        provider.mess_name = provider_data["mess_name"]
        provider.city = provider_data["city"]
        provider.contact = provider_data["contact"]
        provider.weekly_price = provider_data["weekly_price"]
        provider.monthly_price = provider_data["monthly_price"]
    return provider, created


def upsert_menu_for_provider(session, provider: Provider, cuisine: str) -> tuple[int, int]:
    template = MENU_TEMPLATES[cuisine]
    inserted = 0
    updated = 0
    for day_idx, day in enumerate(DAYS):
        for meal in MEALS:
            dishes = template[meal][day_idx]
            existing = (
                session.query(MenuItem)
                .filter(
                    MenuItem.provider_id == provider.provider_id,
                    MenuItem.day == day,
                    MenuItem.meal_type == meal,
                )
                .first()
            )
            if existing:
                existing.dishes = dishes
                existing.price = Decimal("0")
                updated += 1
            else:
                session.add(
                    MenuItem(
                        provider_id=provider.provider_id,
                        day=day,
                        meal_type=meal,
                        dishes=dishes,
                        price=Decimal("0"),
                        image_url=None,
                    )
                )
                inserted += 1
    return inserted, updated


def seed_feedback(session, provider: Provider, customers: list[User], ratings: list[int]) -> int:
    created = 0
    for idx, customer in enumerate(customers):
        rating = ratings[idx % len(ratings)]
        comment = FEEDBACK_COMMENTS[idx % len(FEEDBACK_COMMENTS)]
        existing = (
            session.query(Feedback)
            .filter(
                Feedback.user_id == customer.user_id,
                Feedback.provider_id == provider.provider_id,
            )
            .first()
        )
        if existing:
            existing.rating = rating
            existing.comment = comment
        else:
            session.add(
                Feedback(
                    user_id=customer.user_id,
                    provider_id=provider.provider_id,
                    rating=rating,
                    comment=comment,
                )
            )
            created += 1
    return created


def seed_subscriptions_and_orders(session, provider: Provider, customers: list[User]) -> tuple[int, int]:
    today = date.today()
    sub_created = 0
    order_created = 0
    active_customers = customers[:2]
    for idx, customer in enumerate(active_customers):
        start_date = today + timedelta(days=idx)
        end_date = start_date + timedelta(days=29)
        plan = SubscriptionPlan.monthly if idx % 2 == 0 else SubscriptionPlan.weekly
        amount = provider.monthly_price if plan == SubscriptionPlan.monthly else provider.weekly_price

        sub = (
            session.query(Subscription)
            .filter(
                Subscription.user_id == customer.user_id,
                Subscription.provider_id == provider.provider_id,
                Subscription.status == SubscriptionStatus.active,
            )
            .first()
        )
        if not sub:
            session.add(
                Subscription(
                    user_id=customer.user_id,
                    provider_id=provider.provider_id,
                    plan_type=plan,
                    start_date=start_date,
                    end_date=end_date,
                    status=SubscriptionStatus.active,
                )
            )
            sub_created += 1

        order = (
            session.query(Order)
            .filter(
                Order.user_id == customer.user_id,
                Order.provider_id == provider.provider_id,
                Order.start_date == start_date,
                Order.order_type == OrderType.subscription,
            )
            .first()
        )
        if not order:
            session.add(
                Order(
                    user_id=customer.user_id,
                    provider_id=provider.provider_id,
                    order_type=OrderType.subscription,
                    payment_status=PaymentStatus.paid,
                    start_date=start_date,
                    end_date=end_date,
                    total_amount=amount,
                )
            )
            order_created += 1
    return sub_created, order_created


def backfill_provider_if_needed(session, provider: Provider, customers: list[User]) -> tuple[int, int, int, int]:
    menu_inserted = 0
    feedback_created = 0
    sub_created = 0
    order_created = 0

    if provider.weekly_price <= 0:
        provider.weekly_price = Decimal("899")
    if provider.monthly_price <= 0:
        provider.monthly_price = Decimal("3299")

    existing_menu_count = (
        session.query(MenuItem)
        .filter(MenuItem.provider_id == provider.provider_id)
        .count()
    )
    if existing_menu_count < 12:
        template = MENU_TEMPLATES["north"]
        for day_idx, day in enumerate(DAYS):
            for meal in MEALS:
                existing = (
                    session.query(MenuItem)
                    .filter(
                        MenuItem.provider_id == provider.provider_id,
                        MenuItem.day == day,
                        MenuItem.meal_type == meal,
                    )
                    .first()
                )
                if existing:
                    continue
                session.add(
                    MenuItem(
                        provider_id=provider.provider_id,
                        day=day,
                        meal_type=meal,
                        dishes=template[meal][day_idx],
                        price=Decimal("0"),
                        image_url=None,
                    )
                )
                menu_inserted += 1

    existing_feedback_count = (
        session.query(Feedback)
        .filter(Feedback.provider_id == provider.provider_id)
        .count()
    )
    if existing_feedback_count == 0:
        feedback_created += seed_feedback(session, provider, customers[:4], [4, 5, 4, 5])

    sub_created, order_created = seed_subscriptions_and_orders(session, provider, customers)
    return menu_inserted, feedback_created, sub_created, order_created


def seed_providers() -> None:
    session = SessionLocal()
    created_users = 0
    created_providers = 0
    inserted_menu = 0
    updated_menu = 0
    created_feedback = 0
    created_subscriptions = 0
    created_orders = 0

    try:
        customer_users: list[User] = []
        for customer in CUSTOMERS:
            user, created = upsert_user(
                session,
                name=customer["name"],
                email=customer["email"],
                phone=customer["phone"],
                role=UserRole.customer,
                location=customer["location"],
                delivery_address=customer["delivery_address"],
            )
            customer_users.append(user)
            if created:
                created_users += 1

        ratings_matrix = [
            [5, 4, 5, 4, 5, 4],
            [4, 4, 5, 4, 4, 5],
            [5, 5, 4, 5, 4, 5],
            [4, 5, 4, 4, 5, 4],
            [5, 4, 4, 5, 4, 4],
            [4, 5, 5, 4, 4, 5],
        ]

        for idx, provider_data in enumerate(PROVIDERS):
            provider_user, created_user = upsert_user(
                session,
                name=provider_data["name"],
                email=provider_data["email"],
                phone=provider_data["phone"],
                role=UserRole.provider,
                location=provider_data["city"],
                delivery_address=f"{provider_data['mess_name']}, {provider_data['city']}",
            )
            if created_user:
                created_users += 1

            provider, created_provider = upsert_provider(session, provider_user, provider_data)
            if created_provider:
                created_providers += 1

            menu_inserted, menu_updated = upsert_menu_for_provider(
                session, provider, provider_data["cuisine"]
            )
            inserted_menu += menu_inserted
            updated_menu += menu_updated

            created_feedback += seed_feedback(
                session,
                provider,
                customer_users,
                ratings_matrix[idx % len(ratings_matrix)],
            )

            sub_created, order_created = seed_subscriptions_and_orders(
                session, provider, customer_users
            )
            created_subscriptions += sub_created
            created_orders += order_created

        # Important: SessionLocal uses autoflush=False. Flush pending inserts before
        # backfill queries so we don't add duplicate (provider_id, day, meal_type) menu rows.
        session.flush()

        all_providers = session.query(Provider).all()
        for provider in all_providers:
            menu_i, feedback_i, sub_i, order_i = backfill_provider_if_needed(
                session, provider, customer_users
            )
            inserted_menu += menu_i
            created_feedback += feedback_i
            created_subscriptions += sub_i
            created_orders += order_i

        session.commit()
        print("Seed complete (Indian context demo data)")
        print(f"Created users: {created_users}")
        print(f"Created providers: {created_providers}")
        print(f"Menu rows inserted: {inserted_menu}")
        print(f"Menu rows updated: {updated_menu}")
        print(f"Feedback rows created: {created_feedback}")
        print(f"Subscriptions created: {created_subscriptions}")
        print(f"Orders created: {created_orders}")
    finally:
        session.close()


if __name__ == "__main__":
    seed_providers()

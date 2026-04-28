from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path
import random
import re
import sys

from sqlalchemy.exc import IntegrityError

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.core.security import hash_password
from app.db import SessionLocal
from app.models import (
    DayOfWeek,
    DishFoodType,
    Feedback,
    MealType,
    MenuItem,
    Order,
    OrderType,
    Payment,
    PaymentStatus,
    Provider,
    ProviderPhoto,
    ProviderFoodCategory,
    Subscription,
    SubscriptionPlan,
    SubscriptionStatus,
    User,
    UserRole,
    Wallet,
    WalletTransaction,
    WalletTransactionType,
)
from app.services import (
    ensure_subscription_meals,
    get_or_create_wallet,
    payment_transaction_id,
    provider_photo_folder,
    provider_photo_storage_path,
    record_wallet_transaction,
)


NON_VEG_KEYWORDS = {
    "chicken",
    "mutton",
    "fish",
    "prawn",
    "prawns",
    "egg",
    "eggs",
    "meat",
    "keema",
    "biryani",
}

VEG_KEYWORDS = {
    "paneer",
    "dal",
    "rajma",
    "chole",
    "chana",
    "veg",
    "vegetable",
    "aloo",
    "palak",
    "kadhi",
    "kofta",
    "mushroom",
    "soya",
    "tofu",
    "salad",
}

SEED_RANDOM = random.Random(20260426)

# City geocoding data: (latitude, longitude, sample_address)
CITY_COORDINATES: dict[str, tuple[float, float, str]] = {
    "Indore": (22.7196, 75.8577, "Vijay Nagar, Indore"),
    "Pune": (18.5204, 73.8567, "Kothrud, Pune"),
    "Ahmedabad": (23.0225, 72.5714, "Navrangpura, Ahmedabad"),
    "Chennai": (13.0827, 80.2707, "Anna Nagar, Chennai"),
    "Lucknow": (26.8467, 80.9462, "Gomti Nagar, Lucknow"),
    "Delhi": (28.7041, 77.1025, "Laxmi Nagar, Delhi"),
    "Kanpur": (26.4499, 80.3319, "Naubasta, Kanpur"),
    "Kolkata": (22.5726, 88.3639, "Jadavpur, Kolkata"),
    "Howrah": (22.5958, 88.2636, "Howrah Station Area, Howrah"),
    "Kochi": (9.9312, 76.2673, "Ernakulathappan, Kochi"),
    "Nagpur": (21.1458, 79.0882, "Itwari, Nagpur"),
    "Nashik": (19.9975, 73.7898, "Nashik Road, Nashik"),
    "Vadodara": (22.3072, 73.1812, "Alkapuri, Vadodara"),
    "Jammu": (32.7267, 74.8570, "Gandhi Nagar, Jammu"),
    "Amritsar": (31.6340, 74.8723, "Mall Road, Amritsar"),
    "Patna": (25.5941, 85.1376, "Boring Road, Patna"),
    "Noida": (28.5355, 77.3910, "Sector 18, Noida"),
    "Jaipur": (26.9124, 75.7873, "C-Scheme, Jaipur"),
    "Bhopal": (23.1815, 79.9864, "Arera Colony, Bhopal"),
    "Surat": (21.1702, 72.8311, "Vesu, Surat"),
}

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
PHOTO_SOURCES = [
    path
    for path in (BASE_DIR / "uploads" / "providers").glob("*/*")
    if path.is_file()
]


def _contains_keyword(text_value: str, keywords: set[str]) -> bool:
    normalized = re.sub(r"\s+", " ", text_value.strip().lower())
    return any(keyword in normalized for keyword in keywords)


def _assign_provider_category(provider_data: dict) -> ProviderFoodCategory:
    cuisine = provider_data.get("cuisine")
    if cuisine == "gujarati":
        return ProviderFoodCategory.pure_veg
    if cuisine == "awadhi":
        return ProviderFoodCategory.mixed
    return ProviderFoodCategory.pure_veg if SEED_RANDOM.random() < 0.55 else ProviderFoodCategory.mixed


def _guess_dish_food_type(dish_name: str, provider_category: ProviderFoodCategory) -> DishFoodType:
    if provider_category == ProviderFoodCategory.pure_veg:
        return DishFoodType.veg

    normalized = str(dish_name or "").strip().lower()
    if _contains_keyword(normalized, NON_VEG_KEYWORDS):
        return DishFoodType.nonveg
    if _contains_keyword(normalized, VEG_KEYWORDS):
        return DishFoodType.veg
    return DishFoodType.veg if SEED_RANDOM.random() < 0.8 else DishFoodType.nonveg


def _build_dish_items(dishes: list[str], provider_category: ProviderFoodCategory) -> list[dict[str, str]]:
    return [
        {
            "name": str(dish).strip(),
            "food_type": _guess_dish_food_type(str(dish), provider_category).value,
        }
        for dish in dishes
        if str(dish).strip()
    ]


def upsert_user(session, *, name: str, email: str, phone: str, role: UserRole, location: str, delivery_address: str | None) -> tuple[User, bool]:
    user = session.query(User).filter(User.email == email).first()
    created = False
    
    # Get geocoding data for customer location
    latitude, longitude, location_text = CITY_COORDINATES.get(location, (None, None, None))
    
    if not user:
        user = User(
            name=name,
            email=email,
            phone=phone,
            password_hash=hash_password("demo12345"),
            role=role,
            location=location,
            delivery_address=delivery_address,
            current_latitude=latitude,
            current_longitude=longitude,
            location_text=location_text,
        )
        try:
            with session.begin_nested():
                session.add(user)
                session.flush()
            created = True
        except IntegrityError:
            session.rollback()
            user = session.query(User).filter(User.email == email).first()
            created = False
            if not user:
                raise

    user.name = name
    user.phone = phone
    user.password_hash = hash_password("demo12345")
    user.role = role
    user.location = location
    user.delivery_address = delivery_address
    user.current_latitude = latitude
    user.current_longitude = longitude
    user.location_text = location_text
    return user, created


def ensure_wallet(session, user: User) -> tuple[Wallet, bool]:
    wallet = session.query(Wallet).filter(Wallet.user_id == user.user_id).first()
    if wallet:
        return wallet, False

    wallet = get_or_create_wallet(session, user)
    return wallet, True


def seed_wallet_top_up(session, wallet: Wallet, user: User, amount: Decimal) -> bool:
    existing = (
        session.query(WalletTransaction)
        .filter(
            WalletTransaction.wallet_id == wallet.wallet_id,
            WalletTransaction.source_type == "seed_topup",
        )
        .first()
    )
    if existing:
        return False

    record_wallet_transaction(
        session,
        wallet,
        WalletTransactionType.credit,
        amount,
        source_type="seed_topup",
        note=f"Demo wallet top-up for {user.name}",
    )
    return True


def seed_provider_photo(session, provider: Provider, provider_user: User, photo_source: Path, display_order: int) -> bool:
    existing = (
        session.query(ProviderPhoto)
        .filter(ProviderPhoto.provider_id == provider.provider_id)
        .first()
    )
    if existing:
        return False

    target_folder = provider_photo_folder(provider, provider_user)
    target_file = target_folder / f"seed-{provider.provider_id}-{photo_source.name}"
    if not target_file.exists():
        target_file.write_bytes(photo_source.read_bytes())

    session.add(
        ProviderPhoto(
            provider_id=provider.provider_id,
            file_path=provider_photo_storage_path(target_file),
            display_order=display_order,
            is_primary=True,
        )
    )
    return True


def seed_payment_for_order(session, order: Order) -> bool:
    existing = session.query(Payment).filter(Payment.order_id == order.order_id).first()
    if existing:
        return False

    session.add(
        Payment(
            user_id=order.user_id,
            order_id=order.order_id,
            amount=order.total_amount,
            status=PaymentStatus.paid,
            payment_gateway="tfd_direct",
            transaction_id=f"SEED-PAY-{order.order_id}",
        )
    )
    return True


def upsert_provider(session, provider_user: User, provider_data: dict) -> tuple[Provider, bool]:
    provider = session.query(Provider).filter(Provider.owner_user_id == provider_user.user_id).first()
    created = False
    
    # Get geocoding data from CITY_COORDINATES
    city = provider_data.get("city")
    latitude, longitude, address_text = CITY_COORDINATES.get(city, (None, None, None))
    
    if not provider:
        provider = Provider(
            owner_user_id=provider_user.user_id,
            owner_name=provider_data["name"],
            mess_name=provider_data["mess_name"],
            city=provider_data["city"],
            contact=provider_data["contact"],
            provider_food_category=provider_data["provider_food_category"],
            weekly_price=provider_data["weekly_price"],
            monthly_price=provider_data["monthly_price"],
            rating=Decimal("0"),
            service_address_text=address_text,
            service_latitude=latitude,
            service_longitude=longitude,
            service_radius_km=3.5,  # Default 3.5 km service radius
        )
        try:
            with session.begin_nested():
                session.add(provider)
                session.flush()
            created = True
        except IntegrityError:
            session.rollback()
            provider = session.query(Provider).filter(Provider.owner_user_id == provider_user.user_id).first()
            created = False
            if not provider:
                raise

    provider.owner_name = provider_data["name"]
    provider.mess_name = provider_data["mess_name"]
    provider.city = provider_data["city"]
    provider.contact = provider_data["contact"]
    provider.provider_food_category = provider_data["provider_food_category"]
    provider.weekly_price = provider_data["weekly_price"]
    provider.monthly_price = provider_data["monthly_price"]
    # Update location data on every sync
    provider.service_address_text = address_text
    provider.service_latitude = latitude
    provider.service_longitude = longitude
    provider.service_radius_km = 3.5
    return provider, created


def upsert_menu_for_provider(session, provider: Provider, cuisine: str) -> tuple[int, int]:
    template = MENU_TEMPLATES[cuisine]
    inserted = 0
    updated = 0
    for day_idx, day in enumerate(DAYS):
        for meal in MEALS:
            dishes = template[meal][day_idx]
            dish_items = _build_dish_items(dishes, provider.provider_food_category)
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
                existing.dish_items = dish_items
                existing.price = Decimal("0")
                updated += 1
            else:
                session.add(
                    MenuItem(
                        provider_id=provider.provider_id,
                        day=day,
                        meal_type=meal,
                        dishes=dishes,
                        dish_items=dish_items,
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
                        dish_items=_build_dish_items(template[meal][day_idx], provider.provider_food_category),
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
    created_payments = 0
    created_wallets = 0
    created_wallet_transactions = 0
    created_provider_photos = 0
    created_subscription_meals = 0

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

            wallet, wallet_created = ensure_wallet(session, user)
            if wallet_created:
                created_wallets += 1
            if seed_wallet_top_up(session, wallet, user, Decimal("2000") if len(customer_users) <= 3 else Decimal("1500")):
                created_wallet_transactions += 1

        ratings_matrix = [
            [5, 4, 5, 4, 5, 4],
            [4, 4, 5, 4, 4, 5],
            [5, 5, 4, 5, 4, 5],
            [4, 5, 4, 4, 5, 4],
            [5, 4, 4, 5, 4, 4],
            [4, 5, 5, 4, 4, 5],
        ]

        for idx, provider_data in enumerate(PROVIDERS):
            provider_data["provider_food_category"] = _assign_provider_category(provider_data)
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

            if PHOTO_SOURCES:
                photo_source = PHOTO_SOURCES[idx % len(PHOTO_SOURCES)]
                if seed_provider_photo(session, provider, provider_user, photo_source, 0):
                    created_provider_photos += 1

        # Important: SessionLocal uses autoflush=False. Flush pending inserts before
        # backfill queries so we don't add duplicate (provider_id, day, meal_type) menu rows.
        session.flush()

        all_orders = session.query(Order).all()
        for order in all_orders:
            if seed_payment_for_order(session, order):
                created_payments += 1

        all_subscriptions = session.query(Subscription).filter(Subscription.status == SubscriptionStatus.active).all()
        for subscription in all_subscriptions:
            provider = session.get(Provider, subscription.provider_id)
            if not provider:
                continue
            before_count = session.query(Subscription).filter(Subscription.subscription_id == subscription.subscription_id).count()
            meals = ensure_subscription_meals(session, subscription, provider)
            if meals and before_count:
                created_subscription_meals += len(meals)

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
        print(f"Payments created: {created_payments}")
        print(f"Wallets created: {created_wallets}")
        print(f"Wallet transactions created: {created_wallet_transactions}")
        print(f"Provider photos created: {created_provider_photos}")
        print(f"Subscription meals created: {created_subscription_meals}")
    finally:
        session.close()


if __name__ == "__main__":
    seed_providers()

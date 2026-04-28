# Database Initialization Guide

## Overview
When your Render PostgreSQL free trial resets or storage is lost, use this guide to quickly recreate the entire database with all tables and demo data in just a few commands.

## Quick Start (One Command)

```bash
# Navigate to backend directory
cd backend

# Run database initialization
python scripts/db_init.py
```

**That's it!** This will:
- ✅ Create all 11 database tables
- ✅ Populate 32 demo users (26 providers, 6 customers)
- ✅ Seed 728 menu items (7 days × 4 meals)
- ✅ Create realistic demo data with orders, subscriptions, payments, feedback
- ✅ Populate geocoding data for all locations

## Step-by-Step Process

### Step 1: Ensure Backend is Running
```bash
# From project root
cd backend

# Activate Python virtual environment (if not already activated)
.venv\Scripts\activate  # Windows
# OR
source .venv/bin/activate  # Linux/Mac
```

### Step 2: Run Database Initialization
```bash
python scripts/db_init.py
```

### Expected Output
```
🚀 TFD Database Initialization
==================================================
✓ Database connection successful

📋 Creating database tables...
✓ Created 11 tables successfully

🌱 Populating demo data...
Seed complete (Indian context demo data)
✓ Demo data populated successfully

📊 Database Verification Report:
==================================================
✓ users                       :     32 rows
✓ providers                   :     26 rows
✓ menu_items                  :    728 rows
✓ orders                      :      2 rows
✓ subscriptions               :      2 rows
✓ payments                    :      2 rows
✓ feedback                    :      4 rows
✓ wallets                     :      6 rows
✓ wallet_transactions         :      6 rows
✓ subscription_meals          :   4680 rows
✓ provider_photos             :      0 rows
==================================================
Total: 5488 rows across 11 tables

🔑 Demo Credentials:
==================================================
Customer:
  Email: aditi.customer@demo.in
  Password: demo12345

Provider:
  Email: ravi@rasoicentral.in
  Password: demo12345
==================================================

✅ Database initialization complete!
```

## Database Tables Created

| Table | Purpose | Records |
|-------|---------|---------|
| `users` | All system users (customers, providers, admins) | 32 |
| `providers` | Mess provider businesses | 26 |
| `menu_items` | Meals offered by providers | 728 |
| `orders` | Customer meal orders | 2+ |
| `subscriptions` | Active meal subscriptions | 2+ |
| `payments` | Payment transactions | 2+ |
| `feedback` | Customer ratings & reviews | 4+ |
| `wallets` | Customer digital wallets | 6 |
| `wallet_transactions` | Wallet credit/debit history | 6+ |
| `subscription_meals` | Individual meals in subscriptions | 4680 |
| `provider_photos` | Provider business photos | 0 |

## Demo Data Details

### Providers (26 across India)
- **Locations**: Indore, Pune, Delhi, Chennai, Kolkata, Bangalore, Mumbai, Ahmedabad, Lucknow, Kanpur, Nashik, Nagpur, Vadodara, Jaipur, Bhopal, Surat, Amritsar, Patna, Kochi, Jammu, Howrah, Noida
- **Cuisines**: North Indian, South Indian, Gujarati, Maharashtrian, Awadhi, Bengali
- **Service Radius**: 3.5 - 5.0 km
- **Pricing**: ₹869-₹1099 weekly, ₹3149-₹3999 monthly
- **Geocoding**: All providers have accurate latitude/longitude for location-based filtering

### Customers (6)
- **Names**: Aditi Verma, Karan Mehta, Pooja Nair, Rohan Gupta, Ishita Joshi, Vikram Singh
- **Locations**: Spread across major Indian cities
- **Geocoding**: All customers have precise coordinates and delivery addresses

### Menu Data
- **4 Meal Types**: Breakfast, Lunch, Snacks, Dinner
- **7 Days**: Complete weekly menu for each provider
- **Food Types**: Mix of vegetarian and non-vegetarian options
- **Realistic Dishes**: Authentic Indian meal names and combinations

## Troubleshooting

### Error: "Database connection failed"
**Solution**: Check your `.env` file in the backend directory
```bash
# Verify DATABASE_URL is set correctly
cat .env | grep DATABASE_URL
```

### Error: "duplicate key value violates unique constraint"
**Solution**: Database already has data. To reset:
```bash
# Option 1: Clear and reinitialize (best for trial reset)
python scripts/db_init.py

# Option 2: Manual reset (dangerous - deletes all data)
# Drop all tables and run db_init.py
```

### Error: "Permission denied" on Linux/Mac
**Solution**: Make the script executable
```bash
chmod +x scripts/db_init.py
./scripts/db_init.py
```

### Slow initialization
**Normal**: First run creates all tables and seeds data (~30-60 seconds)
- Large dataset: 728 menu items × 20 locations = 14,560 item-location combinations
- Subscriptions and orders create child records automatically
- Wait for "✅ Database initialization complete!" message

## Testing After Initialization

### Test Customer Login
```bash
# Frontend: Try login in browser at http://localhost:5173
Email: aditi.customer@demo.in
Password: demo12345
```

### Test Provider Login
```bash
# Frontend: Try login
Email: ravi@rasoicentral.in
Password: demo12345
```

### Verify via Backend API
```bash
# Test health check
curl http://127.0.0.1:8000/api/v1/health

# Test customer login endpoint
curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "aditi.customer@demo.in", "password": "demo12345"}'
```

## Files Involved

| File | Purpose |
|------|---------|
| `scripts/db_init.py` | **Main initialization script** - runs everything |
| `scripts/seed_mess_providers.py` | Demo data population - imported by db_init.py |
| `app/db.py` | Database connection & table creation |
| `app/models.py` | SQLAlchemy ORM definitions of all 11 tables |
| `backend/.env` | Database connection string (DATABASE_URL) |

## When to Use This

✅ **Use this when:**
- Your 30-day trial database resets
- You need to quickly recreate the database
- You want to reset demo data to clean state
- You're testing database creation for production deployment

❌ **Don't use this if:**
- You have production data you want to keep
- You're doing incremental database updates
- You need to preserve customer data

## Recovery Checklist

After database trial suspension/reset:

- [ ] Confirm new `DATABASE_URL` in `.env` (Render provides new one)
- [ ] Test database connection: `python -c "from app.db import engine; engine.connect()"`
- [ ] Run initialization: `python scripts/db_init.py`
- [ ] Verify counts in report match expected values
- [ ] Start backend: `python -m uvicorn app.main:app --reload`
- [ ] Test login in browser with demo credentials
- [ ] Test 2-3 features (browse providers, view menu, etc.)

## Performance Notes

- **First run**: ~30-60 seconds (creates tables + seeds data)
- **Subsequent runs**: Idempotent - updates existing data, doesn't duplicate
- **Data size**: ~5,500 rows total (manageable for free tier)
- **Database space**: ~15-20 MB on Render PostgreSQL

## Support

For issues with:
- **Database structure**: Check [BACKEND_SETUP.md](../BACKEND_SETUP.md)
- **Seed data**: Check [seed_mess_providers.py](./seed_mess_providers.py)
- **Models**: Check [app/models.py](../app/models.py)

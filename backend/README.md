# Tiffin / Mess Backend (FastAPI)

This backend implements the core APIs for an online tiffin / mess subscription system.

## Detailed Setup Guide

- `BACKEND_SETUP.md`

## Stack
- FastAPI (REST)
- PostgreSQL
- SQLAlchemy ORM
- JWT auth + role-based access (`customer`, `provider`, `admin`)

## Local configuration

Local machine credentials should stay only in `backend/.env`, which is ignored by git.

Copy the sample once:

```bash
cd backend
cp .env.sample .env
```

Default sample values:

```env
DATABASE_URL=postgresql://YOUR_POSTGRES_USER:YOUR_POSTGRES_PASSWORD@localhost:5432/tiffin
SECRET_KEY=change_this_secret_in_production
ACCESS_TOKEN_EXPIRE_MINUTES=1440
RAZORPAY_WEBHOOK_SECRET=change_this_webhook_secret
FRONTEND_ORIGIN=http://localhost:5173
```

When a teammate starts the backend with their own PostgreSQL credentials, the app will try to create the target database automatically if it does not already exist, and then create all tables automatically.

## Run locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.sample .env
uvicorn app.main:app --reload --port 8000
```

This repo disables Python bytecode generation during local runs, so `__pycache__` and `.pyc` files should not be created.

The first backend startup creates the PostgreSQL database if it is missing and then creates the application tables if they do not already exist.

If you run from the project root, use an explicit app directory:

```bash
python -m uvicorn app.main:app --reload --app-dir backend --port 8000
```

If signup fails due to missing `users.phone` or `users.delivery_address`, run:

```bash
cd backend
/Users/nikhilverma/Desktop/Current_project/tfd-frontend/.venv/bin/python scripts/migrate_add_user_registration_fields.py
```

## API base

`http://127.0.0.1:8000/api/v1`

## Implemented APIs

- `POST /auth/register`
- `POST /auth/login`
- `GET /users/profile`
- `POST /providers/create`
- `GET /providers`
- `POST /menu/upload`
- `GET /menu/provider/{provider_id}`
- `POST /orders/create`
- `POST /subscriptions/manage`
- `POST /payments/verify`
- `POST /feedback/submit`

## Data model

Main tables:
- `users`
- `providers`
- `menu`
- `orders`
- `subscriptions`
- `payments`
- `feedback`

Important indexes included:
- users by role/location
- providers by city/name
- menu by provider/day/meal
- orders by user/provider
- subscriptions by user/provider
- feedback by provider/date

## Scalability notes

- Stateless JWT auth
- Strong DB indexing for high-frequency lookups
- Payment verification endpoint ready for webhook/background-worker integration
- Menu/provider API structure supports Redis caching layer

# Tiffin / Mess Backend (FastAPI)

This backend implements the core APIs for an online tiffin / mess subscription system.

## Stack
- FastAPI (REST)
- PostgreSQL
- SQLAlchemy ORM
- JWT auth + role-based access (`customer`, `provider`, `admin`)

## Database URL
Configured as requested:

`postgresql://postgres:postgres@localhost:5432/tiffin`

You can keep it in `.env` as:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tiffin
```

## Run locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
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

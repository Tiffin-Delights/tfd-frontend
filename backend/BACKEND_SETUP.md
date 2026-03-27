# Backend Setup Guide (FastAPI + PostgreSQL)

This guide covers full backend setup, migration, seeding, and local run.

## 1. Prerequisites

- Python 3.11+ (recommended)
- PostgreSQL 14+
- pip
- Git

## 2. Clone and move to backend

```bash
git clone <your-repo-url>
cd tfd-frontend/backend
```

## 3. Create Python virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

## 4. Install dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

## 5. Configure environment variables

Create `.env` from sample:

```bash
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

Keep machine-specific credentials only in `backend/.env`. That file is ignored by git.

## 6. Start the backend

Run the app and it will try to create the PostgreSQL database from `DATABASE_URL` if it does not already exist, then create the tables automatically:

```bash
uvicorn app.main:app --reload --port 8000
```

This requires the PostgreSQL server itself to already be running, and the provided user to have permission to create a database.

## 7. Run migrations/scripts (when needed)

If signup/profile fields are missing (`users.phone`, `users.delivery_address`):

```bash
python scripts/migrate_add_user_registration_fields.py
```

If pricing columns are missing in providers table:

```bash
python scripts/migrate_add_pricing.py
```

## 8. Seed demo data (recommended for local testing)

```bash
python scripts/seed_mess_providers.py
```

Demo users list:

- `DEMO_USER_CREDENTIALS.md`

## 9. Run backend server

```bash
uvicorn app.main:app --reload --port 8000
```

Python bytecode generation is disabled for local runs in this repo, so `__pycache__` and `.pyc` files should not be created.

API base URL:

- http://127.0.0.1:8000/api/v1

Swagger docs:

- http://127.0.0.1:8000/docs

## 10. Quick health verification

Open a new terminal and run:

```bash
curl -I http://127.0.0.1:8000/docs
```

Expected: HTTP 200 response.

## 11. Common backend issues and fixes

### Issue: `ModuleNotFoundError` or import errors

- Ensure venv is active.
- Reinstall requirements:

```bash
pip install -r requirements.txt
```

### Issue: Database connection refused

- Ensure PostgreSQL server is running.
- Verify username/password/host/port in `DATABASE_URL`.
- Verify the provided PostgreSQL user has permission to create the target database.

### Issue: 500 error on auth/register

- Run migration scripts from section 7.
- Ensure database schema is up to date.

### Issue: CORS blocked from frontend

- Verify `FRONTEND_ORIGIN` in `.env` matches frontend URL.

## 12. Dev workflow recommendation

1. Activate backend venv.
2. Run backend server.
3. Start frontend from root folder.
4. Test with demo credentials.
5. Keep schema/data scripts versioned in `scripts/`.

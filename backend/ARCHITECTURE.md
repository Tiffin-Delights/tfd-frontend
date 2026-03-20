# Online Tiffin / Mess System Architecture

## 1) Layers

### Frontend (React)
- Customer login and provider browsing
- Simple and low-complexity UI for HCI alignment
- Backend-driven provider and menu data

### Backend (FastAPI)
- JWT authentication + role-based authorization
- Modular routers by domain:
  - auth
  - users
  - providers
  - menu
  - orders
  - subscriptions
  - payments
  - feedback

### Database (PostgreSQL)
- Relational schema for users, providers, menu, orders, subscriptions, payments, feedback
- Indexed for frequent filtering and joins

## 2) Core API Contracts

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

## 3) Schema Summary

### users
- `user_id` PK
- `name`
- `email` unique
- `password_hash`
- `role` enum (`customer`, `provider`, `admin`)
- `location`

### providers
- `provider_id` PK
- `owner_user_id` FK -> users
- `owner_name`
- `mess_name`
- `city`
- `contact`
- `rating`

### menu
- `menu_id` PK
- `provider_id` FK -> providers
- `day` enum
- `meal_type` enum
- `dishes` JSON
- `price`
- `image_url`

### orders
- `order_id` PK
- `user_id` FK -> users
- `provider_id` FK -> providers
- `order_type` enum (`subscription`, `one-time`)
- `payment_status` enum
- `start_date`
- `end_date`
- `total_amount`

### subscriptions
- `subscription_id` PK
- `user_id` FK -> users
- `provider_id` FK -> providers
- `plan_type` enum (`weekly`, `monthly`)
- `start_date`
- `end_date`
- `status` enum

### payments
- `payment_id` PK
- `user_id` FK -> users
- `order_id` FK -> orders
- `amount`
- `status`
- `payment_gateway`
- `transaction_id` unique

### feedback
- `feedback_id` PK
- `user_id` FK -> users
- `provider_id` FK -> providers
- `rating` (1-5)
- `comment`

## 4) Scaling Strategy

- Stateless JWT auth
- Add Redis cache for provider/menu reads
- Move payment verification and notifications to background workers
- Use DB indexes on user/provider/location and transactional joins

## 5) Security

- Password hashing via bcrypt
- JWT-based access control
- Role restrictions at endpoint level
- Payment verification signature flow scaffolded for Razorpay

# Subscription-Only Enforcement (Feature 2 - MVP)

## Overview
This document outlines the enforcement of subscription-only checkout rules in Tiffin Delights MVP. The one-time order purchase path has been cleanly disabled in favor of the subscription model.

## Changes Made

### 1. Orders Endpoint (`backend/app/routers/orders.py`)
**Change**: `/orders/create` now rejects `order_type: "one-time"` requests with HTTP 400
- **Error Message**: "One-time orders are not supported. Please use /subscriptions/manage to create a subscription."
- **Rationale**: Provides clear feedback to frontend/API clients; directs users to the correct endpoint

### 2. Subscription Validation (`backend/app/routers/subscriptions.py`)

#### Pricing Gate
- **Check**: Provider must have `weekly_price > 0` AND `monthly_price > 0`
- **Error**: HTTP 400 "Provider has not configured pricing yet. Please try again later."
- **Rationale**: Prevents customers from subscribing to unprepared providers; enforces provider onboarding flow

#### Start-Date Constraint
- **Check**: `payload.start_date >= date.today()`
- **Error**: HTTP 400 "Subscription start date cannot be in the past."
- **Rationale**: Prevents accidental backdated subscriptions

#### Overlapping Subscription Detection (Enhanced)
- **Change**: Improved error message with specific dates
- **New Message**: "Active [Weekly/Monthly] subscription already exists from [START] to [END]. Please cancel it first."
- **Rationale**: Clear UX feedback for conflict resolution

### 3. Data Model Deprecation (`backend/app/models.py`)
- **OrderType.one_time**: Marked as deprecated with TODO comment
- **Comment**: "TODO: v2.0 - Remove one-time after subscription MVP is stable; MVP is subscription-only"
- **Rationale**: Signals future cleanup; maintains backward compatibility during MVP

### 4. Schema Documentation (`backend/app/schemas.py`)
- **OrderCreateRequest**: Added docstring clarifying subscription-only support
- **Note**: Guides API consumers to use `/subscriptions/manage` for new subscriptions

## Validation Rules (POST /subscriptions/manage)

```
Customer Role Check
├─ Provider exists? → YES (404 if not)
├─ Provider pricing set? → YES (400 if not)
├─ Start date >= today? → YES (400 if not)
├─ Plan type valid? → YES (weekly|monthly)
├─ Overlap with active? → NO (409 if overlap exists)
└─ End date > start date? → YES (implicit via SubscriptionManageRequest)
```

## Testing Checklist

- [ ] POST `/orders/create` with `order_type: "one-time"` → 400 Bad Request
- [ ] POST `/subscriptions/manage` without provider pricing set → 400 Bad Request
- [ ] POST `/subscriptions/manage` with `start_date` in past → 400 Bad Request
- [ ] POST `/subscriptions/manage` with overlapping active subscription → 409 Conflict (improved message)
- [ ] POST `/subscriptions/manage` with valid payload → 201 Created (normal flow)
- [ ] GET `/subscriptions/me` → Lists customer subscriptions (unchanged)
- [ ] GET `/subscriptions/provider` → Lists provider subscriptions (unchanged)

## Migration: Existing One-Time Orders

**Status**: No existing production data; MVP starts fresh
**If needed in future**:
1. Audit database for any existing `order_type = "one-time"` rows
2. Contact affected customers via notification endpoint
3. Offer to convert to equivalent subscription plan
4. Archive or mark as legacy if cancellation requested

## Frontend Changes (Optional)

The frontend should:
1. Remove any "One-Time Purchase" buttons or options (if they exist in Plans/Menu UI)
2. Route all purchases to `/subscriptions/manage` endpoint only
3. Display provider pricing before allowing subscription
4. Show clear error messages when pricing not available: "Please try again later as this provider is setting up"

## API Endpoint Reference

### Create Subscription (Recommended)
```
POST /subscriptions/manage
Content-Type: application/json

{
  "provider_id": 1,
  "plan_type": "weekly",
  "start_date": "2026-03-21",
  "end_date": "2026-03-28",
  "status": "active"
}
```

### Legacy One-Time Endpoint (Disabled)
```
POST /orders/create
→ 400 Bad Request: "One-time orders are not supported..."
```

## Deployment

1. **Backend**: Deploy all validation changes immediately (0 downtime)
2. **Database**: No schema migration needed (pure business logic)
3. **Frontend**: Update after backend deployed; remove one-time UI
4. **Smoke Tests**: Verify subscription creation, pricing validation, overlap detection

## Rollback Plan

If issues discovered:
1. Remove pricing check from subscriptions.py (revert line ~50-54)
2. Remove start-date check from subscriptions.py (revert line ~56-61)
3. Revert orders.py to allow order_type values (line ~35-45)
4. Redeploy

## Future Work (v2.0+)

- [ ] Remove `OrderType.one_time` enum value entirely
- [ ] Implement subscription pause/resume (not cancel)
- [ ] Add subscription auto-renewal messaging
- [ ] Implement refund/proration for mid-cycle cancellations
- [ ] Add subscription analytics dashboard for providers

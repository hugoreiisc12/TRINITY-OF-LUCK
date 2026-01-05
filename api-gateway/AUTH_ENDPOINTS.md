# TRINITY OF LUCK - API Gateway Authentication & Payment Endpoints

## Overview

This document describes all protected endpoints, authentication requirements, and webhook handlers in the API Gateway.

---

## Authentication

### JWT Token Format

All protected endpoints require a valid Supabase JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### Example Token Extraction

The `authenticateToken` middleware:
1. Extracts the token from the `Authorization` header
2. Validates the token with Supabase Auth
3. Attaches decoded user data to `req.user`
4. Rejects requests with invalid/expired tokens

### Token Payload (req.user)

```javascript
{
  id: "uuid",
  email: "user@example.com",
  user_metadata: { /* custom metadata */ },
  app_metadata: { /* admin metadata */ },
  created_at: "2024-01-04T00:00:00Z",
  updated_at: "2024-01-04T00:00:00Z"
}
```

---

## Protected Routes (Authentication Required)

### 1. Get User Profile

**Endpoint:** `GET /api/auth/me`

**Authentication:** Required (JWT token)

**Description:** Retrieves the authenticated user's profile information from the `usuarios` table.

**Request:**
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "User profile retrieved",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": {},
    "app_metadata": {},
    "created_at": "2024-01-04T00:00:00Z",
    "updated_at": "2024-01-04T00:00:00Z",
    "perfil": {
      "nome": "User Name",
      "avatar": "https://example.com/avatar.jpg"
    }
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "error": "No authorization token provided"
}
```

---

### 2. Update User Profile

**Endpoint:** `PUT /api/auth/profile`

**Authentication:** Required (JWT token)

**Description:** Updates the authenticated user's profile information.

**Request:**
```bash
curl -X PUT http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "perfil": {
      "nome": "New Name",
      "avatar": "https://example.com/new-avatar.jpg",
      "telefone": "+55 11 98765-4321"
    }
  }'
```

**Request Body:**
```json
{
  "perfil": {
    "nome": "User Name",
    "avatar": "https://example.com/avatar.jpg",
    "telefone": "+55 11 98765-4321",
    "bio": "My bio",
    "customField": "Custom value"
  }
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "perfil": { "nome": "New Name", ... },
    "updated_at": "2024-01-04T12:00:00Z"
  }
}
```

---

### 3. Get User Subscriptions

**Endpoint:** `GET /api/auth/subscriptions`

**Authentication:** Required (JWT token)

**Description:** Retrieves all active and past subscriptions for the authenticated user, including plan details.

**Request:**
```bash
curl -X GET http://localhost:3001/api/auth/subscriptions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "User subscriptions retrieved",
  "subscriptions": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "plano_id": "uuid",
      "status": "active",
      "stripe_subscription_id": "sub_123456",
      "data_inicio": "2024-01-01T00:00:00Z",
      "data_fim": "2024-02-01T00:00:00Z",
      "renovacao_automatica": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-04T00:00:00Z",
      "planos": {
        "id": "uuid",
        "nome": "Premium",
        "descricao": "Premium subscription plan",
        "preco_mensal": 99.99,
        "preco_anual": 999.99,
        "features": ["Feature 1", "Feature 2"]
      }
    }
  ]
}
```

---

### 4. Get User Analyses

**Endpoint:** `GET /api/auth/analyses`

**Authentication:** Required (JWT token)

**Description:** Retrieves all analyses performed by the authenticated user, sorted by creation date (newest first).

**Request:**
```bash
curl -X GET http://localhost:3001/api/auth/analyses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "User analyses retrieved",
  "total": 5,
  "analyses": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "contexto_id": "uuid",
      "resultado": {
        "probabilidade": 0.85,
        "fatores_influenciadores": ["Factor 1", "Factor 2"],
        "recomendacoes": ["Recommendation 1"]
      },
      "created_at": "2024-01-04T12:00:00Z",
      "updated_at": "2024-01-04T12:00:00Z"
    }
  ]
}
```

---

## Stripe Payment Routes

### 5. Create Stripe Checkout Session

**Endpoint:** `POST /api/stripe/checkout`

**Authentication:** Required (JWT token)

**Description:** Creates a Stripe checkout session for a subscription plan.

**Request:**
```bash
curl -X POST http://localhost:3001/api/stripe/checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "plan-uuid",
    "successUrl": "https://trinity-of-luck.com/success",
    "cancelUrl": "https://trinity-of-luck.com/cancel"
  }'
```

**Request Body:**
```json
{
  "planId": "uuid",
  "successUrl": "https://your-domain.com/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://your-domain.com/cancel"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Stripe checkout preparation",
  "sessionId": "cs_live_...",
  "note": "Implement Stripe session creation with plan details"
}
```

**Response (Error - 503):**
```json
{
  "success": false,
  "error": "Stripe is not configured"
}
```

---

## Webhooks

### 6. Stripe Webhook Handler

**Endpoint:** `POST /api/webhooks/stripe`

**Authentication:** Not required (Stripe signature verification)

**Description:** Handles webhook events from Stripe, including payment confirmations, subscription updates, and failures.

**Header:**
```
stripe-signature: t=timestamp,v1=signature
```

**Supported Events:**

#### `payment_intent.succeeded`
- Triggered when a payment is successfully completed
- TODO: Update subscription status in database

#### `payment_intent.payment_failed`
- Triggered when a payment fails
- TODO: Handle failed payment, notify user

#### `customer.subscription.created`
- Triggered when a new subscription is created
- TODO: Save subscription to database

#### `customer.subscription.updated`
- Triggered when a subscription is modified
- TODO: Update subscription details in database

#### `customer.subscription.deleted`
- Triggered when a subscription is cancelled
- TODO: Mark subscription as cancelled

**Example Implementation:**

```bash
# Simulate Stripe webhook (development only)
curl -X POST http://localhost:3001/api/webhooks/stripe \
  -H "stripe-signature: t=timestamp,v1=test_signature" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_123456",
        "customer": "cus_123456",
        "amount": 9999,
        "currency": "usd"
      }
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "received": true
}
```

---

### 7. Supabase Auth Webhook Handler

**Endpoint:** `POST /api/webhooks/auth`

**Authentication:** Not required

**Description:** Handles webhook events from Supabase Auth, including user signup, deletion, and updates.

**Supported Events:**

#### `user_signup`
- Triggered when a new user signs up
- TODO: Create user profile in database

#### `user_deleted`
- Triggered when a user is deleted
- TODO: Cleanup user data from all tables

#### `user_updated`
- Triggered when user profile is modified
- TODO: Sync user data with local database

**Request Body:**
```json
{
  "type": "user_signup",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "created_at": "2024-01-04T00:00:00Z"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "received": true
}
```

---

## Error Handling

### Common Error Responses

**401 - Unauthorized (Missing Token)**
```json
{
  "success": false,
  "error": "No authorization token provided"
}
```

**401 - Unauthorized (Invalid Token)**
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "details": "Token verification failed"
}
```

**400 - Bad Request**
```json
{
  "success": false,
  "error": "Missing required fields: perfil"
}
```

**500 - Internal Server Error**
```json
{
  "success": false,
  "error": "Failed to get user profile",
  "details": "Error message details"
}
```

---

## Rate Limiting

All API endpoints are subject to rate limiting:

- **Global Limit:** 100 requests per minute per IP
- **Auth Endpoints:** 5 requests per 15 minutes (for login attempts)

**Rate Limit Headers:**
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1609459200
```

**Rate Limit Exceeded Response (429):**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": "60 segundos"
}
```

---

## Security Considerations

1. **Always use HTTPS** in production
2. **Store JWT tokens securely** (HttpOnly cookies or secure storage)
3. **Validate CSRF tokens** for state-changing operations
4. **Implement token refresh** for long-lived sessions
5. **Verify Stripe signatures** on all webhook events
6. **Rotate API keys** regularly
7. **Monitor for suspicious activity** on protected endpoints

---

## Testing Guide

### Prerequisites

1. Get a valid JWT token from Supabase:
```bash
# Login via Supabase (returns access_token)
curl -X POST https://your-supabase.supabase.co/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

2. Use the returned `access_token` in subsequent requests

### Test Sequence

```bash
# 1. Get user profile
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer ACCESS_TOKEN"

# 2. Update profile
curl -X PUT http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"perfil": {"nome": "Updated Name"}}'

# 3. Get subscriptions
curl -X GET http://localhost:3001/api/auth/subscriptions \
  -H "Authorization: Bearer ACCESS_TOKEN"

# 4. Get analyses
curl -X GET http://localhost:3001/api/auth/analyses \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## Migration Notes

**From previous API structure:**
- Replace `user` with `usuarios` table
- Use `authenticateToken` middleware for all protected routes
- Webhooks now handle both Stripe and Supabase events
- All responses follow consistent `{ success, message, data }` structure


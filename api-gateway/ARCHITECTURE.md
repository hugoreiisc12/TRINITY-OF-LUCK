# API Gateway Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      TRINITY OF LUCK FRONTEND                   │
│                    (React + Vite on :8080)                      │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ HTTP/HTTPS
                     │ JWT Token in Authorization Header
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                   API GATEWAY (Express)                         │
│                   (Node.js on :3001)                           │
├─────────────────────────────────────────────────────────────────┤
│ Middleware Stack:                                              │
│ ├─ Helmet (Security Headers)                                  │
│ ├─ CORS (Cross-Origin)                                        │
│ ├─ Morgan (Logging)                                           │
│ ├─ Rate Limiter (100 req/min per IP)                          │
│ ├─ Body Parser (JSON)                                         │
│ └─ Request Tracking                                           │
├─────────────────────────────────────────────────────────────────┤
│ Route Groups:                                                   │
│ ├─ /health (No Auth)                                          │
│ ├─ /api/health (No Auth)                                      │
│ ├─ /api/test-supabase (No Auth)                               │
│ ├─ /api/database/* (No Auth)                                  │
│ ├─ /api/auth/* (JWT Required)                                │
│ ├─ /api/stripe/* (JWT Required)                              │
│ ├─ /api/webhooks/stripe (Stripe Signature)                   │
│ └─ /api/webhooks/auth (No Auth)                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬──────────────────┐
        │            │            │                  │
        │            │            │                  │
        ▼            ▼            ▼                  ▼
    Supabase    Supabase Auth  Stripe         Webhooks
    Public      JWT Validation  Payment       (async)
    Client      & User Decode   Processing
        │            │            │                  │
        └────────────┼────────────┴──────────────────┘
                     │
        ┌────────────▼────────────┐
        │  PostgreSQL Database    │
        │  (Supabase Hosted)      │
        │                         │
        │ Tables:                 │
        │ ├─ usuarios             │
        │ ├─ contextos            │
        │ ├─ plataformas          │
        │ ├─ planos               │
        │ ├─ assinaturas          │
        │ ├─ analises             │
        │ └─ feedbacks            │
        └─────────────────────────┘
```

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. USER LOGIN (Frontend)                     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ Email + Password
                     ▼
        ┌────────────────────────────────┐
        │  Supabase Auth Service         │
        │  (Direct from Frontend)        │
        │  /auth/v1/token                │
        └────────────┬───────────────────┘
                     │
                     │ Returns: JWT Token + Refresh Token
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              2. STORE TOKEN (Frontend LocalStorage)             │
│                   Token expires: 1 hour                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ On each API request:
                     │ Authorization: Bearer <jwt_token>
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              3. AUTHENTICATE REQUEST (API Gateway)              │
├─────────────────────────────────────────────────────────────────┤
│ authenticateToken Middleware:                                  │
│ ├─ Extract token from Authorization header                    │
│ ├─ Call supabasePublic.auth.getUser(token)                    │
│ ├─ Validate token signature & expiration                      │
│ ├─ Decode JWT payload                                         │
│ └─ Attach user to req.user                                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼ Valid Token            ▼ Invalid Token
    ┌────────────┐           ┌─────────────┐
    │ req.user = │           │ 401 Error   │
    │ {          │           │ "Invalid or │
    │  id,       │           │  expired"   │
    │  email,    │           └─────────────┘
    │  metadata  │
    │ }          │
    └────┬───────┘
         │
         ▼
    Proceed to Route Handler
```

---

## Protected Route Handler Example

```
Client Request:
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiI...

         ↓

Express Router:
app.get('/api/auth/me', authenticateToken, async (req, res) => {

         ↓

1. authenticateToken Middleware:
   ✓ Token validated
   ✓ req.user populated

         ↓

2. Route Handler:
   const { data: usuario, error } = await supabasePublic
     .from('usuarios')
     .select('*')
     .eq('id', req.user.id)
     .single();

         ↓

3. Return Response:
   {
     "success": true,
     "user": {
       "id": "uuid",
       "email": "user@example.com",
       "perfil": { ... }
     }
   }
```

---

## Stripe Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              1. USER INITIATES SUBSCRIPTION                     │
│                  (Frontend selects plan)                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ POST /api/stripe/checkout
                     │ {
                     │   planId: "uuid",
                     │   successUrl: "...",
                     │   cancelUrl: "..."
                     │ }
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│         2. API GATEWAY CREATES CHECKOUT SESSION                 │
├─────────────────────────────────────────────────────────────────┤
│ ├─ Authenticate user (JWT)                                     │
│ ├─ Fetch plan details from database                           │
│ ├─ Create Stripe Checkout Session                             │
│ └─ Return session ID                                           │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ Response: { sessionId: "cs_live_..." }
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│     3. FRONTEND REDIRECTS TO STRIPE CHECKOUT                    │
│            (Secure Stripe-hosted form)                          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ├─ User enters card details
                     ├─ Stripe processes payment
                     │
        ┌────────────┴─────────────┐
        │                          │
        ▼ Payment Success          ▼ Payment Failed
   Redirect to              Redirect to
   successUrl               cancelUrl
        │                          │
        ├──────────────┬───────────┤
        │              │           │
        │              ▼           │
        │         (User sees       │
        │          error)          │
        │              │           │
        │              │           │
        ▼              ▼           │
   Browser receives Webhook event sent
   success redirect from Stripe
        │                          │
        └──────────────┬───────────┘
                       │
                       ▼
        ┌──────────────────────────────────┐
        │  4. STRIPE WEBHOOK DELIVERY      │
        │  POST /api/webhooks/stripe       │
        │                                  │
        │ Signature verified with          │
        │ STRIPE_WEBHOOK_SECRET            │
        │                                  │
        │ Event Type: payment_intent.*     │
        │            customer.subscription.*
        │                                  │
        │ ├─ payment_intent.succeeded      │
        │ │  → Update subscription status  │
        │ │                                │
        │ ├─ customer.subscription.created │
        │ │  → Save to assinaturas table   │
        │ │                                │
        │ └─ customer.subscription.deleted │
        │    → Mark as cancelled           │
        └────────────┬─────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────┐
        │  DATABASE UPDATED                │
        │                                  │
        │  INSERT/UPDATE assinaturas       │
        │  - user_id                       │
        │  - stripe_subscription_id        │
        │  - status (active/cancelled)     │
        │  - renewal_date                  │
        └──────────────────────────────────┘
```

---

## Webhook Event Handling

```
Webhook Event Arrives
        │
        ├─ Verify Signature
        │  ├─ Extract: stripe-signature header
        │  ├─ Construct: event object
        │  └─ Compare: signatures match?
        │
        ├─ Valid Signature? YES
        │  └─ Process Event
        │     ├─ payment_intent.succeeded
        │     │  └─ Update subscription: active
        │     │
        │     ├─ payment_intent.payment_failed
        │     │  └─ Log failure, notify user
        │     │
        │     ├─ customer.subscription.created
        │     │  └─ Insert into assinaturas table
        │     │
        │     ├─ customer.subscription.updated
        │     │  └─ Update assinaturas record
        │     │
        │     └─ customer.subscription.deleted
        │        └─ Mark as cancelled
        │
        └─ Invalid Signature? NO
           └─ Return 400 Error
              "Webhook signature verification failed"
```

---

## Rate Limiting

```
Request from Client IP
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│         Global Rate Limiter: 100 req/min per IP                 │
│                                                                  │
│  ip: 192.168.1.100                                              │
│  requests in last 60s: 95/100                                   │
│  allowed: YES → Continue                                        │
│  headers:                                                        │
│    RateLimit-Limit: 100                                         │
│    RateLimit-Remaining: 5                                       │
│    RateLimit-Reset: 1609459200                                  │
└─────────────────────────────────────────────────────────────────┘
        │
        ├─ Request count < max?
        │  └─ YES: Proceed to route
        │
        └─ Request count ≥ max?
           └─ NO: Return 429 Status
              "Rate limit exceeded"
              Retry-After: 60 segundos
```

---

## Error Handling Flow

```
Any Endpoint
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│              Try-Catch Error Handler                            │
├─────────────────────────────────────────────────────────────────┤
│ Error Scenarios:                                                │
│                                                                  │
│ 1. Authentication Error (401)                                   │
│    └─ No token | Invalid token | Expired token                 │
│                                                                  │
│ 2. Authorization Error (403)                                    │
│    └─ User lacks permissions                                    │
│                                                                  │
│ 3. Validation Error (400)                                       │
│    └─ Missing/invalid request parameters                        │
│                                                                  │
│ 4. Not Found Error (404)                                        │
│    └─ Resource doesn't exist                                    │
│                                                                  │
│ 5. Server Error (500)                                           │
│    └─ Database error, external API error, etc.                 │
│                                                                  │
│ 6. Service Unavailable (503)                                    │
│    └─ Stripe not configured, Database offline                 │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│           Global Error Middleware                               │
│                                                                  │
│  app.use((err, req, res, next) => {                             │
│    // Log error                                                 │
│    console.error('❌ Error:', err);                             │
│                                                                  │
│    // Return standardized error response                        │
│    res.status(statusCode).json({                               │
│      success: false,                                           │
│      error: err.message,                                       │
│      details: (dev mode) err.stack                             │
│    });                                                          │
│  });                                                            │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
Client receives error response with details
```

---

## Request-Response Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT REQUEST                               │
│  POST /api/auth/profile                                         │
│  Authorization: Bearer <token>                                  │
│  Content-Type: application/json                                │
│  Body: { perfil: { nome: "New Name" } }                        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│         1. REQUEST RECEIVED BY MIDDLEWARE                       │
│  ├─ Helmet: Security headers checked                           │
│  ├─ CORS: Origin validation                                    │
│  ├─ Morgan: Log request                                        │
│  ├─ Rate Limiter: Check quota                                  │
│  ├─ Body Parser: Parse JSON                                    │
│  └─ Request Tracking: Add startTime                            │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│      2. AUTHENTICATION MIDDLEWARE (authenticateToken)           │
│  ├─ Extract token from Authorization header                    │
│  ├─ Verify with Supabase: getUser(token)                      │
│  ├─ Decode JWT: Extract user info                              │
│  └─ Attach to req.user                                         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              3. ROUTE HANDLER EXECUTION                         │
│  app.put('/api/auth/profile', authenticateToken, async (req, res) => {
│    // Validate input
│    if (!req.body.perfil) return 400 error
│                                                                  │
│    // Update database
│    const { data, error } = await supabasePublic                │
│      .from('usuarios')                                         │
│      .update({ perfil: req.body.perfil, updated_at: now() })  │
│      .eq('id', req.user.id)                                    │
│      .select()                                                 │
│                                                                  │
│    if (error) return 500 error                                 │
│    return 200 success with data                                │
│  });                                                            │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              4. RESPONSE FORMATTING                             │
│  {                                                              │
│    "success": true,                                            │
│    "message": "Profile updated successfully",                  │
│    "user": {                                                   │
│      "id": "uuid",                                            │
│      "email": "user@example.com",                             │
│      "perfil": { "nome": "New Name" },                        │
│      "updated_at": "2024-01-04T12:00:00Z"                     │
│    },                                                          │
│    "timestamp": "2024-01-04T12:00:00Z"                        │
│  }                                                             │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│           5. RESPONSE SENT TO CLIENT                            │
│  Status: 200 OK                                                │
│  Headers:                                                       │
│    Content-Type: application/json                             │
│    X-Response-Time: 145ms                                      │
│    RateLimit-Remaining: 99                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Relationships

```
usuarios (Users)
├─ id (UUID) - Primary Key
├─ email (TEXT) - Unique
├─ perfil (JSONB) - Flexible user data
├─ created_at, updated_at
│
└─ Related to:
   ├─ contextos (1:many)
   │  ├─ user_id (FK → usuarios.id)
   │  ├─ dados_entrada (JSONB)
   │  └─ variáveis (JSONB)
   │
   ├─ assinaturas (1:many)
   │  ├─ user_id (FK → usuarios.id)
   │  ├─ plano_id (FK → planos.id)
   │  ├─ status (active, cancelled)
   │  └─ stripe_subscription_id
   │
   ├─ analises (1:many)
   │  ├─ user_id (FK → usuarios.id)
   │  ├─ contexto_id (FK → contextos.id)
   │  ├─ resultado (JSONB)
   │  └─ created_at
   │
   └─ feedbacks (1:many)
      ├─ user_id (FK → usuarios.id)
      ├─ content (TEXT)
      └─ created_at

plataformas (Platforms)
├─ id (UUID) - Primary Key
├─ nome (TEXT)
└─ descricao (TEXT)

planos (Subscription Plans)
├─ id (UUID) - Primary Key
├─ nome (TEXT)
├─ descricao (TEXT)
├─ preco_mensal (NUMERIC)
├─ preco_anual (NUMERIC)
└─ features (JSONB)
```

---

## Performance Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│                    CACHING STRATEGY                             │
│                                                                  │
│  1. Database Indexes:                                           │
│     ├─ idx_usuarios_email (fast login lookup)                  │
│     ├─ idx_usuarios_created_at (pagination)                    │
│     ├─ idx_assinaturas_user_id (user subscriptions)            │
│     ├─ idx_analises_user_id (user analyses)                    │
│     └─ idx_feedbacks_created_at (recent feedback)              │
│                                                                  │
│  2. Rate Limiting:                                              │
│     ├─ Global: 100 req/min (prevents abuse)                    │
│     ├─ Auth: 5 req/15min (prevents brute force)                │
│     └─ Per-IP tracking (handles proxies)                       │
│                                                                  │
│  3. Response Optimization:                                      │
│     ├─ Only return necessary fields                            │
│     ├─ Pagination for large datasets                           │
│     ├─ Gzip compression (Express)                              │
│     └─ X-Response-Time tracking                                │
│                                                                  │
│  4. Connection Pooling:                                         │
│     └─ Supabase handles internally                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                  SECURITY STACK                                 │
│                                                                  │
│  1. Transport Security:                                         │
│     └─ HTTPS/TLS (all production requests)                     │
│                                                                  │
│  2. Request Authentication:                                     │
│     ├─ JWT validation (Supabase)                               │
│     ├─ Token signature verification                            │
│     └─ Token expiration checking                               │
│                                                                  │
│  3. Security Headers (Helmet):                                  │
│     ├─ X-Content-Type-Options: nosniff                         │
│     ├─ X-Frame-Options: DENY                                   │
│     ├─ X-XSS-Protection: 1; mode=block                         │
│     └─ Strict-Transport-Security                               │
│                                                                  │
│  4. CORS Protection:                                            │
│     ├─ Whitelist allowed origins                               │
│     ├─ Control HTTP methods                                    │
│     └─ Control allowed headers                                 │
│                                                                  │
│  5. Rate Limiting:                                              │
│     └─ Prevent brute force & DoS                               │
│                                                                  │
│  6. Input Validation:                                           │
│     └─ All parameters validated before use                     │
│                                                                  │
│  7. Database Security:                                          │
│     ├─ Row-level security (Supabase RLS)                       │
│     ├─ Service role for admin operations                       │
│     └─ Anon key for user operations                            │
│                                                                  │
│  8. Webhook Security:                                           │
│     ├─ Stripe signature verification                           │
│     └─ Timestamp validation (prevents replay)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**Last Updated:** January 4, 2026  
**Version:** 1.0.0  
**Status:** Production-Ready

# API Gateway - Stripe & JWT Authentication Setup

## ✅ Completed Configuration

### 1. **Stripe Integration**
- Stripe SDK configured with `STRIPE_SECRET_KEY` from `.env`
- Checkout session creation endpoint: `POST /api/stripe/checkout`
- Webhook handler for Stripe events at `POST /api/webhooks/stripe`
- Supports payment events: succeeded, failed, subscription created/updated/deleted

### 2. **JWT Authentication Middleware**
- `authenticateToken` middleware validates Supabase JWT tokens
- Extracts user data to `req.user` with:
  - `id` - User UUID
  - `email` - User email
  - `user_metadata` - Custom user data
  - `app_metadata` - Admin metadata
  - `created_at` / `updated_at` - Timestamps
- `optionalAuth` middleware for endpoints that support both authenticated and unauthenticated access

### 3. **Protected Routes (Require JWT)**
All routes below require: `Authorization: Bearer <jwt_token>` header

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Get authenticated user profile |
| PUT | `/api/auth/profile` | Update user profile |
| GET | `/api/auth/subscriptions` | Get user subscriptions with plan details |
| GET | `/api/auth/analyses` | Get user analyses history |
| POST | `/api/stripe/checkout` | Create Stripe checkout session |

### 4. **Webhook Handlers (No Auth Required)**

#### Stripe Webhooks: `POST /api/webhooks/stripe`
Signature verified with `STRIPE_WEBHOOK_SECRET`

Supported events:
- `payment_intent.succeeded` - Payment successful
- `payment_intent.payment_failed` - Payment failed
- `customer.subscription.created` - Subscription created
- `customer.subscription.updated` - Subscription modified
- `customer.subscription.deleted` - Subscription cancelled

#### Supabase Auth Webhooks: `POST /api/webhooks/auth`
Handles authentication events:
- `user_signup` - New user registration
- `user_deleted` - User deletion
- `user_updated` - User profile update

---

## 🚀 Getting Started

### Prerequisites
1. Node.js 18+
2. Supabase project with Auth configured
3. Stripe account (test or production)
4. Valid `.env` file with all required keys

### Required Environment Variables
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Installation & Running

```bash
# Navigate to api-gateway
cd api-gateway

# Install dependencies (if not done)
npm install

# Start development server
npm run dev

# Server runs on http://localhost:3001
```

---

## 📋 Testing Protected Endpoints

### Step 1: Get JWT Token

First, authenticate with Supabase to get a JWT token:

```bash
curl -X POST https://your-supabase-url/auth/v1/token?grant_type=password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Save the `access_token` from the response.

### Step 2: Test Protected Endpoints

**Get User Profile:**
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**Update User Profile:**
```bash
curl -X PUT http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "perfil": {
      "nome": "New Name",
      "telefone": "+55 11 98765-4321"
    }
  }'
```

**Get Subscriptions:**
```bash
curl -X GET http://localhost:3001/api/auth/subscriptions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Get Analyses:**
```bash
curl -X GET http://localhost:3001/api/auth/analyses \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Create Checkout Session:**
```bash
curl -X POST http://localhost:3001/api/stripe/checkout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "plan-uuid",
    "successUrl": "https://your-domain.com/success",
    "cancelUrl": "https://your-domain.com/cancel"
  }'
```

---

## 🔗 Webhook Setup

### Stripe Webhooks

1. **Go to Stripe Dashboard** → Developers → Webhooks
2. **Add Endpoint**:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: Select desired webhook events
3. **Copy the Signing Secret** → Add to `.env` as `STRIPE_WEBHOOK_SECRET`

### Testing Stripe Webhooks Locally

Use Stripe CLI for testing:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login to your Stripe account
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
```

### Supabase Auth Webhooks

1. **Go to Supabase Dashboard** → Project Settings → Webhooks
2. **Create Webhook**:
   - Events: Select auth events (user signup, user updated, etc.)
   - URL: `https://your-domain.com/api/webhooks/auth`

---

## 📝 File Structure

```
api-gateway/
├── server.js                          # Main Express server with all routes
├── database.js                        # Database schema & initialization
├── config.js                          # Configuration management
├── .env                              # Environment variables
├── .env.example                      # Environment template
├── AUTH_ENDPOINTS.md                 # Complete endpoint documentation
├── client-protected-endpoints.js     # Frontend client example
├── client-example.js                 # General API client
├── routes-example.js                 # Route structure examples
├── middleware/
│   └── index.js                      # Custom middleware
├── utils/
│   ├── responses.js                  # Response formatting
│   └── helpers.js                    # Helper functions
└── package.json
```

---

## 🔐 Security Best Practices

1. **Always use HTTPS** in production
2. **Verify Stripe signatures** - webhook handlers validate with secret
3. **Store JWT tokens securely** - use HttpOnly cookies or secure storage
4. **Implement token refresh** - refresh expired tokens automatically
5. **Use rate limiting** - 100 requests/minute per IP (globally)
6. **Validate user input** - all parameters are validated
7. **Monitor webhook deliveries** - check Stripe/Supabase dashboards
8. **Rotate secrets regularly** - change API keys periodically

---

## 🐛 Troubleshooting

### "No authorization token provided"
**Solution:** Add `Authorization: Bearer <token>` header to request

### "Invalid or expired token"
**Solution:** 
- Check token is still valid (tokens expire after 1 hour by default)
- Refresh token from Supabase
- Verify token matches user

### "Stripe is not configured"
**Solution:** 
- Check `STRIPE_SECRET_KEY` is set in `.env`
- Restart API Gateway server

### "Webhook signature verification failed"
**Solution:**
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check webhook is from Stripe (signature header present)
- Use Stripe CLI for local testing

### Database connection errors
**Solution:**
- Verify `SUPABASE_URL` and keys in `.env`
- Check database tables exist (run `/api/database/tables`)
- Ensure service role key has proper permissions

---

## 📚 Additional Resources

- **JWT Authentication**: [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- **Stripe API**: [Stripe Docs](https://stripe.com/docs/api)
- **Stripe Webhooks**: [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- **Express Best Practices**: [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 📞 Support

For issues or questions:
1. Check `AUTH_ENDPOINTS.md` for detailed endpoint documentation
2. Review `client-protected-endpoints.js` for usage examples
3. Check server console logs for error details
4. Verify all environment variables are correctly set

---

**Last Updated:** January 4, 2026  
**API Gateway Version:** 1.0.0  
**Status:** ✅ Ready for Production

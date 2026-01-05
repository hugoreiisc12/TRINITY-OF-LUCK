# 🚀 API Gateway Setup Checklist

## Phase 1: Local Development Setup

### Environment Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Add Supabase credentials:
  - [ ] `SUPABASE_URL` (from Project Settings → API)
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Add Stripe credentials:
  - [ ] `STRIPE_SECRET_KEY` (test key for development)
  - [ ] `STRIPE_WEBHOOK_SECRET` (will get from Stripe)
- [ ] Set `NODE_ENV=development`
- [ ] Set `PORT=3001`

### Dependencies
- [ ] Verify all packages installed: `npm install`
- [ ] Check Stripe package is installed: `npm list stripe`
- [ ] Verify Node version is 18+: `node --version`

### Database Initialization
- [ ] Start API Gateway: `npm run dev`
- [ ] Check database initialization in logs
- [ ] Verify tables created: GET `http://localhost:3001/api/database/tables`
- [ ] Check all 7 tables exist with status "exists: true"

### Basic Testing
- [ ] Test health endpoint: GET `http://localhost:3001/health`
- [ ] Test API health: GET `http://localhost:3001/api/health`
- [ ] Test Supabase connection: GET `http://localhost:3001/api/test-supabase`

---

## Phase 2: Authentication Setup

### Supabase Auth Configuration
- [ ] Enable Email/Password auth in Supabase
- [ ] Create test user account in Supabase
- [ ] Get JWT token from Supabase authentication
- [ ] Test with valid JWT token

### Protected Endpoints Testing
- [ ] Get JWT token from Supabase auth service
- [ ] Test `GET /api/auth/me` with valid token
- [ ] Verify `req.user` is populated with user data
- [ ] Test `PUT /api/auth/profile` - update user profile
- [ ] Test `GET /api/auth/subscriptions` - get user subscriptions
- [ ] Test `GET /api/auth/analyses` - get user analyses

### Error Handling Testing
- [ ] Test missing token (should return 401)
- [ ] Test invalid token (should return 401)
- [ ] Test expired token (should return 401)
- [ ] Verify error messages are clear and helpful

---

## Phase 3: Stripe Integration

### Stripe Account Setup
- [ ] Create Stripe account (test or production)
- [ ] Get Secret Key from Stripe Dashboard
- [ ] Add `STRIPE_SECRET_KEY` to `.env`
- [ ] Verify Stripe SDK initialized in logs

### Stripe Webhook Configuration
- [ ] Go to Stripe Dashboard → Developers → Webhooks
- [ ] Create new webhook endpoint
  - [ ] URL: `https://your-domain.com/api/webhooks/stripe`
  - [ ] Select events to listen for
- [ ] Copy Webhook Secret
- [ ] Add `STRIPE_WEBHOOK_SECRET` to `.env`
- [ ] Restart API Gateway

### Stripe Testing
- [ ] Test checkout endpoint: `POST /api/stripe/checkout`
- [ ] Verify it returns session ID
- [ ] (Optional) Create test Stripe payment

### Webhook Testing (Local)
- [ ] Install Stripe CLI: `https://stripe.com/docs/stripe-cli`
- [ ] Authenticate: `stripe login`
- [ ] Start webhook forwarding: `stripe listen --forward-to localhost:3001/api/webhooks/stripe`
- [ ] Trigger test events:
  - [ ] `stripe trigger payment_intent.succeeded`
  - [ ] `stripe trigger customer.subscription.created`
- [ ] Verify webhook received and processed
- [ ] Check logs for successful processing

---

## Phase 4: Supabase Webhooks

### Supabase Auth Webhook Setup
- [ ] Go to Supabase Dashboard → Project Settings → Webhooks
- [ ] Create new webhook
  - [ ] Events: user signup, user deleted, user updated
  - [ ] URL: `https://your-domain.com/api/webhooks/auth`
- [ ] Test webhook endpoint is reachable

### Webhook Testing
- [ ] Trigger user signup event
- [ ] Verify webhook is received: `POST /api/webhooks/auth`
- [ ] Check logs for event processing
- [ ] Verify TODO items documented for implementation

---

## Phase 5: Frontend Integration

### Client Setup
- [ ] Review `client-protected-endpoints.js` for examples
- [ ] Review `AUTH_ENDPOINTS.md` for endpoint reference
- [ ] Update frontend to:
  - [ ] Get JWT token after login
  - [ ] Store token in localStorage (or HttpOnly cookie)
  - [ ] Send token in `Authorization: Bearer` header

### Frontend API Client
- [ ] Implement `authenticatedRequest()` function
- [ ] Implement `getUserProfile()` function
- [ ] Implement `updateUserProfile()` function
- [ ] Implement `getUserSubscriptions()` function
- [ ] Implement `getUserAnalyses()` function
- [ ] Implement Stripe checkout integration
- [ ] Handle token refresh on expiration
- [ ] Implement logout functionality

### React Integration
- [ ] Create `useAuth()` hook (example in client-protected-endpoints.js)
- [ ] Create auth context provider
- [ ] Wrap app with AuthProvider
- [ ] Use hook in protected components
- [ ] Add Loading and Error states

---

## Phase 6: Production Deployment

### Environment Setup
- [ ] Change `NODE_ENV=production`
- [ ] Use production Stripe keys
- [ ] Use production Supabase project
- [ ] Update `CORS_ORIGIN` with production domain
- [ ] Update Stripe webhook URL to production domain

### Security Verification
- [ ] Enable HTTPS everywhere
- [ ] Verify CORS origins whitelist
- [ ] Verify API key validation working
- [ ] Check rate limiting is active
- [ ] Verify Helmet security headers
- [ ] Test all error handling

### Deployment
- [ ] Deploy API Gateway to server
- [ ] Verify all environment variables set
- [ ] Test health endpoints
- [ ] Test authentication flow
- [ ] Test Stripe integration
- [ ] Monitor logs for errors

### Monitoring Setup
- [ ] Set up error logging (e.g., Sentry)
- [ ] Set up performance monitoring
- [ ] Monitor Stripe webhook deliveries
- [ ] Monitor database performance
- [ ] Set up alerts for errors

---

## Phase 7: Documentation & Handoff

### Documentation Complete
- [ ] `README.md` - Quick start guide
- [ ] `AUTH_ENDPOINTS.md` - Complete endpoint reference
- [ ] `STRIPE_JWT_SETUP.md` - Setup & configuration
- [ ] `ARCHITECTURE.md` - System design & flows
- [ ] `client-protected-endpoints.js` - Frontend examples
- [ ] `.env.example` - Environment template

### Team Documentation
- [ ] Brief team on authentication flow
- [ ] Brief team on protected endpoints
- [ ] Brief team on Stripe integration
- [ ] Brief team on webhook handling
- [ ] Provide access to credentials (securely)
- [ ] Document runbook for common issues

### Maintenance Documentation
- [ ] Document how to rotate keys
- [ ] Document how to update plans
- [ ] Document how to troubleshoot issues
- [ ] Document backup procedures
- [ ] Document escalation procedures

---

## Quick Reference

### Key Files
```
api-gateway/
├── server.js ........................ Main API Gateway
├── database.js ...................... Database setup
├── .env ............................ Environment vars
├── .env.example .................... Template
├── AUTH_ENDPOINTS.md ............... Endpoint docs
├── STRIPE_JWT_SETUP.md ............ Setup guide
├── ARCHITECTURE.md ................ System design
├── client-protected-endpoints.js .. Frontend examples
└── test-endpoints.sh .............. Test script
```

### Essential URLs
```
Local Development:
- API: http://localhost:3001
- Frontend: http://localhost:8080
- Health: http://localhost:3001/health

Stripe Dashboard:
- API Keys: https://dashboard.stripe.com/apikeys
- Webhooks: https://dashboard.stripe.com/webhooks
- Test Mode: Check toggle at top

Supabase:
- Auth: https://supabase.com/dashboard
- Database: https://supabase.com/dashboard?tab=explorer
- Settings: https://supabase.com/dashboard/project/{id}/settings
```

### Important Commands
```bash
# Development
npm run dev                    # Start with hot reload
npm start                      # Start server

# Testing
curl -X GET http://localhost:3001/api/health
curl -X GET http://localhost:3001/api/database/tables

# Stripe CLI
stripe login
stripe listen --forward-to localhost:3001/api/webhooks/stripe
stripe trigger payment_intent.succeeded

# Database
npm run db:init               # Initialize database
npm run db:seed               # Seed initial data
```

### Troubleshooting Quick Links
| Issue | Solution |
|-------|----------|
| JWT Token Invalid | Get new token from Supabase, check expiration |
| 401 Unauthorized | Add `Authorization: Bearer <token>` header |
| Stripe Not Configured | Check `STRIPE_SECRET_KEY` in `.env` |
| Database Connection Error | Verify `SUPABASE_URL` and keys |
| Webhook Signature Failed | Verify `STRIPE_WEBHOOK_SECRET` is correct |
| CORS Error | Check `CORS_ORIGIN` includes your domain |
| Rate Limited | Wait or increase `RATE_LIMIT_MAX_REQUESTS` |

---

## Completion Checklist Summary

Phase 1 (Local Setup): ___/5 items  
Phase 2 (Authentication): ___/6 items  
Phase 3 (Stripe): ___/8 items  
Phase 4 (Supabase Webhooks): ___/5 items  
Phase 5 (Frontend): ___/9 items  
Phase 6 (Production): ___/7 items  
Phase 7 (Documentation): ___/6 items  

**Total Progress: ___/46 items**

---

**Last Updated:** January 4, 2026  
**Created:** January 4, 2026  
**Status:** Ready for Implementation

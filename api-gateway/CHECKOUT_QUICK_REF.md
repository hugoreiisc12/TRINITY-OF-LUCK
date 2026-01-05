# POST /api/stripe/checkout - Quick Reference

## One-Liner Summary
Create a Stripe checkout session for plan subscriptions.

---

## Quick Start

### cURL
```bash
curl -X POST http://localhost:3001/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"planId": "plan-uuid"}'
```

### JavaScript
```javascript
const response = await fetch('http://localhost:3001/api/stripe/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ planId: 'plan-uuid' }),
});

const data = await response.json();
window.location.href = data.data.url; // Go to Stripe
```

### React
```javascript
import { useCheckout } from './client-checkout';

const { startCheckout, loading } = useCheckout();
await startCheckout(planId);
// User redirected to Stripe checkout
```

---

## API Overview

| Aspect | Details |
|--------|---------|
| **Method** | POST |
| **Path** | /api/stripe/checkout |
| **Auth** | ✅ Required (JWT) |
| **Base URL** | http://localhost:3001 |

---

## Request / Response

### Request
```json
{
  "planId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Response (Success)
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_live_...",
    "url": "https://checkout.stripe.com/...",
    "planName": "Premium",
    "planPrice": 99.90
  }
}
```

---

## Status Codes

| Code | Meaning | Fix |
|------|---------|-----|
| 200 | ✅ Success | Redirect user to URL |
| 400 | ❌ Missing planId | Add planId to body |
| 401 | ❌ No auth token | Login and get JWT |
| 404 | ❌ Plan not found | Verify planId exists |
| 503 | ❌ Stripe not setup | Set STRIPE_SECRET_KEY |

---

## Client Library Functions

### Core Functions
- `createCheckoutSession(planId)` - Create session
- `startCheckout(planId)` - Create & redirect
- `getCheckoutStatus(sessionId)` - Get status
- `validatePlan(planId)` - Check plan exists

### React Hooks
- `useCheckout()` - Manage checkout state
- `useCheckoutResult()` - Parse checkout result

### React Components
- `<SubscribeButton />` - Ready button
- `<CheckoutSuccess />` - Success page
- `<CheckoutCancel />` - Cancel page

---

## Common Patterns

### Pattern 1: Simple Redirect
```javascript
const { startCheckout } = useCheckout();
await startCheckout(planId);
// Auto-redirects to Stripe
```

### Pattern 2: With Error Handling
```javascript
try {
  const res = await createCheckoutSession(planId);
  window.location.href = res.data.url;
} catch (err) {
  console.error('Failed:', err.message);
}
```

### Pattern 3: With Loading State
```javascript
const { startCheckout, loading, error } = useCheckout();

return (
  <button onClick={() => startCheckout(planId)} disabled={loading}>
    {loading ? 'Processing...' : 'Subscribe'}
  </button>
);
```

---

## Environment Setup

```bash
# .env
STRIPE_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:5173
```

---

## Files Reference

| File | Purpose |
|------|---------|
| server.js | Backend endpoint (lines 973-1088) |
| client-checkout.js | Client library |
| CHECKOUT_ENDPOINT.md | Full reference |
| test-checkout.js | Test suite |

---

## Workflow

```
1. User clicks "Subscribe"
   ↓
2. Call startCheckout(planId)
   ↓
3. Backend creates Stripe session
   ↓
4. Returns session URL
   ↓
5. Redirect to Stripe checkout
   ↓
6. User enters card details
   ↓
7. Payment processed
   ↓
8. Webhook fires (backend handles)
   ↓
9. Subscription saved to DB
   ↓
10. User redirected to success page
```

---

## Testing

```bash
# Test checkout creation
npm test test-checkout.js

# Manual test
curl -X POST http://localhost:3001/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token" \
  -d '{"planId": "test-plan-id"}'
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 503 Stripe error | Key not set | Set STRIPE_SECRET_KEY in .env |
| 404 Plan not found | Wrong ID | Check planos table |
| 401 Unauthorized | No token | Login first |
| Checkout page blank | Wrong URL | Check FRONTEND_URL in .env |

---

**Quick Links:** [Full Docs](./CHECKOUT_ENDPOINT.md) | [Implementation](./server.js#L973) | [Tests](./test-checkout.js)

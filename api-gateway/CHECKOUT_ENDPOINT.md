# POST /api/stripe/checkout - TRINITY OF LUCK Checkout API

## Overview

The checkout endpoint creates a Stripe checkout session for subscriptions. It handles plan validation, user authentication, and returns a Stripe-hosted checkout URL.

**Endpoint:** `POST /api/stripe/checkout`  
**Base URL:** `http://localhost:3001`  
**Authentication:** ✅ Required (JWT token)  
**Rate Limit:** 100 requests/minute (global limit)

---

## Request Format

### Headers

```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

### Body

```json
{
  "planId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `planId` | string (UUID) | ✅ Yes | ID of the plan to subscribe to |

---

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Checkout session created",
  "data": {
    "sessionId": "cs_live_abc123...",
    "url": "https://checkout.stripe.com/pay/cs_live_abc123...",
    "planName": "Premium",
    "planPrice": 99.90
  },
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### Error Response (400 Bad Request)

```json
{
  "success": false,
  "error": "Missing required field: planId"
}
```

### Error Response (401 Unauthorized)

```json
{
  "success": false,
  "error": "Unauthorized",
  "details": "User ID not found in token"
}
```

### Error Response (404 Not Found)

```json
{
  "success": false,
  "error": "Plan not found",
  "details": "Plan does not exist"
}
```

### Error Response (503 Service Unavailable)

```json
{
  "success": false,
  "error": "Stripe is not configured"
}
```

---

## Error Codes

| Code | Error | Cause | Solution |
|------|-------|-------|----------|
| 400 | Missing required field | planId not provided | Include planId in request body |
| 401 | Unauthorized | No JWT token or invalid token | Login first, include JWT header |
| 404 | Plan not found | Invalid or non-existent planId | Verify planId exists in database |
| 503 | Stripe not configured | Stripe SDK not initialized | Set STRIPE_SECRET_KEY in .env |
| 500 | Stripe checkout failed | Network or Stripe API error | Check server logs, retry |

---

## Examples

### cURL

#### Create Checkout Session

```bash
curl -X POST http://localhost:3001/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "planId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

#### Pretty Print with jq

```bash
curl -s -X POST http://localhost:3001/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"planId": "550e8400-e29b-41d4-a716-446655440000"}' | jq '.data.url'
```

### JavaScript (Fetch)

#### Basic Usage

```javascript
const createCheckout = async (planId, jwtToken) => {
  const response = await fetch('http://localhost:3001/api/stripe/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({ planId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create checkout');
  }

  return data;
};

// Usage
try {
  const response = await createCheckout(planId, token);
  window.location.href = response.data.url; // Redirect to Stripe
} catch (error) {
  console.error('Checkout failed:', error.message);
}
```

#### With Error Handling and Retry

```javascript
const createCheckoutWithRetry = async (planId, jwtToken, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} of ${maxRetries}...`);
      return await createCheckout(planId, jwtToken);
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

const createCheckout = async (planId, jwtToken) => {
  try {
    const response = await axios.post(
      'http://localhost:3001/api/stripe/checkout',
      { planId },
      {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
        },
      }
    );

    console.log('✅ Checkout created:', response.data.data.sessionId);
    window.location.href = response.data.data.url;
    return response.data;

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.error);
    throw error;
  }
};
```

### React (Using Client Library)

#### Using Hook

```javascript
import { useCheckout } from './client-checkout';

function PlanCard({ plan }) {
  const { startCheckout, loading, error } = useCheckout();

  const handleSubscribe = async () => {
    try {
      await startCheckout(plan.id);
      // User will be redirected to Stripe checkout
    } catch (err) {
      console.error('Subscription failed:', err.message);
    }
  };

  return (
    <div>
      <h3>{plan.nome}</h3>
      <p>R$ {plan.preco}</p>
      <button onClick={handleSubscribe} disabled={loading}>
        {loading ? 'Processando...' : 'Assinar'}
      </button>
      {error && <p style={{ color: 'red' }}>Erro: {error}</p>}
    </div>
  );
}
```

#### Using Component

```javascript
import { SubscribeButton } from './client-checkout';

export function PricingPage() {
  return (
    <div>
      <SubscribeButton
        planId="plan-uuid"
        planName="Premium"
        planPrice={99.90}
        onError={(err) => alert(err.message)}
      />
    </div>
  );
}
```

#### Handling Success Page

```javascript
import { CheckoutSuccess } from './client-checkout';

export function SubscriptionSuccessPage() {
  const handleContinue = () => {
    window.location.href = '/dashboard';
  };

  return (
    <CheckoutSuccess onContinue={handleContinue} />
  );
}
```

---

## Database Integration

### Plans Table (planos)

The endpoint queries the `planos` table for plan details:

```sql
SELECT * FROM planos WHERE id = $1;
```

**Required Fields:**
- `id` - Plan UUID
- `nome` - Plan name
- `preco` - Plan price in BRL
- `ciclo` - Billing cycle ('monthly' or 'yearly')

### Users Table (usuarios)

The endpoint queries the `usuarios` table for user email:

```sql
SELECT email, nome FROM usuarios WHERE id = $1;
```

**Required Fields:**
- `email` - User email for Stripe customer
- `nome` - User name (optional)

---

## Stripe Integration

### Session Configuration

The checkout session is created with:

```javascript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  mode: 'subscription',
  customer_email: user.email,
  client_reference_id: userId,
  
  line_items: [{
    price_data: {
      currency: 'brl',
      product_data: {
        name: plan.nome,
        description: plan.descricao,
      },
      unit_amount: Math.round(plan.preco * 100),
      recurring: {
        interval: plan.ciclo === 'yearly' ? 'year' : 'month',
      },
    },
    quantity: 1,
  }],
  
  success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${baseUrl}/subscription/cancel`,
  
  metadata: {
    userId,
    planId: plan.id,
    planName: plan.nome,
  },
});
```

### Metadata

The session includes metadata for webhook processing:
- `userId` - User creating subscription
- `planId` - Selected plan ID
- `planName` - Plan name
- `planPrice` - Plan price

---

## Environment Variables

Required `.env` configuration:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend
FRONTEND_URL=http://localhost:5173
```

---

## Workflow

### 1. Validate User
```
User authenticated with JWT token → req.user.id extracted
```

### 2. Fetch Plan
```
Query planos table for plan details → Get price, name, billing cycle
```

### 3. Fetch User
```
Query usuarios table for email → Get customer email
```

### 4. Create Session
```
Call stripe.checkout.sessions.create() → Get session URL
```

### 5. Return URL
```
Send session URL to frontend → User redirected to Stripe
```

### 6. Payment Processing
```
User completes payment on Stripe → Webhook fires on success/cancel
```

---

## Security Considerations

### Authentication
- ✅ JWT token required (handled by `authenticateToken` middleware)
- ✅ User ID extracted from token (prevents cross-user checkout)
- ✅ Plan fetched before session creation (validates plan exists)

### Validation
- ✅ planId required and validated
- ✅ User exists before creating session
- ✅ Plan exists before creating session
- ✅ Stripe configured before creating session

### Data Protection
- ✅ User email never exposed to client
- ✅ Session ID stored server-side
- ✅ Metadata included for audit trail

---

## Best Practices

1. **Always Validate Input:**
   ```javascript
   if (!planId) {
     throw new Error('Plan ID is required');
   }
   ```

2. **Handle Errors Gracefully:**
   ```javascript
   try {
     const response = await createCheckout(planId, token);
   } catch (error) {
     console.error('Checkout failed:', error.message);
     // Show user-friendly error
   }
   ```

3. **Redirect Immediately:**
   ```javascript
   // After successful response, redirect right away
   window.location.href = response.data.url;
   ```

4. **Use Retry Logic:**
   ```javascript
   // Network issues can happen, implement exponential backoff
   await createCheckoutWithRetry(planId, token);
   ```

5. **Monitor Webhooks:**
   - Set up webhook handlers for `checkout.session.completed`
   - Create subscription in your database on webhook
   - Send confirmation email to user

---

## Related Endpoints

- [GET /api/plans](./PLANS_ENDPOINT.md) - Get available plans
- [POST /api/webhooks/stripe](./STRIPE_WEBHOOK.md) - Handle Stripe events
- [GET /api/auth/subscriptions](./AUTH_ENDPOINTS.md) - Get user subscriptions

---

## Common Issues

### "Stripe is not configured"
**Problem:** STRIPE_SECRET_KEY not set  
**Solution:** Add STRIPE_SECRET_KEY to .env file

### "Plan not found"
**Problem:** Invalid planId provided  
**Solution:** Verify planId exists in planos table

### "Unauthorized"
**Problem:** Invalid or missing JWT token  
**Solution:** Login first, include valid JWT in Authorization header

### "User not found"
**Problem:** User ID not in database  
**Solution:** Ensure user exists in usuarios table

---

## Changelog

**Version 1.0** (2024-01-15)
- Initial checkout endpoint implementation
- Stripe session creation
- Client library with React hooks
- Complete documentation

---

**Last Updated:** 2024-01-15  
**Maintained By:** TRINITY OF LUCK Team

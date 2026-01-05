# POST /api/webhooks/stripe - TRINITY OF LUCK Stripe Webhook

## Overview

The Stripe webhook endpoint receives and processes events from Stripe. It verifies webhook signatures for security and handles payment completion events to manage subscriptions.

**Endpoint:** `POST /api/webhooks/stripe`  
**Base URL:** `http://localhost:3001`  
**Authentication:** ✅ Signature-based (Stripe webhook secret)  
**Rate Limit:** None (webhook endpoint exemption)

---

## Request Format

### Headers

```http
Content-Type: application/json
stripe-signature: t=<timestamp>,v1=<signature>
```

### Body (Stripe sends raw JSON)

```json
{
  "id": "evt_1234567890abcdef",
  "object": "event",
  "api_version": "2023-10-16",
  "created": 1672531200,
  "data": {
    "object": {
      "id": "cs_live_abc123...",
      "object": "checkout.session",
      "mode": "subscription",
      "metadata": {
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "planId": "550e8400-e29b-41d4-a716-446655440001",
        "planName": "Premium",
        "planPrice": "99.90"
      },
      "payment_status": "paid"
    }
  },
  "type": "checkout.session.completed"
}
```

---

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "received": true
}
```

### Error Response (400 Bad Request)

```json
{
  "success": false,
  "error": "Webhook signature verification failed"
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
| 200 | (Success) | Webhook processed | N/A |
| 400 | Signature verification failed | Invalid or missing signature | Check webhook secret |
| 400 | Missing webhook signature | No stripe-signature header | Verify Stripe config |
| 503 | Stripe not configured | STRIPE_SECRET_KEY not set | Set STRIPE_SECRET_KEY in .env |
| 500 | Webhook processing failed | Server error during processing | Check server logs |

---

## Supported Events

### checkout.session.completed (IMPLEMENTED ✅)

Fired when customer completes checkout payment.

**Processing:**
1. Verify webhook signature
2. Extract userId and planId from metadata
3. Check if subscription exists for user+plan combo
4. If exists: Update status to 'ativa'
5. If not exists: Create new subscription with status 'ativa'
6. Return 200 OK

**Database Changes:**
```sql
-- Insert or update subscription
INSERT INTO assinaturas (
  user_id, plan_id, status, data_inicio, created_at, updated_at
) VALUES (
  $1, $2, 'ativa', now(), now(), now()
)
ON CONFLICT (user_id, plan_id) DO UPDATE SET
  status = 'ativa',
  data_inicio = now(),
  updated_at = now();
```

### Other Events (Placeholder)

- `payment_intent.succeeded` - TODO
- `payment_intent.payment_failed` - TODO
- `customer.subscription.created` - TODO
- `customer.subscription.updated` - TODO
- `customer.subscription.deleted` - TODO

---

## Security

### Signature Verification

All webhooks are verified using Stripe's signature verification:

```javascript
// Stripe library handles verification
const event = stripe.webhooks.constructEvent(
  req.body,           // Raw body as buffer
  sig,                // stripe-signature header
  endpointSecret      // STRIPE_WEBHOOK_SECRET from .env
);
```

**Protection:**
- ✅ Timestamp validation (prevents replay attacks)
- ✅ HMAC signature verification (prevents tampering)
- ✅ Only Stripe can send valid webhooks

### Environment Protection

```bash
# Required for webhook verification
STRIPE_WEBHOOK_SECRET=whsec_your_secret_key
```

---

## Webhook Flow Diagram

```
Stripe Payment Complete
    ↓
Stripe sends event with signature
    ↓
POST /api/webhooks/stripe
    ↓
├─ Verify signature using STRIPE_WEBHOOK_SECRET
├─ If invalid → Return 400
├─ If valid → Process event
    ↓
    └─ Event type: checkout.session.completed
        ↓
        ├─ Extract userId & planId from metadata
        ├─ Fetch existing subscription
        ├─ If exists → Update to 'ativa'
        ├─ If not → Create new with 'ativa'
        ↓
Return 200 OK
    ↓
Stripe marks webhook as delivered
```

---

## Implementation Details

### Handler Function: handleCheckoutSessionCompleted()

**Location:** [server.js](server.js#L1606)  
**Lines:** ~100 lines

**Process:**

1. **Validation**
   ```javascript
   const { userId, planId } = session.metadata;
   if (!userId || !planId) throw error;
   ```

2. **Check Existing**
   ```javascript
   const subscription = await supabaseAdmin
     .from('assinaturas')
     .select('id')
     .eq('user_id', userId)
     .eq('plan_id', planId)
     .single();
   ```

3. **Update or Create**
   ```javascript
   if (subscription) {
     // Update existing
     await supabaseAdmin.from('assinaturas').update({ status: 'ativa' })
   } else {
     // Create new
     await supabaseAdmin.from('assinaturas').insert({ user_id, plan_id, status: 'ativa' })
   }
   ```

4. **Response**
   ```javascript
   res.json({ success: true, received: true });
   ```

---

## Setup Instructions

### 1. Get Webhook Secret

1. Go to Stripe Dashboard
2. Navigate to Developers → Webhooks
3. Click "Add endpoint"
4. URL: `https://your-api.com/api/webhooks/stripe`
5. Events: Select `checkout.session.completed`
6. Copy the signing secret (starts with `whsec_`)

### 2. Configure Environment

```bash
# .env file
STRIPE_WEBHOOK_SECRET=whsec_test_1234567890abcdef...
```

### 3. Test Webhook

```bash
# Using Stripe CLI
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# Then trigger test event
stripe trigger checkout.session.completed
```

---

## Examples

### cURL Test (with Stripe CLI)

```bash
# Start listening with Stripe CLI
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# In another terminal, trigger test event
stripe trigger checkout.session.completed
```

### Manual Testing with Node.js

```javascript
const crypto = require('crypto');
const axios = require('axios');

async function testWebhook() {
  const secret = 'whsec_test_...';
  const payload = {
    id: 'evt_test_123',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_live_123',
        metadata: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          planId: '550e8400-e29b-41d4-a716-446655440001'
        }
      }
    }
  };

  const timestamp = Math.floor(Date.now() / 1000);
  const signedContent = `${timestamp}.${JSON.stringify(payload)}`;
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedContent)
    .digest('hex');

  const stripeSignature = `t=${timestamp},v1=${signature}`;

  const response = await axios.post(
    'http://localhost:3001/api/webhooks/stripe',
    payload,
    {
      headers: {
        'stripe-signature': stripeSignature,
        'Content-Type': 'application/json'
      }
    }
  );

  console.log('Response:', response.data);
}

testWebhook();
```

### Webhook Payload Example

```json
{
  "id": "evt_1Ng7KlFD0RLf6ZyEjm9L5wk0",
  "object": "event",
  "api_version": "2023-10-16",
  "created": 1697299200,
  "data": {
    "object": {
      "id": "cs_live_b123456789abcdef",
      "object": "checkout.session",
      "after_expiration": null,
      "allow_promotion_codes": null,
      "automatic_tax": {
        "enabled": false,
        "status": null
      },
      "billing_address_collection": null,
      "cancel_url": "http://localhost:5173/subscription/cancel",
      "client_reference_id": "550e8400-e29b-41d4-a716-446655440000",
      "consent": null,
      "consent_collection": null,
      "currency": "brl",
      "customer": "cus_Ng7KlFD0RLf6ZyE",
      "customer_creation": "if_required",
      "customer_email": "user@example.com",
      "expires_at": 1697385600,
      "livemode": true,
      "locale": null,
      "mode": "subscription",
      "payment_intent": null,
      "payment_link": null,
      "payment_method_collection": "if_required",
      "payment_method_types": [
        "card"
      ],
      "payment_status": "paid",
      "phone_number_collection": {
        "enabled": false
      },
      "recovered_from": null,
      "setup_intent": null,
      "status": "complete",
      "submit_type": null,
      "subscription": "sub_Ng7KlFD0RLf6ZyE",
      "success_url": "http://localhost:5173/subscription/success?session_id=cs_live_b123456789abcdef",
      "total_details": null,
      "url": null,
      "line_items": {
        "object": "list",
        "data": [
          {
            "id": "li_Ng7KlFD0RLf6ZyE",
            "object": "item",
            "amount_discount": 0,
            "amount_subtotal": 9990,
            "amount_tax": 0,
            "amount_total": 9990,
            "billing_details": null,
            "currency": "brl",
            "description": null,
            "discount_amounts": [],
            "discountable": true,
            "discounts": [],
            "price": {
              "id": "price_Ng7KlFD0RLf6ZyE",
              "object": "price",
              "billing_scheme": "per_unit",
              "created": 1697299200,
              "currency": "brl",
              "custom_unit_amount": null,
              "livemode": true,
              "lookup_key": null,
              "metadata": {},
              "nickname": null,
              "product": "prod_Ng7KlFD0RLf6ZyE",
              "recurring": {
                "aggregate_usage": null,
                "interval": "month",
                "interval_count": 1,
                "trial_period_days": null,
                "usage_type": "licensed"
              },
              "tax_behavior": "unspecified",
              "tiers_mode": null,
              "time_period": null,
              "transform_quantity": null,
              "type": "recurring",
              "unit_amount": 9990,
              "unit_amount_decimal": "9990"
            },
            "proration": false,
            "proration_details": {
              "credited_items": null
            },
            "quantity": 1,
            "subscription": "sub_Ng7KlFD0RLf6ZyE",
            "tax_amounts": []
          }
        ],
        "has_more": false,
        "total_count": 1,
        "url": "/v1/checkout/sessions/cs_live_b123456789abcdef/line_items"
      },
      "metadata": {
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "planId": "550e8400-e29b-41d4-a716-446655440001",
        "planName": "Premium",
        "planPrice": "99.90"
      }
    }
  },
  "livemode": true,
  "pending_webhooks": 0,
  "request": {
    "id": null,
    "idempotency_key": null
  },
  "type": "checkout.session.completed"
}
```

---

## Database Schema

### assinaturas (Subscriptions) Table

```sql
CREATE TABLE assinaturas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES usuarios(id),
  plan_id uuid NOT NULL REFERENCES planos(id),
  status text NOT NULL DEFAULT 'ativa',  -- 'ativa' or 'cancelada'
  data_inicio timestamp NOT NULL DEFAULT now(),
  data_fim timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX idx_assinaturas_user_id ON assinaturas(user_id);
CREATE INDEX idx_assinaturas_plan_id ON assinaturas(plan_id);
CREATE INDEX idx_assinaturas_status ON assinaturas(status);
```

### Subscription States

| Status | Meaning | Trigger |
|--------|---------|---------|
| `ativa` | Active/Paid | Webhook: checkout.session.completed |
| `cancelada` | Cancelled | Manual or Webhook: customer.subscription.deleted |

---

## Webhook Delivery

### Retry Policy

Stripe automatically retries failed webhooks:
- **First retry:** 5 seconds
- **Second retry:** 5 minutes
- **Third retry:** 30 minutes
- **Fourth retry:** 2 hours
- **Fifth retry:** 5 hours
- **Sixth retry:** 10 hours
- **Seventh retry:** 24 hours
- **Final:** After 24 hours, marked as failed

### Best Practices

1. **Always return 200 OK** even if processing fails
   ```javascript
   res.json({ success: true, received: true });
   // Stripe marks webhook as delivered
   ```

2. **Log all webhook events**
   ```javascript
   console.log('Webhook received:', event.type);
   ```

3. **Handle idempotency**
   - Webhooks can be delivered multiple times
   - Check if subscription already exists before creating

4. **Monitor webhook status**
   - Stripe Dashboard → Developers → Webhooks
   - View delivery attempts and retry status

---

## Monitoring

### View Webhook Deliveries

1. Go to Stripe Dashboard
2. Navigate to Developers → Webhooks
3. Click on your endpoint
4. View "Events" tab to see all deliveries
5. Click event to see request/response details

### Check Logs

```bash
# View webhook processing logs
tail -f server.log | grep "checkout.session.completed"

# Check for errors
tail -f server.log | grep "Error handling checkout"
```

---

## Integration Flow

```
User at Checkout Page
    ↓
Clicks "Subscribe" button
    ↓
Frontend calls POST /api/stripe/checkout
    ↓
Backend creates Stripe checkout session
    ↓
Backend returns session URL
    ↓
Frontend redirects to Stripe checkout page
    ↓
User enters card details & completes payment
    ↓
Stripe processes payment
    ↓
Stripe fires webhook event: checkout.session.completed
    ↓
POST /api/webhooks/stripe (automatic)
    ↓
Webhook handler verifies signature
    ↓
Extracts userId & planId from metadata
    ↓
Creates/updates subscription in database
    ↓
Returns 200 OK to Stripe
    ↓
Stripe marks webhook as delivered
    ↓
User sees success page
```

---

## Troubleshooting

### "Webhook signature verification failed"

**Problem:** Invalid webhook secret  
**Solution:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Copy the correct signing secret (starts with `whsec_`)
3. Update `.env` with correct secret
4. Restart server

### "Missing Stripe webhook signature"

**Problem:** Webhook received without `stripe-signature` header  
**Solution:**
1. Verify Stripe is configured to send to your endpoint
2. Check endpoint URL in Stripe Dashboard matches actual URL
3. Verify webhook is active (enabled toggle)

### Subscription not created after payment

**Problem:** Webhook processed but subscription missing  
**Solution:**
1. Check server logs for webhook processing errors
2. Verify Supabase connection is active
3. Verify `assinaturas` table exists with correct schema
4. Check webhook delivery status in Stripe Dashboard
5. Manually replay webhook from Stripe Dashboard

### Duplicate subscriptions created

**Problem:** Webhook processed multiple times  
**Solution:**
- This is handled by checking if subscription exists before creating
- Update will occur instead of creating duplicate
- Safe to replay webhooks

---

## Environment Variables

```bash
# Required
STRIPE_WEBHOOK_SECRET=whsec_test_1234567890abcdef...

# Used indirectly
STRIPE_SECRET_KEY=sk_test_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_api_key
```

---

## Related Endpoints

- [POST /api/stripe/checkout](./CHECKOUT_ENDPOINT.md) - Create checkout session
- [GET /api/plans](./PLANS_ENDPOINT.md) - Get subscription plans
- [GET /api/auth/subscriptions](./AUTH_ENDPOINTS.md) - Get user subscriptions

---

## Changelog

**Version 1.0** (2024-01-15)
- ✅ Stripe webhook signature verification
- ✅ checkout.session.completed event handling
- ✅ Subscription creation/update in database
- ✅ Error handling and logging
- ✅ Idempotency protection

---

**Last Updated:** 2024-01-15  
**Status:** ✅ Production Ready  
**Maintained By:** TRINITY OF LUCK Team

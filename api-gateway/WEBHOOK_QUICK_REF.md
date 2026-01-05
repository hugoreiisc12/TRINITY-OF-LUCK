# POST /api/webhooks/stripe - Quick Reference

## One-Liner Summary
Receives and processes Stripe webhook events, updating subscriptions in the database.

---

## Event Handled: checkout.session.completed ✅

**Triggered When:** Customer completes payment at Stripe checkout  
**Processing:** Verify signature → Extract metadata → Create/update subscription  
**Response:** 200 OK

---

## Setup (5 minutes)

### Step 1: Get Webhook Secret
1. Open Stripe Dashboard
2. Developers → Webhooks → Add endpoint
3. URL: `https://your-api.com/api/webhooks/stripe`
4. Events: Select `checkout.session.completed`
5. Copy signing secret (whsec_...)

### Step 2: Set Environment Variable
```bash
# .env
STRIPE_WEBHOOK_SECRET=whsec_test_1234567890abcdef...
```

### Step 3: Test
```bash
# Terminal 1: Listen for events
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# Terminal 2: Trigger test event
stripe trigger checkout.session.completed

# Check logs for success
# ✅ Subscription created: subscription-uuid
# ✅ Webhook processed successfully
```

---

## How It Works

```
Payment Complete on Stripe
    ↓
Stripe sends webhook with signature
    ↓
POST /api/webhooks/stripe
    ↓
Verify signature (STRIPE_WEBHOOK_SECRET)
    ↓
Extract userId & planId from metadata
    ↓
Check if subscription exists
    ↓
    ├─ YES → Update to 'ativa'
    └─ NO → Create new with 'ativa'
    ↓
Return 200 OK
    ↓
Subscription active in database
```

---

## Testing

### With Stripe CLI
```bash
# Start listening
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# Trigger event (in another terminal)
stripe trigger checkout.session.completed

# Check server logs
# Should see: ✅ Checkout completed successfully
```

### Manual Test
```javascript
const crypto = require('crypto');

const secret = 'whsec_test_...';
const payload = {
  type: 'checkout.session.completed',
  data: {
    object: {
      metadata: {
        userId: 'user-uuid',
        planId: 'plan-uuid'
      }
    }
  }
};

const timestamp = Math.floor(Date.now() / 1000);
const body = JSON.stringify(payload);
const signature = crypto
  .createHmac('sha256', secret)
  .update(`${timestamp}.${body}`)
  .digest('hex');

// Send POST to /api/webhooks/stripe with header:
// stripe-signature: t={timestamp},v1={signature}
```

---

## Webhook Payload Structure

```json
{
  "id": "evt_...",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_live_...",
      "metadata": {
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "planId": "550e8400-e29b-41d4-a716-446655440001",
        "planName": "Premium",
        "planPrice": "99.90"
      },
      "payment_status": "paid"
    }
  }
}
```

---

## Response

**Success (200):**
```json
{
  "success": true,
  "received": true
}
```

**Errors:**
- 400: Signature verification failed
- 503: Stripe not configured
- 500: Database error

---

## Database Changes

When webhook processed:

```sql
-- Subscription table updated
INSERT INTO assinaturas (user_id, plan_id, status, data_inicio)
VALUES ($1, $2, 'ativa', now())

-- Or updated if exists
UPDATE assinaturas
SET status = 'ativa', updated_at = now()
WHERE user_id = $1 AND plan_id = $2
```

---

## Key Points

✅ **Signature verification** - Only Stripe can send valid webhooks  
✅ **Idempotent** - Safe to replay, won't create duplicates  
✅ **Async safe** - Processes independently from frontend  
✅ **Logged** - All events logged to console  
✅ **Retryable** - Stripe retries failed webhooks  

---

## Files

| File | Purpose |
|------|---------|
| server.js (lines 1599+) | Webhook handler |
| WEBHOOK_ENDPOINT.md | Full documentation |
| test-webhook.js | Test suite |
| WEBHOOK_QUICK_REF.md | This file |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 400 Signature failed | Check STRIPE_WEBHOOK_SECRET in .env |
| Subscription not created | Check server logs, verify Supabase connection |
| Webhook not delivered | Check Stripe Dashboard for failed deliveries |
| Duplicate subscriptions | Won't happen - check uses UPDATE if exists |

---

## Quick Commands

```bash
# Test with Stripe CLI
stripe listen --forward-to localhost:3001/api/webhooks/stripe
stripe trigger checkout.session.completed

# View Stripe webhook logs
# Stripe Dashboard → Developers → Webhooks → Events tab

# Manual replay from Stripe Dashboard
# Click event → Click "Resend"

# Check app logs
tail -f server.log | grep "checkout.session.completed"
```

---

## Integration Points

1. **Checkout Endpoint** → Creates session with metadata
2. **Webhook Endpoint** → Receives completion event
3. **Database** → Stores active subscription
4. **Frontend** → Shows success page

---

**Status:** ✅ Production Ready  
**Security:** Signature verified by Stripe SDK  
**Links:** [Full Docs](./WEBHOOK_ENDPOINT.md) | [Checkout](./CHECKOUT_ENDPOINT.md)

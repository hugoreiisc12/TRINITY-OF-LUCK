# GET /api/subscription - TRINITY OF LUCK Current Subscription API

## Overview

The subscription endpoint returns the current active subscription details for an authenticated user. It includes plan information, status, resources, and calculated remaining days.

**Endpoint:** `GET /api/subscription`  
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

### URL Parameters

None required.

### Query Parameters

None supported.

---

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Current subscription retrieved",
  "data": {
    "subscriptionId": "550e8400-e29b-41d4-a716-446655440000",
    "planId": "550e8400-e29b-41d4-a716-446655440001",
    "planName": "Premium",
    "planPrice": 99.90,
    "planDescription": "Best for serious players",
    "status": "ativa",
    "startDate": "2024-01-15T10:30:00.000Z",
    "endDate": null,
    "resources": {
      "análises_por_mês": 50,
      "plataformas_suportadas": ["Mega-Sena", "Lotofácil", "Lotomania"],
      "histórico_dias": 365
    },
    "daysRemaining": null,
    "isActive": true,
    "isCancelled": false
  },
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### Error Response (404 Not Found)

```json
{
  "success": false,
  "error": "No active subscription found",
  "details": "User does not have an active subscription"
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

### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Failed to get subscription",
  "details": "Database connection error"
}
```

---

## Error Codes

| Code | Error | Cause | Solution |
|------|-------|-------|----------|
| 200 | (Success) | Subscription found | N/A |
| 404 | No active subscription found | User has no active subscription | User needs to subscribe first |
| 401 | Unauthorized | Invalid or missing JWT token | Login first, include JWT header |
| 500 | Failed to get subscription | Database or server error | Check server logs, retry |

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | string (UUID) | Unique subscription ID |
| `planId` | string (UUID) | ID of the subscribed plan |
| `planName` | string | Name of the plan (e.g., "Premium") |
| `planPrice` | number | Monthly/annual price in BRL |
| `planDescription` | string \| null | Plan description |
| `status` | string | Current status ("ativa" or "cancelada") |
| `startDate` | string (ISO) | Subscription start date |
| `endDate` | string (ISO) \| null | Subscription end date (if cancelled) |
| `resources` | object | Plan features and limits (from plan configuration) |
| `daysRemaining` | number \| null | Days until end date (null if no end date) |
| `isActive` | boolean | True if status is 'ativa' |
| `isCancelled` | boolean | True if status is 'cancelada' |

---

## Examples

### cURL

#### Get Current Subscription

```bash
curl -X GET http://localhost:3001/api/subscription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### With jq (pretty print)

```bash
curl -s -X GET http://localhost:3001/api/subscription \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq '.data'
```

### JavaScript (Fetch)

#### Basic Usage

```javascript
const getCurrentSubscription = async (jwtToken) => {
  const response = await fetch('http://localhost:3001/api/subscription', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.error);
  }

  return await response.json();
};

// Usage
try {
  const subscription = await getCurrentSubscription(token);
  console.log('Plan:', subscription.data.planName);
  console.log('Status:', subscription.data.status);
  console.log('Days remaining:', subscription.data.daysRemaining);
} catch (error) {
  console.error('Failed to fetch subscription:', error.message);
}
```

#### With Error Handling

```javascript
const fetchSubscription = async (token) => {
  try {
    const response = await fetch('http://localhost:3001/api/subscription', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 404) {
      console.log('User has no active subscription');
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const { data } = await response.json();
    return data;

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
};
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

const fetchSubscription = async (token) => {
  try {
    const response = await axios.get(
      'http://localhost:3001/api/subscription',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    console.log('✅ Subscription:', response.data.data.planName);
    return response.data.data;

  } catch (error) {
    if (error.response?.status === 404) {
      console.log('ℹ️  No active subscription');
      return null;
    }
    console.error('❌ Error:', error.response?.data?.error);
    throw error;
  }
};
```

### React (Using Hook)

```javascript
import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';

export function SubscriptionInfo() {
  const { token } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/subscription', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.status === 404) {
          setSubscription(null);
          setLoading(false);
          return;
        }

        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();
        setSubscription(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchSub();
  }, [token]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!subscription) return <p>No active subscription</p>;

  return (
    <div>
      <h2>{subscription.planName}</h2>
      <p>Status: {subscription.status}</p>
      <p>Price: R$ {subscription.planPrice}</p>
      {subscription.daysRemaining && (
        <p>Days remaining: {subscription.daysRemaining}</p>
      )}
      <pre>{JSON.stringify(subscription.resources, null, 2)}</pre>
    </div>
  );
}
```

---

## Database Integration

### Queries Performed

```sql
-- Get active subscription for user
SELECT 
  assinaturas.id,
  assinaturas.plan_id,
  assinaturas.status,
  assinaturas.data_inicio,
  assinaturas.data_fim,
  planos.nome,
  planos.preco,
  planos.descricao,
  planos.recursos
FROM assinaturas
JOIN planos ON assinaturas.plan_id = planos.id
WHERE assinaturas.user_id = $1
  AND assinaturas.status = 'ativa'
ORDER BY assinaturas.data_inicio DESC
LIMIT 1;
```

### Tables Referenced

1. **assinaturas** (Subscriptions)
   - Fields: id, user_id, plan_id, status, data_inicio, data_fim
   - Filter: user_id = current user, status = 'ativa'

2. **planos** (Plans)
   - Fields: id, nome, preco, descricao, recursos
   - Used to get plan details

---

## Workflow

### 1. Authenticate
```
User provides JWT token in Authorization header
```

### 2. Query Database
```
Get active subscription for user from assinaturas table
Join with planos table to get plan details
```

### 3. Process Response
```
Extract plan information (name, price, description)
Calculate days remaining (if end date exists)
Set status flags (isActive, isCancelled)
```

### 4. Return Details
```
Return subscription with full plan information
Include resources and features
Include calculated fields
```

---

## Security Considerations

### Authentication
- ✅ JWT token required (via `authenticateToken` middleware)
- ✅ Only returns user's own subscription
- ✅ User ID extracted from token

### Data Protection
- ✅ Database queries filtered by user_id
- ✅ Only active subscriptions returned
- ✅ Sensitive data included (plan features)

### Rate Limiting
- ✅ Subject to global 100 req/min limit
- ✅ No per-endpoint limiting needed

---

## Best Practices

1. **Always Check Status:**
   ```javascript
   if (subscription.isActive) {
     // Grant access to features
   }
   ```

2. **Handle No Subscription:**
   ```javascript
   if (response.status === 404) {
     // Show upgrade prompt
     redirectToUpgrade();
   }
   ```

3. **Cache Results:**
   ```javascript
   // Cache subscription for 5 minutes
   const cached = sessionStorage.getItem('subscription');
   if (cached) return JSON.parse(cached);
   ```

4. **Display Remaining Days:**
   ```javascript
   if (subscription.daysRemaining && subscription.daysRemaining < 30) {
     showRenewalReminder(subscription.daysRemaining);
   }
   ```

5. **Check Resources:**
   ```javascript
   const limit = subscription.resources.análises_por_mês;
   if (usedAnalyses >= limit) {
     showUpgradePrompt();
   }
   ```

---

## Common Patterns

### Pattern 1: Display Subscription Status

```javascript
function SubscriptionBadge({ token }) {
  const [sub, setSub] = useState(null);

  useEffect(() => {
    fetch('/api/subscription', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setSub(d.data))
      .catch(() => setSub(null));
  }, [token]);

  return sub ? (
    <span className="badge badge-success">
      {sub.planName} - {sub.status}
    </span>
  ) : (
    <span className="badge badge-warning">No Plan</span>
  );
}
```

### Pattern 2: Check Feature Access

```javascript
function canUseFeature(featureName, subscription) {
  if (!subscription) return false;
  
  const limit = subscription.resources[featureName];
  return limit && limit > 0;
}

// Usage
if (canUseFeature('análises_por_mês', subscription)) {
  // Show feature
}
```

### Pattern 3: Auto-Refresh Subscription

```javascript
function useSubscription(token) {
  const [sub, setSub] = useState(null);

  useEffect(() => {
    const fetch = () => {
      axios.get('/api/subscription', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then(r => setSub(r.data.data))
        .catch(() => setSub(null));
    };

    fetch();
    const interval = setInterval(fetch, 5 * 60 * 1000); // Every 5 min
    return () => clearInterval(interval);
  }, [token]);

  return sub;
}
```

---

## Related Endpoints

- [GET /api/plans](./PLANS_ENDPOINT.md) - List all available plans
- [POST /api/stripe/checkout](./CHECKOUT_ENDPOINT.md) - Create checkout session
- [GET /api/auth/subscriptions](./AUTH_ENDPOINTS.md) - Get all subscriptions
- [POST /api/webhooks/stripe](./WEBHOOK_ENDPOINT.md) - Handle Stripe events

---

## Common Use Cases

### 1. Display Current Plan
```
Check /api/subscription → Show plan name and price
```

### 2. Verify Feature Access
```
Check subscription.resources[feature] → Grant/deny access
```

### 3. Show Renewal Reminder
```
Check daysRemaining < 30 → Show renewal prompt
```

### 4. Handle Expired Subscription
```
If status === 'cancelada' → Show upgrade prompt
```

### 5. Display Available Limits
```
Show resources from subscription → Display plan features
```

---

## Changelog

**Version 1.0** (2024-01-15)
- Initial subscription endpoint implementation
- Includes plan details (name, price, description)
- Calculated remaining days
- Status indicators
- Full resource/features listing

---

**Last Updated:** 2024-01-15  
**Status:** ✅ Production Ready  
**Maintained By:** TRINITY OF LUCK Team

---

## Quick Links

- [Full Documentation](./SUBSCRIPTION_ENDPOINT.md) (this file)
- [Quick Reference](./SUBSCRIPTION_QUICK_REF.md)
- [Implementation Summary](./SUBSCRIPTION_DELIVERY.md)
- [Test Suite](./test-subscription.js)

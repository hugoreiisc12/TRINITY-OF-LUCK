# GET /api/subscription - Quick Reference

## One-Liner Summary
Get current active subscription with plan details, status, and remaining days.

---

## Quick Start

### cURL
```bash
curl -X GET http://localhost:3001/api/subscription \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### JavaScript
```javascript
const response = await fetch('http://localhost:3001/api/subscription', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const { data } = await response.json();
console.log(data.planName);      // "Premium"
console.log(data.status);         // "ativa"
console.log(data.daysRemaining);  // 45
```

### React
```javascript
import { useState, useEffect } from 'react';

function PlanCard({ token }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/subscription', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setPlan(d.data))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div>Loading...</div>;
  if (!plan) return <div>No subscription</div>;

  return (
    <div>
      <h2>{plan.planName}</h2>
      <p>R$ {plan.planPrice}/month</p>
      <p>Status: {plan.status}</p>
    </div>
  );
}
```

---

## API Overview

| Aspect | Details |
|--------|---------|
| **Method** | GET |
| **Path** | /api/subscription |
| **Auth** | ✅ Required (JWT) |
| **Base URL** | http://localhost:3001 |

---

## Request / Response

### Request
```http
GET /api/subscription
Authorization: Bearer YOUR_JWT_TOKEN
```

### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "subscriptionId": "uuid",
    "planName": "Premium",
    "planPrice": 99.90,
    "status": "ativa",
    "startDate": "2024-01-15T10:30:00Z",
    "daysRemaining": 45,
    "isActive": true,
    "resources": {
      "análises_por_mês": 50,
      "plataformas": 10
    }
  }
}
```

### Response (No Subscription - 404)
```json
{
  "success": false,
  "error": "No active subscription found"
}
```

---

## Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | ✅ Has subscription | Use data |
| 404 | ❌ No subscription | Show upgrade prompt |
| 401 | ❌ Not authenticated | Login first |
| 500 | ❌ Server error | Retry later |

---

## Common Patterns

### Check if User has Subscription
```javascript
try {
  const sub = await getSubscription(token);
  if (sub) {
    // Has active subscription
    showDashboard(sub);
  }
} catch (e) {
  if (e.status === 404) {
    // No subscription
    showUpgradePrompt();
  }
}
```

### Show Plan Details
```javascript
const sub = await getSubscription(token);
console.log(`Plan: ${sub.planName}`);
console.log(`Price: R$ ${sub.planPrice}`);
console.log(`Days left: ${sub.daysRemaining}`);
```

### Check Feature Limits
```javascript
const sub = await getSubscription(token);
const limit = sub.resources.análises_por_mês;
if (usedAnalyses >= limit) {
  showUpgradeNeeded();
}
```

### Renewal Reminder
```javascript
const sub = await getSubscription(token);
if (sub.daysRemaining && sub.daysRemaining < 30) {
  showRenewalWarning(sub.daysRemaining);
}
```

---

## Response Fields Quick Reference

| Field | Type | Example |
|-------|------|---------|
| `planName` | string | "Premium" |
| `planPrice` | number | 99.90 |
| `status` | string | "ativa" |
| `daysRemaining` | number | 45 |
| `isActive` | boolean | true |
| `resources` | object | { "análises": 50 } |
| `startDate` | ISO string | "2024-01-15T..." |
| `endDate` | ISO string \| null | null |

---

## Error Handling

### No Subscription
```javascript
if (response.status === 404) {
  // Show: "No active plan. Click to upgrade."
}
```

### Not Authenticated
```javascript
if (response.status === 401) {
  // Show: "Please login first"
}
```

### Server Error
```javascript
if (response.status === 500) {
  // Show: "Please try again later"
}
```

---

## Testing

```bash
# Get subscription
curl -X GET http://localhost:3001/api/subscription \
  -H "Authorization: Bearer $TOKEN"

# Check if active
curl -s http://localhost:3001/api/subscription \
  -H "Authorization: Bearer $TOKEN" | jq '.data.isActive'

# Show plan name
curl -s http://localhost:3001/api/subscription \
  -H "Authorization: Bearer $TOKEN" | jq '.data.planName'
```

---

## Files Reference

| File | Purpose |
|------|---------|
| server.js | Backend (GET /api/subscription) |
| SUBSCRIPTION_ENDPOINT.md | Full docs |
| SUBSCRIPTION_QUICK_REF.md | This file |
| SUBSCRIPTION_DELIVERY.md | Implementation |

---

## Workflow

```
1. User logged in (has JWT token)
   ↓
2. Call GET /api/subscription
   ↓
3. Check status code
   ├─ 200 → Show plan details
   ├─ 404 → Show upgrade button
   └─ 401 → Show login page
   ↓
4. Display plan info to user
```

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| 401 error | No token | Login first |
| 404 error | No plan | Show upgrade |
| 500 error | Server issue | Retry later |
| Wrong data | Cached | Clear cache |

---

## Related Endpoints

- GET /api/plans - List plans
- POST /api/stripe/checkout - Buy plan
- GET /api/auth/subscriptions - All subscriptions

---

**Status:** ✅ Production Ready  
**Quick Links:** [Full Docs](./SUBSCRIPTION_ENDPOINT.md) | [Implementation](./SUBSCRIPTION_DELIVERY.md)

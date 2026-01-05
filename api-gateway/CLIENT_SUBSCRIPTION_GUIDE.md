# Subscription Client - Usage Guide

**File:** `client-subscription.js`  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

This is a lightweight JavaScript client for the GET `/api/subscription` endpoint. It provides convenient methods for checking subscription status, feature access, and managing subscription data.

## Installation

### Browser/Frontend

```html
<!-- Include in HTML -->
<script src="/path/to/client-subscription.js"></script>

<script>
  const client = new SubscriptionClient('http://localhost:3001');
  // Use client...
</script>
```

### Node.js/Backend

```javascript
const SubscriptionClient = require('./client-subscription.js');
const client = new SubscriptionClient('http://localhost:3001');
```

## Initialization

### Basic Setup

```javascript
// Initialize with default URL
const client = new SubscriptionClient();

// Or specify custom URL
const client = new SubscriptionClient('https://api.example.com');

// Set authentication token
client.setToken(userJwtToken);
```

### With User Data

```javascript
// Create client and authenticate
const client = new SubscriptionClient();
client.setToken(localStorage.getItem('jwt_token'));

// Now ready to use
const subscription = await client.getSubscription();
```

## Core Methods

### getSubscription()

Get the complete subscription object for current user.

```javascript
try {
  const subscription = await client.getSubscription();
  
  if (subscription) {
    console.log(`Plan: ${subscription.planName}`);
    console.log(`Status: ${subscription.status}`);
    console.log(`Days remaining: ${subscription.daysRemaining}`);
  } else {
    console.log('No active subscription');
  }
} catch (error) {
  console.error(`Error: ${error.error}`);
}
```

**Returns:**
```javascript
{
  subscriptionId: "550e8400-e29b-41d4-a716-446655440000",
  planId: "660e8400-e29b-41d4-a716-446655440001",
  planName: "Premium",
  planPrice: 99.99,
  planDescription: "Full access to all features",
  status: "ativa",
  startDate: "2024-01-15T10:30:00Z",
  endDate: "2025-01-15T10:30:00Z",
  resources: { ... },
  daysRemaining: 285,
  isActive: true,
  isCancelled: false
}
```

### isActive()

Check if user has an active subscription.

```javascript
const hasActive = await client.isActive();
if (hasActive) {
  // Show premium features
} else {
  // Show upgrade prompt
}
```

**Returns:** `boolean`

### getPlanName()

Get the name of the current subscription plan.

```javascript
const plan = await client.getPlanName();
console.log(`You are on the ${plan} plan`);
```

**Returns:** `string | null`

### hasFeature(feature)

Check if user has access to a specific feature.

```javascript
const canExport = await client.hasFeature('exportar_resultados');
if (canExport) {
  // Show export button
  showExportButton();
} else {
  // Show locked feature
  showLockedFeature();
}
```

**Parameters:**
- `feature` (string) - Feature name to check

**Returns:** `boolean`

**Common Features:**
- `'análises_por_mês'` - Analyses per month limit
- `'histórico_completo'` - Full history access
- `'suporte_prioritário'` - Priority support
- `'exportar_resultados'` - Export results
- `'previsões_avançadas'` - Advanced predictions

### getResources()

Get all available resources/features for current subscription.

```javascript
const resources = await client.getResources();
if (resources) {
  Object.entries(resources).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });
}
```

**Returns:** `object | null`

### getDaysRemaining()

Get number of days remaining until subscription expires.

```javascript
const daysLeft = await client.getDaysRemaining();

if (daysLeft === null) {
  console.log('Subscription does not expire');
} else if (daysLeft < 30) {
  console.log(`⚠️  Only ${daysLeft} days left!`);
} else {
  console.log(`${daysLeft} days remaining`);
}
```

**Returns:** `number | null` (null if no end date)

### isExpiringSoon(withinDays)

Check if subscription is expiring within specified days.

```javascript
// Check if expiring within 30 days
const expiringSoon = await client.isExpiringSoon(30);

if (expiringSoon) {
  // Show renewal reminder
  showRenewalReminder();
}

// Check if expiring within 7 days
const urgentRenewal = await client.isExpiringSoon(7);
```

**Parameters:**
- `withinDays` (number) - Days to check (default: 30)

**Returns:** `boolean`

## Utility Methods

### getStatus()

Get current subscription status.

```javascript
const status = await client.getStatus();
console.log(`Status: ${status}`); // 'ativa' or 'cancelada'
```

**Returns:** `'ativa' | 'cancelada' | null`

### getPlanPrice()

Get subscription plan price.

```javascript
const price = await client.getPlanPrice();
console.log(`Price: $${price}/month`);
```

**Returns:** `number | null`

### getStartDate() / getEndDate()

Get subscription dates.

```javascript
const startDate = await client.getStartDate();
const endDate = await client.getEndDate();

console.log(`Started: ${new Date(startDate).toLocaleDateString()}`);
console.log(`Expires: ${new Date(endDate).toLocaleDateString()}`);
```

**Returns:** `string | null` (ISO datetime format)

### isCancelled()

Check if subscription is cancelled.

```javascript
const isCancelled = await client.isCancelled();
if (isCancelled) {
  // Show cancelled notice
}
```

**Returns:** `boolean`

### getFeatureLevel(feature)

Get the specific value of a feature (might be boolean, number, or string).

```javascript
// Get analyses per month limit
const limit = await client.getFeatureLevel('análises_por_mês');
console.log(`You can run ${limit} analyses per month`);

// Check if feature is enabled
const hasHistory = await client.getFeatureLevel('histórico_completo');
if (hasHistory) {
  // Show full history
}
```

**Parameters:**
- `feature` (string) - Feature name

**Returns:** `any | null` (value depends on feature type)

### canPerform(features)

Validate that user can perform an action (has subscription + required features).

```javascript
// Check single feature
const canAnalyze = await client.canPerform('análises_por_mês');

// Check multiple features
const canExportAnalysis = await client.canPerform(['análises_por_mês', 'exportar_resultados']);

if (canExportAnalysis) {
  // Perform export
} else {
  // Show error or upgrade prompt
}
```

**Parameters:**
- `features` (string | array) - Single feature or array of features

**Returns:** `boolean`

## Cache Management

### refreshSubscription()

Force refresh subscription data from server (clears cache).

```javascript
// After user upgrades plan, refresh subscription
await client.refreshSubscription();

// Now getSubscription() will fetch fresh data
const updated = await client.getSubscription();
```

**Returns:** `Promise<object | null>`

### clearCache()

Manually clear the local cache.

```javascript
// When user logs out
client.clearCache();
client.setToken(null);

// Or when switching users
client.clearCache();
client.setToken(newUserToken);
```

### Cache Details

- **Default expiry:** 5 minutes
- **Automatically cleared when:** setToken() called, client switches users
- **Manually clear:** clearCache()

## React Hooks

### useSubscription Hook

```javascript
import { useEffect, useState } from 'react';

function useSubscription(token) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const client = new SubscriptionClient();
    client.setToken(token);

    client
      .getSubscription()
      .then(setSubscription)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [token]);

  return { subscription, loading, error };
}

// Usage
function SubscriptionStatus() {
  const { subscription, loading } = useSubscription(userToken);

  if (loading) return <div>Loading...</div>;
  if (!subscription) return <div>No subscription</div>;

  return (
    <div>
      <h2>{subscription.planName}</h2>
      <p>Days remaining: {subscription.daysRemaining}</p>
    </div>
  );
}
```

### useFeaturesAccess Hook

```javascript
function useFeaturesAccess(token, features) {
  const [access, setAccess] = useState({});

  useEffect(() => {
    const client = new SubscriptionClient();
    client.setToken(token);

    Promise.all(
      features.map(feature =>
        client.hasFeature(feature).then(has => ({ feature, has }))
      )
    ).then(results => {
      const access = {};
      results.forEach(({ feature, has }) => {
        access[feature] = has;
      });
      setAccess(access);
    });
  }, [token, features]);

  return access;
}

// Usage
function Features() {
  const access = useFeaturesAccess(userToken, [
    'exportar_resultados',
    'suporte_prioritário',
  ]);

  return (
    <div>
      {access.exportar_resultados && <ExportButton />}
      {access.suporte_prioritário && <PriorityButton />}
    </div>
  );
}
```

## Error Handling

### Error Object

Errors thrown by the client have this structure:

```javascript
{
  status: 404,           // HTTP status code
  error: "No active subscription found for this user",
  message: "..." // Optional additional info
}
```

### Common Errors

```javascript
try {
  const subscription = await client.getSubscription();
} catch (error) {
  switch (error.status) {
    case 401:
      // Unauthorized - invalid token
      console.log('Authentication failed');
      break;
    case 404:
      // Not Found - no subscription
      console.log('No subscription - show upgrade');
      break;
    case 500:
      // Server Error
      console.log('Server error - try again');
      break;
    case 0:
      // Network Error
      console.log('Network error - check connection');
      break;
  }
}
```

### Safe Methods (No Throw)

Some methods return null/false instead of throwing:

```javascript
const isActive = await client.isActive();      // Returns boolean
const planName = await client.getPlanName();   // Returns string or null
const hasFeature = await client.hasFeature('feature');  // Returns boolean
```

## Real-World Examples

### Example 1: Show/Hide Premium Features

```javascript
class FeatureManager {
  constructor(token) {
    this.client = new SubscriptionClient();
    this.client.setToken(token);
  }

  async renderFeatures() {
    const [canExport, hasHistory, hasSupport] = await Promise.all([
      this.client.hasFeature('exportar_resultados'),
      this.client.hasFeature('histórico_completo'),
      this.client.hasFeature('suporte_prioritário'),
    ]);

    return {
      exportButton: canExport,
      historyTab: hasHistory,
      supportChat: hasSupport,
    };
  }
}
```

### Example 2: Renewal Reminder

```javascript
async function showRenewalReminder() {
  const client = new SubscriptionClient();
  client.setToken(userToken);

  const daysLeft = await client.getDaysRemaining();

  if (daysLeft === null) {
    // Lifetime subscription
    return;
  }

  if (daysLeft < 7) {
    showUrgentRenewalModal();
  } else if (daysLeft < 30) {
    showGentleRenewalBanner();
  }
}
```

### Example 3: Limit Enforcement

```javascript
async function checkUsageLimit(feature, currentUsage) {
  const client = new SubscriptionClient();
  client.setToken(userToken);

  const limit = await client.getFeatureLevel(feature);

  if (limit && currentUsage >= limit) {
    throw new Error(`Limit reached: ${limit} ${feature} per month`);
  }
}
```

### Example 4: Feature-Based Navigation

```javascript
async function getAccessiblePages() {
  const client = new SubscriptionClient();
  client.setToken(userToken);

  const pages = ['dashboard'];

  if (await client.hasFeature('análises_por_mês')) {
    pages.push('analysis');
  }

  if (await client.hasFeature('histórico_completo')) {
    pages.push('history');
  }

  if (await client.hasFeature('suporte_prioritário')) {
    pages.push('support');
  }

  return pages;
}
```

## API Reference

### Constructor

```javascript
new SubscriptionClient(apiUrl = 'http://localhost:3001', token = null)
```

### Methods

| Method | Returns | Async | Description |
|--------|---------|-------|-------------|
| `setToken(token)` | void | No | Set JWT authentication token |
| `getSubscription()` | object\|null | Yes | Get full subscription data |
| `isActive()` | boolean | Yes | Check if subscription active |
| `isCancelled()` | boolean | Yes | Check if subscription cancelled |
| `getPlanName()` | string\|null | Yes | Get plan name |
| `getPlanPrice()` | number\|null | Yes | Get plan price |
| `hasFeature(feature)` | boolean | Yes | Check feature access |
| `getResources()` | object\|null | Yes | Get all features |
| `getDaysRemaining()` | number\|null | Yes | Days until expiry |
| `getStartDate()` | string\|null | Yes | Get start date |
| `getEndDate()` | string\|null | Yes | Get end date |
| `getStatus()` | string\|null | Yes | Get status |
| `isExpiringSoon(days)` | boolean | Yes | Check if expiring soon |
| `getFeatureLevel(feature)` | any\|null | Yes | Get feature value |
| `canPerform(features)` | boolean | Yes | Validate user can perform action |
| `refreshSubscription()` | object\|null | Yes | Refresh from server |
| `clearCache()` | void | No | Clear local cache |

## Performance Tips

1. **Reuse Client Instance**
   ```javascript
   // Good - reuse same instance
   const client = new SubscriptionClient();
   const hasFeature1 = await client.hasFeature('feature1');
   const hasFeature2 = await client.hasFeature('feature2');

   // Avoid - creating new instances
   const has1 = await new SubscriptionClient().hasFeature('feature1');
   const has2 = await new SubscriptionClient().hasFeature('feature2');
   ```

2. **Batch Checks**
   ```javascript
   // Good - parallel requests
   const [canExport, canAnalyze] = await Promise.all([
     client.hasFeature('exportar'),
     client.hasFeature('análises'),
   ]);

   // Avoid - sequential requests
   const canExport = await client.hasFeature('exportar');
   const canAnalyze = await client.hasFeature('análises');
   ```

3. **Leverage Cache**
   ```javascript
   // Uses cache (5 min expiry)
   const sub1 = await client.getSubscription();
   const sub2 = await client.getSubscription(); // From cache

   // Force refresh when needed
   await client.refreshSubscription();
   ```

## Troubleshooting

### Token Not Set

**Problem:** Getting 401 errors

**Solution:**
```javascript
const token = localStorage.getItem('jwt_token');
if (token) {
  client.setToken(token);
} else {
  // User not authenticated
  redirectToLogin();
}
```

### Cache Not Updating

**Problem:** Feature changes not reflected

**Solution:**
```javascript
// After user upgrades
await client.refreshSubscription();

// Or clear and refetch
client.clearCache();
const fresh = await client.getSubscription();
```

### Network Errors

**Problem:** Getting error.status === 0

**Solution:**
```javascript
try {
  const subscription = await client.getSubscription();
} catch (error) {
  if (error.status === 0) {
    // Network error - retry
    setTimeout(() => retry(), 1000);
  }
}
```

## Browser Compatibility

- Chrome 55+
- Firefox 50+
- Safari 10+
- Edge 15+
- IE 11+ (with Promise polyfill)

## License

MIT

## Support

For issues or questions:
1. Check [SUBSCRIPTION_ENDPOINT.md](./SUBSCRIPTION_ENDPOINT.md)
2. Review [SUBSCRIPTION_QUICK_REF.md](./SUBSCRIPTION_QUICK_REF.md)
3. Check test suite: `node test-subscription.js`

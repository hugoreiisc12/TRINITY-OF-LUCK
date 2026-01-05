# GET /api/dashboard-metrics - Quick Start

## 5-Minute Setup

### 1. Verify API Gateway Running
```bash
npm start  # On port 3001
```

### 2. Get JWT Token
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

### 3. Call Dashboard Endpoint
```bash
curl http://localhost:3001/api/dashboard-metrics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. See Response
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalAnalyses": 42,
      "averageAccuracy": 87.5,
      "currentPlan": "Premium",
      "analysesLastWeek": 8
    },
    "trends": {
      "weeklyGrowthPercentage": 19.0,
      "mostUsedNiche": "mega-sena",
      "nicheDistribution": {...}
    },
    "recent": {
      "analyses": [...],
      "lastAnalysisDate": "2026-01-04T..."
    },
    "stats": {...}
  },
  "timestamp": "2026-01-04T10:35:20.123Z"
}
```

## JavaScript Example
```javascript
const token = 'your-jwt-token';

const response = await fetch('http://localhost:3001/api/dashboard-metrics', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { data } = await response.json();
console.log(`Total: ${data.overview.totalAnalyses}`);
console.log(`Accuracy: ${data.overview.averageAccuracy}%`);
console.log(`Growth: ${data.trends.weeklyGrowthPercentage}%`);
```

## React Hook
```typescript
import { useEffect, useState } from 'react';

export function useDashboardMetrics(token: string) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard-metrics', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(data => setMetrics(data.data))
    .finally(() => setLoading(false));
  }, [token]);

  return { metrics, loading };
}

// Usage
const { metrics, loading } = useDashboardMetrics(token);
if (loading) return <div>Loading...</div>;
return <div>Total: {metrics.data.overview.totalAnalyses}</div>;
```

## Common Metrics

| Metric | Field | Type | Use Case |
|--------|-------|------|----------|
| Total | `overview.totalAnalyses` | number | Main counter |
| Accuracy | `overview.averageAccuracy` | number | Quality metric |
| Plan | `overview.currentPlan` | string | User tier |
| Weekly | `overview.analysesLastWeek` | number | Activity |
| Growth | `trends.weeklyGrowthPercentage` | number | Trend |
| Top Niche | `trends.mostUsedNiche` | string | User preference |

## Run Tests
```bash
node test-dashboard.js
```

## Troubleshooting

### "Unauthorized"
```bash
# Get fresh token
curl -X POST http://localhost:3001/api/auth/login \
  -d '{"email": "test@example.com", "password": "pass"}'
```

### "Failed to fetch metrics"
```bash
# Check server is running
npm start

# Check database connection
tail -f server.log
```

### Slow response (>3 seconds)
```
Solutions:
1. Add database indexes
2. Enable frontend caching (5 min)
3. Check database load
```

## Dashboard Widget Ideas

```typescript
// 1. Overview Cards
<MetricCard label="Total Analyses" value={metrics.overview.totalAnalyses} />
<MetricCard label="Accuracy" value={`${metrics.overview.averageAccuracy}%`} />
<MetricCard label="Plan" value={metrics.overview.currentPlan} />
<MetricCard label="This Week" value={metrics.overview.analysesLastWeek} />

// 2. Pie Chart (Niche Distribution)
<PieChart data={metrics.trends.nicheDistribution} />

// 3. Bar Chart (Recent Analyses)
<BarChart data={metrics.recent.analyses} />

// 4. Progress Bar (Accuracy)
<ProgressBar value={metrics.stats.averageAccuracyPercentage} max={100} />
```

## More Resources

- **Full Spec:** [DASHBOARD_ENDPOINT.md](DASHBOARD_ENDPOINT.md)
- **Quick Ref:** [DASHBOARD_QUICK_REF.md](DASHBOARD_QUICK_REF.md)
- **Deployment:** [DASHBOARD_DELIVERY.md](DASHBOARD_DELIVERY.md)
- **Tests:** [test-dashboard.js](test-dashboard.js)

---

**Status:** ✅ Ready to use  
**API Port:** 3001  
**Auth:** JWT Bearer Token required

# GET /api/dashboard-metrics - Quick Reference

## One-Liner
```bash
curl -X GET http://localhost:3001/api/dashboard-metrics \
  -H "Authorization: Bearer $JWT"
```

## Success Response
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
      "nicheDistribution": {
        "mega-sena": 18,
        "lotofacil": 15,
        "quina": 9
      }
    },
    "recent": {
      "analyses": [...],
      "lastAnalysisDate": "2026-01-04T10:30:45.000Z"
    },
    "stats": {
      "totalNiches": 3,
      "totalFeedback": 42,
      "averageAccuracyPercentage": 88
    }
  },
  "timestamp": "2026-01-04T10:35:20.123Z"
}
```

## Quick Examples

### JavaScript
```javascript
const token = localStorage.getItem('jwt_token');
const response = await fetch('/api/dashboard-metrics', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log(`Total: ${data.data.overview.totalAnalyses}`);
console.log(`Accuracy: ${data.data.overview.averageAccuracy}%`);
```

### Axios
```javascript
const { data } = await axios.get('/api/dashboard-metrics', {
  headers: { 'Authorization': `Bearer ${token}` }
});
console.log(data.data.overview);  // { totalAnalyses, averageAccuracy, ... }
```

### React Hook
```typescript
const [metrics, setMetrics] = useState(null);

useEffect(() => {
  fetch('/api/dashboard-metrics', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(r => r.json())
  .then(data => setMetrics(data.data));
}, []);
```

### Python
```python
import requests
response = requests.get(
  'http://localhost:3001/api/dashboard-metrics',
  headers={'Authorization': f'Bearer {token}'}
)
metrics = response.json()['data']
print(metrics['overview'])  # Dict with totalAnalyses, averageAccuracy, etc
```

## Response Fields

| Field | Type | Purpose |
|-------|------|---------|
| `overview.totalAnalyses` | number | Total analyses performed |
| `overview.averageAccuracy` | number | Average accuracy (0-100) |
| `overview.currentPlan` | string | Current plan name |
| `overview.analysesLastWeek` | number | Analyses in last 7 days |
| `trends.weeklyGrowthPercentage` | number | Growth % last 7 days |
| `trends.mostUsedNiche` | string | Most frequently analyzed lottery |
| `trends.nicheDistribution` | object | Count per niche type |
| `recent.analyses` | array | Last 5 analyses |
| `recent.lastAnalysisDate` | string | Most recent analysis date |
| `stats.totalNiches` | number | Number of different niches used |
| `stats.totalFeedback` | number | Feedback entries count |
| `stats.averageAccuracyPercentage` | number | Accuracy as % (0-100) |

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | ✅ Metrics fetched successfully |
| 401 | ❌ Invalid/missing JWT token |
| 500 | ❌ Server error |

## Error Responses

### 401 Unauthorized
```json
{ "success": false, "error": "Unauthorized" }
```

### 500 Server Error
```json
{
  "success": false,
  "error": "Failed to fetch dashboard metrics",
  "details": "Database connection failed"
}
```

## Common Issues

### "Unauthorized"
```
Solutions:
1. Get valid JWT: POST /api/auth/login
2. Check header: "Authorization: Bearer TOKEN"
3. Token not expired? Re-login if needed
```

### "Failed to fetch metrics"
```
Solutions:
1. Check server is running: npm start
2. Check database connection
3. Verify Supabase tables exist
4. Check server logs
```

### Slow response (>5 seconds)
```
Solutions:
1. Add database indexes
2. Enable frontend caching (5 min)
3. Check database load
4. Check network latency
```

## Performance Tips

1. **Frontend Caching**
   ```javascript
   // Cache for 5 minutes
   localStorage.setItem('dashboardMetrics', JSON.stringify(data));
   localStorage.setItem('dashboardMetricsTime', Date.now());
   ```

2. **Auto-Refresh**
   ```javascript
   // Refresh every 5 minutes
   setInterval(() => fetchMetrics(), 5 * 60 * 1000);
   ```

3. **Conditional Updates**
   ```javascript
   // Only update if significantly changed
   if (newAccuracy !== oldAccuracy || newTotal !== oldTotal) {
     setMetrics(newMetrics);
   }
   ```

## Database Tables Used

- `analises` - User analyses history
- `feedback` - Analysis feedback (accuracy ratings)
- `assinaturas` - User subscriptions
- `planos` - Plan information

## Related Endpoints

- `GET /api/results/:id` - Get specific analysis
- `GET /api/history` - Get analysis history with filters
- `POST /api/feedback` - Submit feedback
- `GET /api/plans` - View available plans

## Dashboard Widgets

Use this endpoint to populate:

1. **Overview Cards**
   - Total Analyses
   - Average Accuracy
   - Current Plan
   - Weekly Growth

2. **Charts**
   - Niche Distribution (pie/bar chart)
   - Recent Analyses (list)
   - Accuracy Trend (line chart)
   - Activity Timeline

3. **Metrics Display**
   - Last Analysis Date
   - Most Used Niche
   - Total Niches Analyzed
   - Total Feedback Given

## Default Values

If user has no data:
- `totalAnalyses`: 0
- `averageAccuracy`: 0
- `weeklyGrowthPercentage`: 0
- `nicheDistribution`: {}
- `analyses`: []
- `lastAnalysisDate`: null

## Timestamp

Response includes `timestamp` field for:
- Cache validity checking
- Data freshness indication
- Debugging timing issues


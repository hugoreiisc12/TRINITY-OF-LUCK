# GET /api/dashboard-metrics - Dashboard Analytics

## Overview

The `/api/dashboard-metrics` endpoint aggregates user data from Supabase and returns comprehensive analytics for the frontend dashboard. It provides real-time insights into analysis history, accuracy trends, and usage patterns.

**Endpoint:** `GET /api/dashboard-metrics`  
**Authentication:** Required (JWT Bearer Token)  
**Method:** GET  
**Response Time:** 1-3 seconds (multiple parallel queries)  
**Cache:** Recommended: 5 minutes

---

## Request

### Headers
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### Query Parameters
None required. Endpoint uses authenticated user ID from JWT token.

---

## Response

### Success (200 OK)

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
      "analyses": [
        {
          "id": "uuid-1",
          "nicho": "mega-sena",
          "data_criacao": "2026-01-04T10:30:45.000Z",
          "precisao": 92.5
        },
        {
          "id": "uuid-2",
          "nicho": "lotofacil",
          "data_criacao": "2026-01-03T15:22:30.000Z",
          "precisao": 88.0
        }
      ],
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

### Error: Unauthorized (401)

```json
{
  "success": false,
  "error": "Unauthorized",
  "details": "No valid JWT token provided"
}
```

### Error: Server Error (500)

```json
{
  "success": false,
  "error": "Failed to fetch dashboard metrics",
  "details": "Database connection error"
}
```

---

## Response Fields

### overview
```json
{
  "totalAnalyses": 42,          // Total analyses by user
  "averageAccuracy": 87.5,      // Average accuracy from all analyses
  "currentPlan": "Premium",     // Current subscription plan name
  "analysesLastWeek": 8         // Analyses performed in last 7 days
}
```

### trends
```json
{
  "weeklyGrowthPercentage": 19.0,  // Growth in last 7 days (%)
  "mostUsedNiche": "mega-sena",    // Most frequently analyzed niche
  "nicheDistribution": {            // Breakdown by niche
    "mega-sena": 18,
    "lotofacil": 15,
    "quina": 9
  }
}
```

### recent
```json
{
  "analyses": [                      // Last 5 analyses
    {
      "id": "uuid",
      "nicho": "mega-sena",
      "data_criacao": "2026-01-04T...",
      "precisao": 92.5
    }
  ],
  "lastAnalysisDate": "2026-01-04T10:30:45.000Z"  // Most recent analysis date
}
```

### stats
```json
{
  "totalNiches": 3,              // Number of different niches used
  "totalFeedback": 42,           // Number of feedback entries
  "averageAccuracyPercentage": 88  // Average accuracy as percentage (0-100)
}
```

---

## Status Codes

| Status | Meaning | Scenario |
|--------|---------|----------|
| 200 | OK | Metrics calculated successfully |
| 401 | Unauthorized | Missing or invalid JWT token |
| 500 | Internal Server Error | Database error or unexpected failure |

---

## Examples

### JavaScript/Fetch

```javascript
const token = localStorage.getItem('jwt_token');

const response = await fetch('/api/dashboard-metrics', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

const metrics = await response.json();
console.log('Total Analyses:', metrics.data.overview.totalAnalyses);
console.log('Average Accuracy:', metrics.data.overview.averageAccuracy);
console.log('Weekly Growth:', metrics.data.trends.weeklyGrowthPercentage + '%');
```

### Axios

```javascript
import axios from 'axios';

const token = localStorage.getItem('jwt_token');

const response = await axios.get('/api/dashboard-metrics', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const { overview, trends, recent, stats } = response.data.data;

console.log(`User has ${overview.totalAnalyses} analyses`);
console.log(`Most used niche: ${trends.mostUsedNiche}`);
console.log(`Last analysis: ${recent.lastAnalysisDate}`);
```

### React Component

```typescript
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface DashboardMetrics {
  overview: {
    totalAnalyses: number;
    averageAccuracy: number;
    currentPlan: string;
    analysesLastWeek: number;
  };
  trends: {
    weeklyGrowthPercentage: number;
    mostUsedNiche: string;
    nicheDistribution: Record<string, number>;
  };
  recent: {
    analyses: Array<{
      id: string;
      nicho: string;
      data_criacao: string;
      precisao: number;
    }>;
    lastAnalysisDate: string | null;
  };
  stats: {
    totalNiches: number;
    totalFeedback: number;
    averageAccuracyPercentage: number;
  };
}

export function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch('/api/dashboard-metrics', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch metrics');

        const data = await response.json();
        setMetrics(data.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load dashboard metrics',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (!metrics) return <div>No data available</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Overview Cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.overview.totalAnalyses}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.overview.analysesLastWeek} this week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.overview.averageAccuracy.toFixed(1)}%
          </div>
          <Progress
            value={metrics.overview.averageAccuracy}
            className="mt-2"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.overview.currentPlan}</div>
          <Badge className="mt-2">{metrics.stats.totalNiches} niches</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.trends.weeklyGrowthPercentage.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
        </CardContent>
      </Card>

      {/* Niche Distribution */}
      <Card className="col-span-full md:col-span-2">
        <CardHeader>
          <CardTitle>Niche Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(metrics.trends.nicheDistribution).map(([niche, count]) => (
              <div key={niche} className="flex items-center gap-4">
                <span className="font-medium w-32">{niche}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(count / metrics.overview.totalAnalyses) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Analyses */}
      <Card className="col-span-full md:col-span-2">
        <CardHeader>
          <CardTitle>Recent Analyses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.recent.analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{analysis.nicho}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(analysis.data_criacao).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline">{analysis.precisao.toFixed(1)}%</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Python

```python
import requests
from typing import Dict, Any

def get_dashboard_metrics(token: str) -> Dict[str, Any]:
    """Fetch dashboard metrics for authenticated user"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    response = requests.get(
        'http://localhost:3001/api/dashboard-metrics',
        headers=headers
    )
    
    if response.status_code != 200:
        raise Exception(f"Failed to fetch metrics: {response.json()}")
    
    return response.json()

# Usage
token = 'your-jwt-token'
metrics = get_dashboard_metrics(token)

print(f"Total Analyses: {metrics['data']['overview']['totalAnalyses']}")
print(f"Average Accuracy: {metrics['data']['overview']['averageAccuracy']}%")
print(f"Current Plan: {metrics['data']['overview']['currentPlan']}")
print(f"Weekly Growth: {metrics['data']['trends']['weeklyGrowthPercentage']}%")
print(f"Most Used Niche: {metrics['data']['trends']['mostUsedNiche']}")
```

### cURL

```bash
curl -X GET http://localhost:3001/api/dashboard-metrics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Database Schema

### Queries Used

The endpoint queries these tables:

**analises**
```sql
SELECT id, usuario_id, nicho, data_criacao, precisao
FROM analises
WHERE usuario_id = $1
```

**feedback**
```sql
SELECT precisao
FROM feedback
WHERE usuario_id = $1
```

**assinaturas**
```sql
SELECT planos.nome, assinaturas.status
FROM assinaturas
JOIN planos ON assinaturas.plan_id = planos.id
WHERE assinaturas.user_id = $1 AND assinaturas.status = 'ativa'
```

---

## Performance Characteristics

### Query Performance
- **Parallel Execution:** 5 queries run in parallel via Promise.all()
- **Typical Response Time:** 1-3 seconds
- **Database Load:** Minimal (aggregation happens in application layer)

### Optimization Tips

1. **Frontend Caching**
   ```javascript
   // Cache for 5 minutes
   const cachedMetrics = JSON.parse(localStorage.getItem('dashboardMetrics'));
   const lastFetch = localStorage.getItem('dashboardMetricsTime');
   
   if (cachedMetrics && Date.now() - lastFetch < 5 * 60 * 1000) {
     // Use cached data
     setMetrics(cachedMetrics);
   } else {
     // Fetch fresh data
     fetchMetrics();
   }
   ```

2. **Database Indexing**
   ```sql
   CREATE INDEX idx_analises_usuario ON analises(usuario_id, data_criacao);
   CREATE INDEX idx_feedback_usuario ON feedback(usuario_id);
   CREATE INDEX idx_assinaturas_user ON assinaturas(user_id, status);
   ```

3. **Consider Adding Cache in Backend**
   ```javascript
   const metricsCache = new Map();
   
   app.get('/api/dashboard-metrics', authenticateToken, async (req, res) => {
     const cacheKey = `metrics-${req.user.id}`;
     const cached = metricsCache.get(cacheKey);
     
     if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
       return res.json(cached.data);
     }
     
     // ... fetch fresh data ...
     
     metricsCache.set(cacheKey, {
       data: metrics,
       timestamp: Date.now()
     });
   });
   ```

---

## Best Practices

1. **Always include timestamp in response**
   - Helps frontend determine data freshness
   - Useful for cache invalidation

2. **Handle missing data gracefully**
   - Returns 0 for counts if no data exists
   - Returns `null` for dates if no analyses exist

3. **Use parallel queries**
   - 5 queries run simultaneously
   - Reduces total response time

4. **Cache on frontend**
   - Don't refresh more than every 5 minutes
   - Improves perceived performance

5. **Implement dashboard auto-refresh**
   ```javascript
   // Refresh every 5 minutes
   useEffect(() => {
     const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
     return () => clearInterval(interval);
   }, []);
   ```

---

## Error Handling

### Scenario: Database Connection Error
```
Status: 500
Response: { success: false, error: "Failed to fetch dashboard metrics" }
Solution: Check Supabase connection, verify network
```

### Scenario: Invalid JWT Token
```
Status: 401
Response: { success: false, error: "Unauthorized" }
Solution: Log in again to get fresh token
```

### Scenario: Slow Response (>5 seconds)
```
Issue: Database queries taking too long
Solution: Add indexes, enable caching, check database load
```

---

## Related Endpoints

- `GET /api/results/:id` - Get specific analysis result
- `GET /api/history` - Get analysis history with filtering
- `POST /api/feedback` - Submit feedback on analysis
- `GET /api/subscription` - Get subscription details
- `GET /api/plans` - Get available plans

---

## Metrics Explained

### Average Accuracy
- Calculated from all feedback entries
- Represents user's perception of analysis quality
- Higher is better (0-100%)

### Weekly Growth
- Percentage of total analyses done in last 7 days
- Shows recent activity level
- Formula: `(analyses_last_7_days / total_analyses) * 100`

### Most Used Niche
- The lottery type user analyzes most
- Useful for personalization
- Based on total count per niche

### Niche Distribution
- Breakdown of analyses by lottery type
- Shows user's interests
- Useful for pie/bar charts

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-04 | Initial implementation |

---

## Support

For issues or questions:
- Check server logs: `tail -f server.log`
- Verify JWT token is valid
- Ensure Supabase tables exist
- Review database indexes for performance


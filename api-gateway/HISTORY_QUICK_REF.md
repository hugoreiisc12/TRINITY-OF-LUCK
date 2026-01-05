# GET /api/history - Quick Reference

> User analysis history with learning metrics and optional filters

---

## 🚀 Quick Start

```javascript
// Get all history
const response = await fetch('/api/history', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log(`Total: ${data.data.pagination.total}`);
```

```bash
# cURL
curl -X GET http://localhost:3001/api/history \
  -H "Authorization: Bearer TOKEN"
```

---

## 📋 Query Parameters (All Optional)

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `data_inicio` | ISO/date | 2024-01-01 | Start date filter |
| `data_fim` | ISO/date | 2024-03-31 | End date filter |
| `nicho` | string | esportes | Market/niche filter |
| `limit` | int | 20 | Results per page (default: 50) |
| `offset` | int | 0 | Pagination offset |

---

## ✅ Success Response (200)

```json
{
  "success": true,
  "message": "Analysis history retrieved",
  "data": {
    "analyses": [
      {
        "id": "uuid",
        "nicho": "Esportes",
        "metrica_principal": "Win Rate",
        "acuracia": 0.87,
        "confianca": 0.92,
        "created_at": "2024-03-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 87,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    },
    "metrics": {
      "totalAnalyses": 87,
      "analyzedNiches": 5,
      "averageAccuracy": "0.84",
      "mostUsedMetric": "Win Rate",
      "latestAnalysis": "2024-03-15T10:30:00Z",
      "totalThisMonth": 23
    }
  }
}
```

---

## 🔍 Common Queries

### Get Latest 10 Analyses
```
GET /api/history?limit=10&offset=0
```

### Get March 2024 Analysis
```
GET /api/history?data_inicio=2024-03-01&data_fim=2024-03-31
```

### Get Crypto Analyses
```
GET /api/history?nicho=crypto
```

### Get Esportes Analyses (Page 2)
```
GET /api/history?nicho=esportes&limit=20&offset=20
```

### Get Q1 2024 with Niche Filter
```
GET /api/history?data_inicio=2024-01-01&data_fim=2024-03-31&nicho=sorteios
```

---

## 💻 Code Examples by Language

### JavaScript
```javascript
async function getHistory(filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/history?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

// Usage
const data = await getHistory({
  nicho: 'esportes',
  limit: 20
});
```

### Python
```python
import requests

def get_history(token, **filters):
    response = requests.get(
        'http://localhost:3001/api/history',
        headers={'Authorization': f'Bearer {token}'},
        params=filters
    )
    return response.json()

# Usage
data = get_history(token, nicho='crypto', limit=20)
```

### React
```javascript
const [history, setHistory] = useState(null);

useEffect(() => {
  fetch('/api/history?limit=20', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => setHistory(data.data));
}, [token]);
```

---

## 📊 Response Fields

### Analyses Array Items
- `id` - Analysis ID
- `nicho` - Market analyzed (e.g., "Esportes")
- `metrica_principal` - Metric used (e.g., "Win Rate")
- `acuracia` - Accuracy (0-1)
- `confianca` - Confidence (0-1)
- `resultados` - Results object
- `created_at` - Creation time (ISO 8601)

### Pagination
- `total` - Total matching results
- `limit` - Per-page limit
- `offset` - Current offset
- `hasMore` - More results available?

### Metrics
- `totalAnalyses` - Total count
- `analyzedNiches` - Unique niches count
- `averageAccuracy` - Average accuracy score
- `mostUsedMetric` - Most common metric
- `latestAnalysis` - Latest analysis date
- `totalThisMonth` - This month's count

---

## ❌ Error Responses

### 401 - Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```
**Fix:** Add valid `Authorization: Bearer <token>` header

### 500 - Server Error
```json
{
  "success": false,
  "error": "Failed to fetch analysis history",
  "details": "..."
}
```
**Fix:** Check server logs, verify Supabase connection

---

## 🔄 Pagination Example

```javascript
// Get page 2 (results 20-40)
const page2 = await getHistory({
  limit: 20,
  offset: 20
});

// Check if more pages
if (page2.data.pagination.hasMore) {
  // Get page 3
  const page3 = await getHistory({
    limit: 20,
    offset: 40
  });
}
```

---

## 🎯 Learning Metrics Explained

| Metric | Example | Meaning |
|--------|---------|---------|
| **totalAnalyses** | 87 | Total analyses performed |
| **analyzedNiches** | 5 | Number of different markets |
| **averageAccuracy** | 0.84 | Average prediction accuracy |
| **mostUsedMetric** | "Win Rate" | Most frequently used metric |
| **latestAnalysis** | 2024-03-15 | Last analysis date |
| **totalThisMonth** | 23 | Analyses this month |

---

## 🔗 Related Endpoints

- `GET /api/auth/analyses` - Simpler version (no filters/metrics)
- `GET /api/results/:id` - Get specific analysis
- `POST /api/analysis` - Create new analysis

---

## 📝 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| 401 error | Check JWT token, include Bearer prefix |
| Empty results | Adjust filters, check dates are valid |
| Slow response | Reduce limit, add more specific filters |
| No metrics shown | Ensure query has analyses |

---

## 🎓 Field Reference

```
/api/history                                   All analyses
/api/history?data_inicio=2024-01-01           Since January 1
/api/history?nicho=esportes                   Esportes only
/api/history?limit=10                         Top 10 results
/api/history?nicho=crypto&limit=20&offset=40 Crypto, page 2
```

---

**Status:** ✅ Production Ready  
**Last Updated:** January 4, 2026

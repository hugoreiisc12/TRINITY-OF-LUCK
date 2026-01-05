# GET /api/history - Analysis History with Learning Metrics

> Retrieve user's analysis history with optional filters and learning metrics

**Endpoint:** `GET /api/history`  
**Base URL:** `http://localhost:3001`  
**Authentication:** ✅ Required (JWT Bearer Token)  
**Rate Limit:** None (user-specific data)

---

## Quick Overview

This endpoint retrieves a user's analysis history from the `analises` table with:
- Optional filtering by date range
- Optional filtering by niche/market
- Pagination support
- Automatic learning metrics calculation
- Comprehensive sorting and ordering

---

## Request Format

### Method & Headers

```http
GET /api/history?data_inicio=2024-01-01&data_fim=2024-12-31&nicho=crypto&limit=20&offset=0

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Query Parameters (All Optional)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `data_inicio` | ISO string | null | Start date filter (YYYY-MM-DD or ISO) |
| `data_fim` | ISO string | null | End date filter (YYYY-MM-DD or ISO) |
| `nicho` | string | null | Niche/market filter (partial match, case-insensitive) |
| `limit` | integer | 50 | Number of results per page (1-100) |
| `offset` | integer | 0 | Pagination offset (for paging) |

### Example Requests

**Get all history (no filters):**
```
GET /api/history
```

**Get history for date range:**
```
GET /api/history?data_inicio=2024-01-01&data_fim=2024-03-31
```

**Get history for specific niche:**
```
GET /api/history?nicho=crypto
```

**Get history with pagination:**
```
GET /api/history?limit=20&offset=0
```

**Combined filters:**
```
GET /api/history?nicho=esportes&data_inicio=2024-06-01&data_fim=2024-12-31&limit=25&offset=0
```

---

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Analysis history retrieved",
  "data": {
    "analyses": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "user_id": "550e8400-e29b-41d4-a716-446655440100",
        "nicho": "Esportes",
        "metrica_principal": "Win Rate",
        "acuracia": 0.87,
        "confianca": 0.92,
        "resultados": {
          "numeros_sorteados": [12, 45, 67, 89, 23, 54],
          "probabilidade": 0.76,
          "tendencia": "ascendente"
        },
        "criado_em": "2024-03-15T10:30:00.000Z",
        "created_at": "2024-03-15T10:30:00.000Z",
        "updated_at": "2024-03-15T10:30:00.000Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "user_id": "550e8400-e29b-41d4-a716-446655440100",
        "nicho": "Esportes",
        "metrica_principal": "Hit Count",
        "acuracia": 0.79,
        "confianca": 0.88,
        "resultados": {
          "numeros_sorteados": [11, 22, 33, 44, 55, 66],
          "probabilidade": 0.68,
          "tendencia": "estavel"
        },
        "criado_em": "2024-03-14T09:15:00.000Z",
        "created_at": "2024-03-14T09:15:00.000Z",
        "updated_at": "2024-03-14T09:15:00.000Z"
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
      "latestAnalysis": "2024-03-15T10:30:00.000Z",
      "totalThisMonth": 23
    },
    "filters": {
      "dataInicio": null,
      "dataFim": null,
      "nicho": null
    }
  },
  "timestamp": "2024-03-15T14:30:00.000Z"
}
```

### Response Fields Explained

**analyses array:**
- `id` - Unique analysis identifier
- `user_id` - User who performed the analysis
- `nicho` - Market/niche analyzed (e.g., "Esportes", "Sorteios", "Loterias")
- `metrica_principal` - Primary metric used (e.g., "Win Rate", "Hit Count")
- `acuracia` - Accuracy score (0-1, e.g., 0.87 = 87%)
- `confianca` - Confidence score (0-1)
- `resultados` - Analysis results object with numbers, probability, trend
- `criado_em` - Creation timestamp (alternative field)
- `created_at` - Creation timestamp (ISO 8601)
- `updated_at` - Last update timestamp (ISO 8601)

**pagination:**
- `total` - Total number of analyses matching filters
- `limit` - Results per page
- `offset` - Current page offset
- `hasMore` - Boolean indicating if more results exist

**metrics (Learning Metrics):**
- `totalAnalyses` - Total analyses by user
- `analyzedNiches` - Count of unique niches analyzed
- `averageAccuracy` - Average accuracy across all analyses
- `mostUsedMetric` - Most frequently used metric
- `latestAnalysis` - Timestamp of most recent analysis
- `totalThisMonth` - Analyses performed this month

**filters:**
- `dataInicio` - Applied start date filter (if any)
- `dataFim` - Applied end date filter (if any)
- `nicho` - Applied niche filter (if any)

---

## Error Responses

### 401 - Unauthorized

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Cause:** Missing or invalid JWT token  
**Solution:** Include valid `Authorization: Bearer <token>` header

### 500 - Server Error

```json
{
  "success": false,
  "error": "Failed to fetch analysis history",
  "details": "Connection timeout"
}
```

**Cause:** Database connection failure or invalid query  
**Solution:** Check server logs, verify Supabase connection

---

## Code Examples

### JavaScript (Fetch API)

```javascript
// Basic usage
async function getAnalysisHistory(token) {
  const response = await fetch('/api/history', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return response.json();
}

// With filters
async function getAnalysisHistoryFiltered(token, filters) {
  const params = new URLSearchParams();
  
  if (filters.dataInicio) params.append('data_inicio', filters.dataInicio);
  if (filters.dataFim) params.append('data_fim', filters.dataFim);
  if (filters.nicho) params.append('nicho', filters.nicho);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);

  const url = `/api/history${params.toString() ? '?' + params.toString() : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return response.json();
}

// Usage
const history = await getAnalysisHistoryFiltered(token, {
  dataInicio: '2024-01-01',
  dataFim: '2024-03-31',
  nicho: 'esportes',
  limit: 25
});

console.log(`Total analyses: ${history.data.pagination.total}`);
console.log(`Average accuracy: ${history.data.metrics.averageAccuracy}`);
history.data.analyses.forEach(analysis => {
  console.log(`${analysis.nicho}: ${(analysis.acuracia * 100).toFixed(1)}% accuracy`);
});
```

### Python (Requests)

```python
import requests
from datetime import datetime

def get_analysis_history(token, filters=None):
    """Fetch user's analysis history"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    params = {}
    if filters:
        if 'data_inicio' in filters:
            params['data_inicio'] = filters['data_inicio']
        if 'data_fim' in filters:
            params['data_fim'] = filters['data_fim']
        if 'nicho' in filters:
            params['nicho'] = filters['nicho']
        if 'limit' in filters:
            params['limit'] = filters['limit']
        if 'offset' in filters:
            params['offset'] = filters['offset']
    
    response = requests.get(
        'http://localhost:3001/api/history',
        headers=headers,
        params=params
    )
    
    return response.json()

# Usage
filters = {
    'data_inicio': '2024-01-01',
    'data_fim': '2024-12-31',
    'nicho': 'crypto',
    'limit': 50
}

result = get_analysis_history(token, filters)

if result['success']:
    metrics = result['data']['metrics']
    print(f"Total Analyses: {metrics['totalAnalyses']}")
    print(f"Average Accuracy: {metrics['averageAccuracy']}")
    print(f"Niches Analyzed: {metrics['analyzedNiches']}")
    
    for analysis in result['data']['analyses']:
        print(f"\n{analysis['nicho']} - {analysis['metrica_principal']}")
        print(f"  Accuracy: {analysis['acuracia']*100:.1f}%")
        print(f"  Confidence: {analysis['confianca']*100:.1f}%")
else:
    print(f"Error: {result['error']}")
```

### Node.js (Axios)

```javascript
const axios = require('axios');

async function getAnalysisHistory(token, filters = {}) {
  try {
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: filters
    };

    const response = await axios.get(
      'http://localhost:3001/api/history',
      config
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching history:', error.response?.data);
    throw error;
  }
}

// Usage
(async () => {
  const history = await getAnalysisHistory(token, {
    nicho: 'esportes',
    limit: 20,
    offset: 0
  });

  console.log(`✅ Retrieved ${history.data.pagination.total} analyses`);
  console.log(`📊 Average Accuracy: ${history.data.metrics.averageAccuracy}`);
  console.log(`📈 Analyses this month: ${history.data.metrics.totalThisMonth}`);
})();
```

### React Hook Component

```javascript
import { useState, useEffect } from 'react';

export function AnalysisHistoryPage({ token }) {
  const [history, setHistory] = useState(null);
  const [filters, setFilters] = useState({
    nicho: '',
    dataInicio: '',
    dataFim: '',
    limit: 20,
    offset: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [filters]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const url = `/api/history${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setHistory(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading history...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div>
      <h2>Analysis History</h2>
      
      {/* Filters */}
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd' }}>
        <input
          type="text"
          placeholder="Filter by niche..."
          value={filters.nicho}
          onChange={e => setFilters({ ...filters, nicho: e.target.value, offset: 0 })}
        />
        
        <input
          type="date"
          value={filters.dataInicio}
          onChange={e => setFilters({ ...filters, dataInicio: e.target.value, offset: 0 })}
        />
        
        <input
          type="date"
          value={filters.dataFim}
          onChange={e => setFilters({ ...filters, dataFim: e.target.value, offset: 0 })}
        />

        <select
          value={filters.limit}
          onChange={e => setFilters({ ...filters, limit: parseInt(e.target.value), offset: 0 })}
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      {/* Metrics Summary */}
      {history && history.metrics && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f0f0' }}>
          <h3>Learning Metrics</h3>
          <p>📊 Total Analyses: <strong>{history.metrics.totalAnalyses}</strong></p>
          <p>🎯 Average Accuracy: <strong>{history.metrics.averageAccuracy}</strong></p>
          <p>📍 Niches Analyzed: <strong>{history.metrics.analyzedNiches}</strong></p>
          <p>🔝 Most Used Metric: <strong>{history.metrics.mostUsedMetric}</strong></p>
          <p>📈 This Month: <strong>{history.metrics.totalThisMonth}</strong></p>
        </div>
      )}

      {/* Analyses List */}
      {history && history.analyses && (
        <div>
          <h3>Analyses ({history.pagination.total} total)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#e0e0e0' }}>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Niche</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Metric</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Accuracy</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Confidence</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {history.analyses.map(analysis => (
                <tr key={analysis.id}>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{analysis.nicho}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{analysis.metrica_principal}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                    {(analysis.acuracia * 100).toFixed(1)}%
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                    {(analysis.confianca * 100).toFixed(1)}%
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                    {new Date(analysis.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => setFilters({ ...filters, offset: Math.max(0, filters.offset - filters.limit) })}
              disabled={filters.offset === 0}
            >
              Previous
            </button>
            <span style={{ margin: '0 10px' }}>
              Page {Math.floor(filters.offset / filters.limit) + 1}
            </span>
            <button
              onClick={() => setFilters({ ...filters, offset: filters.offset + filters.limit })}
              disabled={!history.pagination.hasMore}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### cURL Examples

**Get all history:**
```bash
curl -X GET http://localhost:3001/api/history \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Get with date filter:**
```bash
curl -X GET "http://localhost:3001/api/history?data_inicio=2024-01-01&data_fim=2024-03-31" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Get with niche filter:**
```bash
curl -X GET "http://localhost:3001/api/history?nicho=esportes" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Get with pagination:**
```bash
curl -X GET "http://localhost:3001/api/history?limit=20&offset=40" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Database Schema

### analises Table

```sql
CREATE TABLE analises (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES usuarios(id),
  nicho text NOT NULL,
  metrica_principal text NOT NULL,
  acuracia numeric DEFAULT 0.0,
  confianca numeric DEFAULT 0.0,
  resultados jsonb,
  criado_em timestamp DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_analises_user_id ON analises(user_id);
CREATE INDEX idx_analises_nicho ON analises(nicho);
CREATE INDEX idx_analises_created_at ON analises(created_at DESC);
CREATE INDEX idx_analises_user_date ON analises(user_id, created_at DESC);
```

---

## Query Performance

| Scenario | Query Time | Notes |
|----------|-----------|-------|
| Get all (no filters) | 50-100ms | Depends on result count |
| With date filter | 80-150ms | Uses created_at index |
| With niche filter | 100-200ms | Full text search pattern |
| With pagination | 50-100ms | Offset may affect performance |
| Combined filters | 150-300ms | Multiple conditions |

---

## Learning Metrics Explained

### totalAnalyses
Total number of analyses performed by the user. Useful for tracking activity level.

### analyzedNiches
Count of unique niches/markets analyzed. Shows market diversity.

### averageAccuracy
Average of all accuracy scores across analyses. Indicates prediction reliability.

```
Average Accuracy = Sum of all acuracia values / Total analyses
```

### mostUsedMetric
The most frequently used metric in analyses. Shows user preference.

```
Example: "Win Rate" appears in 25 analyses, more than any other metric
```

### latestAnalysis
Timestamp of the most recent analysis. Shows user activity recency.

### totalThisMonth
Number of analyses performed in the current calendar month. Useful for activity tracking.

---

## Filtering Guide

### Date Filtering

```javascript
// Between dates
?data_inicio=2024-01-01&data_fim=2024-03-31

// Supports ISO format
?data_inicio=2024-01-01T00:00:00Z&data_fim=2024-03-31T23:59:59Z

// Only from date
?data_inicio=2024-06-01

// Only until date
?data_fim=2024-12-31
```

### Niche Filtering

```javascript
// Exact match (case-insensitive)
?nicho=esportes

// Partial match
?nicho=sport    // Matches "Esportes", "Sports", etc.

// Multiple calls for multiple niches
// Note: Current implementation filters for ONE niche
// To get multiple niches, make separate requests or parse all and filter client-side
```

### Pagination

```javascript
// First 20 results
?limit=20&offset=0

// Results 20-40
?limit=20&offset=20

// Results 40-60
?limit=20&offset=40

// Max limit is typically 100
?limit=100&offset=0
```

---

## Security Considerations

✅ **Authentication Required** - JWT Bearer token must be provided  
✅ **User Isolation** - Users can only access their own analyses  
✅ **Input Validation** - Date formats validated  
✅ **SQL Injection Prevention** - Supabase client handles escaping  
✅ **Rate Limiting** - Consider adding for production  

---

## Related Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| **GET /api/history** | GET | Get analysis history ← **YOU ARE HERE** |
| GET /api/auth/analyses | GET | Get user analyses (simpler version) |
| GET /api/results/:id | GET | Get specific analysis result |
| POST /api/analysis/upload | POST | Upload new analysis |

---

## Changelog

**Version 1.0** (2024-03-15)
- ✅ GET /api/history implemented
- ✅ Date range filtering
- ✅ Niche filtering
- ✅ Pagination support
- ✅ Learning metrics calculation
- ✅ Comprehensive documentation

---

**Last Updated:** January 4, 2026  
**Status:** ✅ Production Ready  
**Maintained By:** TRINITY OF LUCK Team

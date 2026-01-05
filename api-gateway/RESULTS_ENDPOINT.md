# GET /api/results/:id - Analysis Results Endpoint

## Overview
Retrieve analysis results by ID from the database. Supports optional recalculation via Python for updated predictions, probabilities, and confidence scores.

## Authentication
❌ **Not required** - Public endpoint (but can use user token for authorization checks)

## Request

### Endpoint
```
GET /api/results/:id
GET /api/results/:id?recalculate=true
```

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Analysis ID (UUID format) |

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recalculate` | string | No | If "true", recalculates analysis using Python |

## Response

### Success (200)
```json
{
  "success": true,
  "message": "Analysis retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "titulo": "Super Bowl 2026",
    "descricao": "Prediction for Super Bowl LX outcome",
    "status": "completed",
    
    "contexto": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "titulo": "Sports Events",
      "descricao": "Analysis of major sports events"
    },
    
    "usuario": {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "email": "user@example.com",
      "nome": "John Doe"
    },
    
    "probabilidades": {
      "vitoria": 0.65,
      "empate": 0.15,
      "derrota": 0.20,
      "total": 1.0
    },
    
    "confianca": 0.87,
    
    "explicacoes": [
      "Based on team performance history",
      "Weather conditions favorable",
      "Player injury impact considered",
      "Historical head-to-head record analyzed"
    ],
    
    "dados": {
      "time_a": "Kansas City Chiefs",
      "time_b": "San Francisco 49ers",
      "local": "Las Vegas",
      "data": "2026-02-08",
      "historico": [
        { "ano": 2025, "vencedor": "Kansas City Chiefs" },
        { "ano": 2024, "vencedor": "San Francisco 49ers" }
      ]
    },
    
    "recalculado": false,
    
    "timestamps": {
      "criado_em": "2026-01-01T10:00:00.000Z",
      "atualizado_em": "2026-01-04T10:00:00.000Z",
      "consultado_em": "2026-01-04T16:30:00.000Z"
    }
  }
}
```

### With Recalculation (200)
```json
{
  "success": true,
  "message": "Analysis retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "titulo": "Super Bowl 2026",
    "descricao": "Prediction for Super Bowl LX outcome",
    
    "probabilidades": {
      "vitoria": 0.68,
      "empate": 0.12,
      "derrota": 0.20
    },
    
    "confianca": 0.89,
    
    "explicacoes": [
      "Updated with latest game statistics",
      "Recent player performance data incorporated",
      "Injury reports reviewed",
      "New betting odds factored in"
    ],
    
    "recalculado": true,
    
    "timestamps": {
      "criado_em": "2026-01-01T10:00:00.000Z",
      "atualizado_em": "2026-01-04T16:30:00.000Z",
      "consultado_em": "2026-01-04T16:30:05.000Z"
    }
  }
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "Analysis not found",
  "details": "No analysis found with ID: 550e8400-e29b-41d4-a716-446655440000"
}
```

### Invalid ID Format (400)
```json
{
  "success": false,
  "error": "Invalid analysis ID format",
  "details": "ID must be a valid UUID"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Failed to fetch analysis results",
  "details": "Database connection error"
}
```

## Features

✅ **Retrieve Analysis by ID** - Get complete analysis data  
✅ **Optional Recalculation** - Trigger Python recalculation  
✅ **Structured Response** - Probabilities, confidence, explanations  
✅ **User Context** - Returns user and context information  
✅ **Timestamps** - Creation, update, and query times  
✅ **Error Handling** - Comprehensive error messages  
✅ **UUID Validation** - Ensures valid analysis IDs  

## Response Fields

### Core Data
```javascript
{
  id: string,                    // Analysis UUID
  titulo: string,                // Analysis title
  descricao: string,             // Analysis description
  status: string,                // Status: pending, completed, error
  
  // Relationships
  contexto: Object,              // Associated context
  usuario: Object,               // Analysis owner
  
  // Results
  probabilidades: {
    vitoria: number,             // Win probability (0-1)
    empate: number,              // Draw probability (0-1)
    derrota: number,             // Loss probability (0-1)
    total: number,               // Should sum to 1.0
    ...additional_probabilities
  },
  
  confianca: number,             // Confidence score (0-1)
  explicacoes: string[],         // Explanation array
  dados: Object,                 // Raw analysis data
  
  // Metadata
  recalculado: boolean,          // Was recalculated?
  timestamps: {
    criado_em: string,           // ISO creation timestamp
    atualizado_em: string,       // ISO update timestamp
    consultado_em: string        // ISO query timestamp
  }
}
```

## Testing

### Using cURL

Get analysis by ID:
```bash
curl http://localhost:3001/api/results/550e8400-e29b-41d4-a716-446655440000
```

With recalculation:
```bash
curl "http://localhost:3001/api/results/550e8400-e29b-41d4-a716-446655440000?recalculate=true"
```

Pretty print JSON:
```bash
curl http://localhost:3001/api/results/550e8400-e29b-41d4-a716-446655440000 | jq '.'
```

### Using JavaScript/Fetch

```javascript
// Get analysis
async function getAnalysisResults(id) {
  const response = await fetch(`/api/results/${id}`);
  const data = await response.json();
  return data;
}

// Get with recalculation
async function getAnalysisResultsRecalculated(id) {
  const response = await fetch(`/api/results/${id}?recalculate=true`);
  const data = await response.json();
  return data;
}

// Usage
const results = await getAnalysisResults('550e8400-e29b-41d4-a716-446655440000');
console.log(results.data.probabilidades);
console.log(results.data.confianca);
console.log(results.data.explicacoes);
```

### Using React

```javascript
import { useEffect, useState } from 'react';

function AnalysisResults({ analysisId }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/results/${analysisId}`)
      .then(r => r.json())
      .then(data => {
        setResults(data.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [analysisId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!results) return <div>No results found</div>;

  return (
    <div>
      <h2>{results.titulo}</h2>
      <p>{results.descricao}</p>
      
      <div>
        <h3>Probabilities</h3>
        <ul>
          <li>Win: {(results.probabilidades.vitoria * 100).toFixed(1)}%</li>
          <li>Draw: {(results.probabilidades.empate * 100).toFixed(1)}%</li>
          <li>Loss: {(results.probabilidades.derrota * 100).toFixed(1)}%</li>
        </ul>
      </div>
      
      <div>
        <h3>Confidence: {(results.confianca * 100).toFixed(1)}%</h3>
      </div>
      
      <div>
        <h3>Explanations</h3>
        <ul>
          {results.explicacoes.map((exp, i) => (
            <li key={i}>{exp}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

## Recalculation Process

### How it works
1. **Request received** with `?recalculate=true`
2. **Analysis fetched** from Supabase
3. **Python API called** with current analysis data
4. **New results computed** (probabilities, confidence, explanations)
5. **Database updated** with new results
6. **Response returned** with recalculated flag

### Python API Integration
Sends data to `http://localhost:5000/analyze`:
```json
{
  "dados": { /* analysis data */ },
  "contexto": {
    "titulo": "Analysis title",
    "descricao": "Analysis description"
  }
}
```

### Expected Python Response
```json
{
  "success": true,
  "probabilidades": {
    "vitoria": 0.68,
    "empate": 0.12,
    "derrota": 0.20
  },
  "confianca": 0.89,
  "explicacoes": ["Explanation 1", "Explanation 2"]
}
```

## Error Handling

| Error | Code | Cause | Solution |
|-------|------|-------|----------|
| Invalid ID format | 400 | ID is not a valid UUID | Provide valid UUID |
| Analysis not found | 404 | ID doesn't exist | Check analysis exists |
| Server error | 500 | Database error | Contact support |
| Recalc failed | 200 | Python API unavailable | Returns cached results |

## Performance

- **Response Time**: ~100-200ms (without recalculation)
- **With Recalculation**: ~3-5 seconds (depends on Python)
- **Cached Results**: Returned from database cache
- **Recalc Caching**: Results saved to database for future queries

## Rate Limiting

- **Global Limit**: 100 requests/minute per IP
- **No Auth Limit**: Public endpoint, same limit applies
- **Recalc**: Counts as single request (not extra)

## Future Enhancements

- [ ] Historical analysis comparisons
- [ ] Batch result retrieval
- [ ] Streaming recalculation progress
- [ ] Result export (PDF, CSV)
- [ ] Prediction accuracy tracking
- [ ] Result versioning/history
- [ ] Real-time result updates via WebSocket

---

**Last Updated:** January 4, 2026  
**Status:** Production Ready  
**Rate Limited:** Yes (100 req/min)  
**Authentication:** Not Required  
**Response Format:** JSON

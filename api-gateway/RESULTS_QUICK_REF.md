# GET /api/results/:id - Quick Reference

## Quick Start

### Get Analysis Results
```bash
curl http://localhost:3001/api/results/550e8400-e29b-41d4-a716-446655440000
```

### Recalculate Results
```bash
curl "http://localhost:3001/api/results/550e8400-e29b-41d4-a716-446655440000?recalculate=true"
```

## Response Format
```json
{
  "success": true,
  "message": "Analysis retrieved successfully",
  "data": {
    "id": "UUID",
    "titulo": "Analysis Title",
    "probabilidades": {
      "vitoria": 0.65,
      "empate": 0.15,
      "derrota": 0.20
    },
    "confianca": 0.87,
    "explicacoes": ["Explanation 1", "Explanation 2"],
    "dados": {...},
    "recalculado": false,
    "timestamps": {...}
  }
}
```

## JavaScript Examples

### Basic Usage
```javascript
const response = await fetch('/api/results/UUID-HERE');
const data = await response.json();
console.log(data.data.probabilidades);
console.log(data.data.confianca);
```

### With Recalculation
```javascript
const response = await fetch('/api/results/UUID-HERE?recalculate=true');
const data = await response.json();
console.log('Recalculated:', data.data.recalculado);
```

### Using Client Library
```javascript
import { 
  getAnalysisResults, 
  getProbabilities,
  getConfidence,
  getPrediction,
  formatConfidence 
} from './client-results.js';

// Get results
const data = await getAnalysisResults('UUID-HERE');

// Extract data
const probs = getProbabilities(data);
const confidence = getConfidence(data);
const prediction = getPrediction(data);

// Format for display
console.log(formatConfidence(confidence));  // "87.0%"
```

## React Examples

### Using Hook
```javascript
import { useResults } from './client-results.js';

function Analysis({ id }) {
  const { results, loading, error, recalculate } = useResults(id);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>{results.titulo}</h2>
      <p>Win: {(results.probabilidades.vitoria * 100).toFixed(1)}%</p>
      <p>Confidence: {(results.confianca * 100).toFixed(1)}%</p>
      <button onClick={recalculate}>Recalculate</button>
    </div>
  );
}
```

### Using Component
```javascript
import { ResultsDisplay } from './client-results.js';

function App() {
  return <ResultsDisplay analysisId="UUID-HERE" showRaw={false} />;
}
```

## Client Functions

```javascript
// Get results
getAnalysisResults(id)                    // Get by ID
getAnalysisResultsRecalculated(id)       // Force recalculation

// Extract data
getProbabilities(data)                    // Get probabilities object
getConfidence(data)                       // Get confidence score
getExplanations(data)                     // Get explanations array
getPrediction(data)                       // Get highest probability outcome
wasRecalculated(data)                     // Check if recalculated
getMetadata(data)                         // Get metadata

// Format data
formatProbabilities(probs)                // Format as percentages
formatConfidence(confidence)              // Format as percentage string

// Validate
isValidAnalysisId(id)                     // Validate UUID format
```

## Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Analysis found and returned |
| 400 | Bad Request | Invalid UUID format |
| 404 | Not Found | Analysis doesn't exist |
| 500 | Server Error | Database error |

## Request Examples

```bash
# Get specific analysis
curl http://localhost:3001/api/results/550e8400-e29b-41d4-a716-446655440000

# With pretty print
curl http://localhost:3001/api/results/550e8400-e29b-41d4-a716-446655440000 | jq '.'

# Recalculate
curl "http://localhost:3001/api/results/550e8400-e29b-41d4-a716-446655440000?recalculate=true"

# Extract probabilities
curl http://localhost:3001/api/results/550e8400-e29b-41d4-a716-446655440000 | jq '.data.probabilidades'

# Extract confidence
curl http://localhost:3001/api/results/550e8400-e29b-41d4-a716-446655440000 | jq '.data.confianca'
```

## Path Parameters

| Param | Type | Required | Example |
|-------|------|----------|---------|
| id | UUID | Yes | 550e8400-e29b-41d4-a716-446655440000 |

## Query Parameters

| Param | Type | Default | Options |
|-------|------|---------|---------|
| recalculate | string | false | "true", "false" |

## Response Fields

```
id                     - Analysis UUID
titulo                 - Title
descricao             - Description  
status                - Status
contexto              - Context info
usuario               - User info
probabilidades        - Probabilities object
confianca             - Confidence score (0-1)
explicacoes           - Explanations array
dados                 - Raw data
recalculado           - Was recalculated?
timestamps            - Creation/update times
```

## Error Handling

```javascript
try {
  const data = await getAnalysisResults(id);
  console.log(data.data);
} catch (error) {
  console.error('Failed:', error.message);
  // Error messages:
  // - "Analysis ID is required"
  // - "Analysis not found"
  // - "Invalid analysis ID format"
}
```

## Performance Notes

- **Without recalculation:** ~100-200ms
- **With recalculation:** ~3-5 seconds
- **Rate limit:** 100 req/min per IP

## Timestamp Format

All timestamps are ISO 8601 format:
```
2026-01-04T16:30:00.000Z
```

Convert in JavaScript:
```javascript
new Date(iso_string).toLocaleString()
```

## Status Code Reference

```
✅ 200 OK              - Success
⚠️  400 Bad Request    - Invalid input
❌ 404 Not Found       - Analysis doesn't exist
❌ 500 Server Error    - Database/server error
```

## Tips

1. Always validate ID before making request
2. Use `?recalculate=true` to get fresh predictions
3. Cache results to reduce API calls
4. Handle errors gracefully in UI
5. Format numbers for display (multiply by 100)

---

**Endpoint:** GET /api/results/:id  
**Status:** ✅ Production Ready  
**Rate Limited:** Yes (100 req/min)  
**Authentication:** Not Required  

# POST /api/feedback - Quick Reference

## Quick Start

```javascript
import { submitFeedback, useFeedback, FeedbackForm } from './client-feedback';

// Simple function call
const response = await submitFeedback(analysisId, 'vitoria');

// With React hook
const { submitFeedback, loading, error, success } = useFeedback();
await submitFeedback(analysisId, result);

// With pre-built form
<FeedbackForm analysisId={id} onSuccess={handleSuccess} />
```

## API Endpoint

```
POST http://localhost:3001/api/feedback
Content-Type: application/json

{
  "analysisId": "550e8400-e29b-41d4-a716-446655440000",
  "result": "vitoria"
}
```

## Response

```json
{
  "success": true,
  "message": "Feedback enviado",
  "data": {
    "feedbackId": "a7f8c2e1-9b4d-4c8e-b1d2-f3e4a5b6c7d8",
    "analysisId": "550e8400-e29b-41d4-a716-446655440000",
    "result": "vitoria",
    "timestamp": "2024-01-15T10:30:45.123Z"
  }
}
```

## Valid Results

| Value | Description |
|-------|-------------|
| `vitoria` | Correct prediction (win) |
| `empate` | Partial success (tie) |
| `derrota` | Incorrect prediction (loss) |
| `correto` | Correct |
| `incorreto` | Incorrect |
| `true` | Correct |
| `false` | Incorrect |

## Client Functions

```javascript
// Submit single feedback
submitFeedback(analysisId, result)

// Submit with refresh
submitFeedbackAndRefresh(analysisId, result, onSuccess)

// Submit multiple
submitBatchFeedback([
  { analysisId: 'id1', result: 'vitoria' },
  { analysisId: 'id2', result: 'derrota' }
])

// Validation
isValidResult('vitoria') // true
getValidResults() // ['vitoria', 'empate', ...]
```

## React Hooks

```javascript
const { submitFeedback, loading, error, success, data, reset } = useFeedback();
```

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Invalid input |
| 500 | Server error |

## Examples

### cURL
```bash
curl -X POST http://localhost:3001/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"analysisId": "550e8400...", "result": "vitoria"}'
```

### JavaScript
```javascript
const response = await fetch('http://localhost:3001/api/feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ analysisId, result })
});
const data = await response.json();
```

### React
```javascript
<FeedbackForm analysisId={id} onSuccess={() => alert('Saved!')} />
```

## Features

✅ Auto-saves to Supabase  
✅ Triggers Python retraining  
✅ Batch submission support  
✅ React hooks + component  
✅ Error handling + retry logic  
✅ Non-blocking (Python fail doesn't fail request)  
✅ Rate limited (100 req/min)

## Database

Saves to `feedbacks` table:
- `id` (UUID)
- `analysis_id` (UUID)
- `resultado` (string)
- `criado_em` (timestamp)

## Python Integration

Auto-triggers: `POST http://localhost:8000/retrain`

Sends:
```json
{
  "analysisId": "550e8400...",
  "result": "vitoria",
  "timestamp": "2024-01-15..."
}
```

---

**Full Docs:** See [FEEDBACK_ENDPOINT.md](./FEEDBACK_ENDPOINT.md)

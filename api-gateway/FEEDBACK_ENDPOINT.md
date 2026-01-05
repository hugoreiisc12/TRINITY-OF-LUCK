# POST /api/feedback - TRINITY OF LUCK Feedback API

## Overview

The feedback endpoint allows you to submit analysis results, triggering the Python learning loop for model retraining. This is a critical part of the continuous improvement system in TRINITY OF LUCK.

**Endpoint:** `POST /api/feedback`  
**Base URL:** `http://localhost:3001`  
**Authentication:** Optional (request will process regardless)  
**Rate Limit:** 100 requests/minute (global limit)

---

## Request Format

### Headers

```http
Content-Type: application/json
```

### Body

```json
{
  "analysisId": "550e8400-e29b-41d4-a716-446655440000",
  "result": "vitoria"
}
```

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `analysisId` | string (UUID) | ✅ Yes | ID of the analysis to provide feedback for |
| `result` | string/boolean | ✅ Yes | Outcome of the prediction. Valid values: `vitoria`, `empate`, `derrota`, `correto`, `incorreto`, `true`, `false` |

---

## Response Format

### Success Response (200 OK)

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

### Error Response (400 Bad Request)

```json
{
  "success": false,
  "error": "Missing required fields",
  "details": "analysisId and result are required"
}
```

### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Failed to save feedback",
  "details": "Database connection error"
}
```

---

## Error Codes

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| 400 | Missing required fields | `analysisId` or `result` not provided | Include both fields in request body |
| 400 | Invalid result value | Result is not in valid list | Use: `vitoria`, `empate`, `derrota`, `correto`, `incorreto`, `true`, `false` |
| 500 | Failed to save feedback | Database error | Check Supabase connection |
| 500 | Failed to process feedback | Server error | Check server logs |

---

## Examples

### cURL

#### Basic Feedback Submission

```bash
curl -X POST http://localhost:3001/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "analysisId": "550e8400-e29b-41d4-a716-446655440000",
    "result": "vitoria"
  }'
```

#### With Error Handling

```bash
#!/bin/bash

RESPONSE=$(curl -s -X POST http://localhost:3001/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "analysisId": "550e8400-e29b-41d4-a716-446655440000",
    "result": "vitoria"
  }')

SUCCESS=$(echo $RESPONSE | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
  echo "✅ Feedback sent successfully"
  echo $RESPONSE | jq '.'
else
  echo "❌ Error: $(echo $RESPONSE | jq -r '.error')"
  exit 1
fi
```

### JavaScript (Fetch)

#### Basic Usage

```javascript
const submitFeedback = async (analysisId, result) => {
  const response = await fetch('http://localhost:3001/api/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      analysisId,
      result,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to submit feedback');
  }

  return data;
};

// Usage
try {
  const feedback = await submitFeedback(
    '550e8400-e29b-41d4-a716-446655440000',
    'vitoria'
  );
  console.log('Feedback saved:', feedback.data.feedbackId);
} catch (error) {
  console.error('Error:', error.message);
}
```

#### With Retry Logic

```javascript
const submitFeedbackWithRetry = async (analysisId, result, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} of ${maxRetries}...`);
      return await submitFeedback(analysisId, result);
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error.message);

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

const submitFeedback = async (analysisId, result) => {
  try {
    const response = await axios.post('http://localhost:3001/api/feedback', {
      analysisId,
      result,
    });

    console.log('✅ Feedback submitted:', response.data.data.feedbackId);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.error);
    throw error;
  }
};
```

### React (Using Client Library)

```javascript
import { submitFeedback, useFeedback, FeedbackForm } from './client-feedback';

// Using hook
function FeedbackComponent() {
  const { submitFeedback, loading, error, success } = useFeedback();

  const handleFeedback = async () => {
    try {
      const result = await submitFeedback(analysisId, 'vitoria');
      console.log('Feedback saved:', result.data.feedbackId);
    } catch (err) {
      console.error('Error:', err.message);
    }
  };

  return (
    <div>
      <button onClick={handleFeedback} disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar Feedback'}
      </button>
      {error && <p style={{ color: 'red' }}>❌ {error}</p>}
      {success && <p style={{ color: 'green' }}>✅ Feedback enviado!</p>}
    </div>
  );
}

// Using pre-built form
function Page() {
  return (
    <FeedbackForm
      analysisId="550e8400-e29b-41d4-a716-446655440000"
      onSuccess={(response) => console.log('Saved:', response)}
      onError={(err) => console.error('Error:', err)}
    />
  );
}
```

---

## Database Integration

The feedback is stored in the Supabase `feedbacks` table with the following structure:

```sql
CREATE TABLE feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES analises(id),
  resultado VARCHAR(50) NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_analysis ON feedbacks(analysis_id);
CREATE INDEX idx_feedback_created ON feedbacks(criado_em DESC);
```

### Query Example

```sql
-- Get all feedbacks for an analysis
SELECT * FROM feedbacks WHERE analysis_id = '550e8400-e29b-41d4-a716-446655440000';

-- Get feedback statistics
SELECT 
  resultado,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM feedbacks), 2) as percentage
FROM feedbacks
GROUP BY resultado;

-- Get recent feedbacks
SELECT * FROM feedbacks 
ORDER BY criado_em DESC 
LIMIT 100;
```

---

## Python Integration

After feedback is submitted, the system automatically triggers the Python learning loop at:

```
POST http://localhost:8000/retrain
```

### What Gets Sent to Python

```json
{
  "analysisId": "550e8400-e29b-41d4-a716-446655440000",
  "result": "vitoria",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### Expected Python Response

```json
{
  "success": true,
  "message": "Model retraining scheduled",
  "trainedOn": ["feedback_1", "feedback_2", "feedback_3"]
}
```

### Python Endpoint Requirements

Your Python API at `localhost:8000/retrain` should:

1. Accept POST requests with `analysisId`, `result`, and `timestamp`
2. Update the machine learning model with the new feedback
3. Log the retraining process
4. Return a success response (or fail silently - the API doesn't wait for completion)

**Note:** The feedback submission is non-blocking. If Python is unavailable, the feedback is still saved and the request returns success.

---

## Valid Result Values

### String Results

| Value | Use Case | Example |
|-------|----------|---------|
| `vitoria` | Prediction was correct (win/success) | Lottery ticket matched prediction |
| `empate` | Partial success (tie/draw) | Some numbers matched |
| `derrota` | Prediction was incorrect (loss/failure) | No numbers matched |
| `correto` | General correctness | Used in other prediction contexts |
| `incorreto` | General incorrectness | Used in other prediction contexts |

### Boolean Results

| Value | Use Case |
|-------|----------|
| `true` | Prediction was correct |
| `false` | Prediction was incorrect |

### Example Usage

```javascript
// All valid
await submitFeedback(id, 'vitoria');
await submitFeedback(id, 'empate');
await submitFeedback(id, 'derrota');
await submitFeedback(id, 'correto');
await submitFeedback(id, 'incorreto');
await submitFeedback(id, true);
await submitFeedback(id, false);
```

---

## Performance Considerations

### Request Timing

- **Average Response Time:** 200-500ms (database write only)
- **With Python Retraining:** 200-500ms (Python call is async, non-blocking)
- **Timeout:** 30 seconds (API server timeout)

### Batch Submissions

For submitting multiple feedbacks, use the batch function:

```javascript
import { submitBatchFeedback } from './client-feedback';

const results = await submitBatchFeedback([
  { analysisId: 'id1', result: 'vitoria' },
  { analysisId: 'id2', result: 'empate' },
  { analysisId: 'id3', result: 'derrota' },
]);

console.log(`Submitted: ${results.submitted}, Failed: ${results.failed}`);
```

---

## Best Practices

1. **Always Validate Input:** Check that `result` is in the valid list before submitting
   ```javascript
   import { isValidResult } from './client-feedback';
   
   if (!isValidResult(result)) {
     throw new Error(`Invalid result: ${result}`);
   }
   ```

2. **Implement Error Handling:** Network issues can occur
   ```javascript
   try {
     await submitFeedback(analysisId, result);
   } catch (error) {
     // Retry, log, or notify user
     console.error('Feedback failed:', error.message);
   }
   ```

3. **Provide User Feedback:** Show loading and success states
   ```javascript
   const { submitFeedback, loading, success, error } = useFeedback();
   ```

4. **Rate Limiting:** Be aware of the 100 req/min limit
   ```javascript
   // Don't spam - implement reasonable delays
   await submitFeedback(id, result);
   await new Promise(r => setTimeout(r, 1000)); // 1 second delay
   ```

5. **Batch Large Submissions:** For multiple feedbacks, use the batch function
   ```javascript
   const batch = await submitBatchFeedback(feedbacks);
   ```

---

## Troubleshooting

### "Invalid result value"

**Problem:** Result is not in the valid list  
**Solution:** Use one of: `vitoria`, `empate`, `derrota`, `correto`, `incorreto`, `true`, `false`

### "Missing required fields"

**Problem:** `analysisId` or `result` not provided  
**Solution:** Ensure both fields are in the request body

### "Failed to save feedback"

**Problem:** Database error  
**Solution:** Check Supabase connection, verify `feedbacks` table exists

### Python retraining not triggered

**Problem:** Python API not responding  
**Solution:** This is non-blocking. Feedback still saved. Check Python server at `localhost:8000`

### CORS errors

**Problem:** Browser blocking cross-origin requests  
**Solution:** Ensure API server has CORS enabled (it should by default)

---

## Related Endpoints

- [GET /api/results/:id](./RESULTS_ENDPOINT.md) - Fetch analysis results
- [GET /api/platforms](./PLATFORMS_ENDPOINT.md) - Fetch available platforms

---

## Changelog

**Version 1.0** (2024-01-15)
- Initial feedback endpoint implementation
- Python retraining integration
- Client library with React hooks
- Batch submission support

---

## Support

For issues or questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review the [examples](#examples)
3. Check server logs: `tail -f api-gateway/logs/server.log`
4. Contact development team

---

**Last Updated:** 2024-01-15  
**Maintained By:** TRINITY OF LUCK Team

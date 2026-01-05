# POST /api/feedback - Integration & Configuration Guide

## 🔧 System Integration Overview

The feedback endpoint connects three key systems:

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (React)                          │
│                                                             │
│  import { FeedbackForm } from 'client-feedback'            │
│  <FeedbackForm analysisId={id} onSuccess={refresh} />      │
└────────────────────┬────────────────────────────────────────┘
                     │ POST /api/feedback
                     │ { analysisId, result }
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              API Gateway (Node.js/Express)                 │
│                                                             │
│  POST /api/feedback                                        │
│  1. Validate input                                         │
│  2. Save to Supabase → feedbacks table                     │
│  3. Trigger Python → http://localhost:8000/retrain        │
│  4. Return { success, message, data }                      │
└────────┬────────────────────────────────────────┬──────────┘
         │                                       │
         │ INSERT feedback                       │
         │                                       │ POST /retrain
         ↓                                       ↓
    ┌─────────────────┐              ┌──────────────────┐
    │ Supabase        │              │ Python ML        │
    │                 │              │                  │
    │ feedbacks table │              │ Model retraining │
    │                 │              │ & learning loop  │
    └─────────────────┘              └──────────────────┘
```

---

## 📦 Installation & Setup

### 1. Backend Setup (Already Done)

The endpoint is already implemented in `api-gateway/server.js`:

```javascript
// Line 1344-1417: POST /api/feedback handler
// Line 249-283: triggerPythonRetraining() helper function
```

**No installation needed** - just start the server:

```bash
cd api-gateway
node server.js
```

### 2. Frontend Integration

Copy the client library to your React project:

```bash
# Copy client library to your React src/
cp api-gateway/client-feedback.js src/services/client-feedback.js
```

Or import directly from API gateway:

```javascript
import { submitFeedback, useFeedback, FeedbackForm } from '../api-gateway/client-feedback';
```

### 3. Python Setup

Create an endpoint at `http://localhost:8000/retrain`:

```python
# example-python-retrain.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class FeedbackData(BaseModel):
    analysisId: str
    result: str
    timestamp: str

@app.post("/retrain")
async def retrain(feedback: FeedbackData):
    """
    Receives feedback and retrains ML model
    """
    print(f"Received feedback for {feedback.analysisId}: {feedback.result}")
    
    # Update your ML model here
    # model.add_training_sample(feedback)
    # model.retrain()
    
    return {
        "success": True,
        "message": "Model retraining scheduled",
        "trainedOn": [feedback.analysisId]
    }

# Run with: uvicorn example-python-retrain.py --host 0.0.0.0 --port 8000
```

---

## 🔌 Environment Configuration

### Backend (server.js)

**Python Retraining URL:**
```javascript
// Line 265 in server.js
axios.post('http://localhost:8000/retrain', payload, { ... })
```

To change the URL, edit line 265 or add to environment:

```bash
# .env
PYTHON_RETRAIN_URL=http://localhost:8000/retrain
PYTHON_API_KEY=your-api-key
```

Then update the code:

```javascript
const PYTHON_URL = process.env.PYTHON_RETRAIN_URL || 'http://localhost:8000/retrain';
const PYTHON_KEY = process.env.PYTHON_API_KEY || 'trinity-api-key';
```

### Frontend (.env)

```bash
# .env.local or .env
REACT_APP_API_URL=http://localhost:3001
```

Used by client library:

```javascript
// client-feedback.js (line 12)
const FEEDBACK_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
```

---

## 🎯 Usage Patterns

### Pattern 1: Simple Form Submission

```javascript
import { FeedbackForm } from './client-feedback';

export function ResultsPage() {
  return (
    <FeedbackForm
      analysisId={analysisId}
      onSuccess={() => alert('Feedback enviado!')}
      onError={(err) => alert('Erro: ' + err.message)}
    />
  );
}
```

### Pattern 2: Programmatic Submission

```javascript
import { submitFeedback } from './client-feedback';

async function handleCorrectPrediction(analysisId) {
  try {
    const result = await submitFeedback(analysisId, 'vitoria');
    console.log('Feedback ID:', result.data.feedbackId);
    // Update UI, refresh results, etc.
  } catch (error) {
    console.error('Failed:', error.message);
  }
}
```

### Pattern 3: React Hook Integration

```javascript
import { useFeedback } from './client-feedback';

function FeedbackButton({ analysisId }) {
  const { submitFeedback, loading, error, success } = useFeedback();

  const handleSubmit = async () => {
    try {
      await submitFeedback(analysisId, 'vitoria');
    } catch (err) {
      // Error already in state
    }
  };

  return (
    <div>
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Enviando...' : 'Marcar como Acerto'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>✅ Registrado!</p>}
    </div>
  );
}
```

### Pattern 4: Batch Submission

```javascript
import { submitBatchFeedback } from './client-feedback';

async function submitMultipleFeedbacks() {
  const feedbacks = [
    { analysisId: 'id1', result: 'vitoria' },
    { analysisId: 'id2', result: 'empate' },
    { analysisId: 'id3', result: 'derrota' },
  ];

  const result = await submitBatchFeedback(feedbacks);
  console.log(`Submitted: ${result.submitted}, Failed: ${result.failed}`);
}
```

---

## 🔗 Data Flow Example

### Complete Workflow

1. **User submits feedback in UI:**
```javascript
await submitFeedback('550e8400-...', 'vitoria');
```

2. **Frontend sends HTTP request:**
```
POST /api/feedback HTTP/1.1
Content-Type: application/json

{
  "analysisId": "550e8400-e29b-41d4-a716-446655440000",
  "result": "vitoria"
}
```

3. **Backend processes request:**
```javascript
// server.js line 1344-1417
- Validates analysisId and result
- Saves to Supabase feedbacks table
- Triggers Python retraining (async)
- Returns success response
```

4. **Supabase stores feedback:**
```sql
INSERT INTO feedbacks (analysis_id, resultado, criado_em)
VALUES ('550e8400-...', 'vitoria', NOW())
RETURNING id, analysis_id, resultado, criado_em
```

5. **Python receives feedback:**
```
POST /retrain
{
  "analysisId": "550e8400-...",
  "result": "vitoria",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

6. **Python processes feedback:**
```python
# Update model weights
# Retrain if needed
# Log training sample
# Return success
```

7. **Frontend receives confirmation:**
```json
{
  "success": true,
  "message": "Feedback enviado",
  "data": {
    "feedbackId": "a7f8c2e1-...",
    "analysisId": "550e8400-...",
    "result": "vitoria",
    "timestamp": "2024-01-15T10:30:45.123Z"
  }
}
```

---

## 📊 Database Schema

The feedback data is stored in Supabase:

```sql
-- Feedback table
CREATE TABLE feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES analises(id),
  resultado VARCHAR(50) NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_feedback_analysis ON feedbacks(analysis_id);
CREATE INDEX idx_feedback_created ON feedbacks(criado_em DESC);
```

**Fields:**
- `id` - Unique feedback identifier (UUID)
- `analysis_id` - Reference to the analysis being rated
- `resultado` - The feedback result (vitoria, empate, etc.)
- `criado_em` - Timestamp when feedback was submitted

---

## ✅ Verification Checklist

### Backend Integration

- [ ] Endpoint is in `api-gateway/server.js`
- [ ] `triggerPythonRetraining()` helper exists (line 249)
- [ ] Axios is imported for Python calls
- [ ] Supabase client is available
- [ ] Error handling is comprehensive
- [ ] Run `node test-feedback.js` - all tests pass
- [ ] Server starts without errors

### Frontend Integration

- [ ] `client-feedback.js` is imported
- [ ] Can call `submitFeedback(id, result)`
- [ ] Can use `useFeedback()` hook
- [ ] Can render `<FeedbackForm />` component
- [ ] All client functions available

### Database Integration

- [ ] Supabase `feedbacks` table exists
- [ ] Table has correct columns
- [ ] Foreign key to `analises.id` exists
- [ ] Indexes created for performance
- [ ] Can insert test data manually

### Python Integration

- [ ] Python server running at localhost:8000
- [ ] `/retrain` endpoint exists
- [ ] Accepts POST requests
- [ ] Receives feedback data correctly
- [ ] Processes and stores feedback
- [ ] Can be tested with curl/postman

---

## 🧪 Testing

### Unit Tests

Run the automated test suite:

```bash
node test-feedback.js
```

Expected output:
```
✅ PASS - Valid feedback submission
✅ PASS - Missing analysisId
✅ PASS - Missing result
✅ PASS - Invalid result value
✅ PASS - All valid results accepted
✅ PASS - Response has required fields
✅ PASS - Feedback data integrity
✅ PASS - Multiple rapid requests
```

### Manual Testing

**1. Using cURL:**
```bash
curl -X POST http://localhost:3001/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"analysisId": "550e8400-e29b-41d4-a716-446655440000", "result": "vitoria"}'
```

**2. Using Postman:**
- Method: POST
- URL: http://localhost:3001/api/feedback
- Body (JSON):
```json
{
  "analysisId": "550e8400-e29b-41d4-a716-446655440000",
  "result": "vitoria"
}
```

**3. From React:**
```javascript
import { submitFeedback } from './client-feedback';

await submitFeedback('550e8400-e29b-41d4-a716-446655440000', 'vitoria');
```

---

## 🚀 Deployment

### Local Development

```bash
# Terminal 1: Start API Gateway
cd api-gateway
node server.js

# Terminal 2: Start Python retraining
cd python
python -m uvicorn retrain:app --host 0.0.0.0 --port 8000

# Terminal 3: Start React frontend
cd src
npm start
```

### Production

1. **Backend (server.js):**
   - Set environment variables for database
   - Configure Python endpoint URL
   - Use proper error logging

2. **Frontend (React):**
   - Set REACT_APP_API_URL to production domain
   - Build: `npm run build`
   - Deploy to hosting

3. **Python:**
   - Run with proper WSGI server (Gunicorn/uWSGI)
   - Configure logging and monitoring
   - Set proper timeouts

4. **Database (Supabase):**
   - Ensure feedbacks table backed up
   - Monitor storage usage
   - Set up retention policies if needed

---

## 📝 Logging & Monitoring

The endpoint logs everything to console:

```javascript
// Success
console.log(`📝 Received feedback for analysis ${analysisId}: ${result}`);
console.log(`✅ Feedback saved with ID: ${feedback.id}`);

// Warnings
console.warn('⚠️  Python retraining failed (non-blocking):', err.message);

// Errors
console.error('❌ Failed to save feedback:', dbError);
console.error('❌ Feedback endpoint error:', err);
```

**Monitor these logs for:**
- Feedback submission success rate
- Python retraining failures
- Database connection issues
- Validation errors

---

## 🐛 Common Issues & Solutions

### Issue: "Failed to save feedback"
**Cause:** Supabase table doesn't exist or wrong column names  
**Solution:** Check feedbacks table schema, verify column names (analysis_id, resultado)

### Issue: "Python retraining failed"
**Cause:** Python server not running or wrong port  
**Solution:** Start Python at localhost:8000, check firewall rules

### Issue: "Invalid result value"
**Cause:** Using wrong result value  
**Solution:** Use one of: vitoria, empate, derrota, correto, incorreto, true, false

### Issue: CORS errors in browser
**Cause:** Cross-origin requests blocked  
**Solution:** Ensure API has CORS headers (enabled by default)

---

## 📚 Related Files

- [FEEDBACK_ENDPOINT.md](./FEEDBACK_ENDPOINT.md) - Complete API documentation
- [FEEDBACK_QUICK_REF.md](./FEEDBACK_QUICK_REF.md) - Quick reference
- [client-feedback.js](./client-feedback.js) - Client library source code
- [server.js](./server.js) - Backend implementation (lines 1344-1417)
- [test-feedback.js](./test-feedback.js) - Test suite

---

**Version:** 1.0  
**Last Updated:** 2024-01-15  
**Status:** Ready for Production

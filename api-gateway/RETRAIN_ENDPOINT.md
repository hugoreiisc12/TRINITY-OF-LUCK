# POST /api/retrain - Manual Model Retraining

## Overview

The `/api/retrain` endpoint triggers manual retraining of the machine learning models in the Python backend service. This is useful for updating models with new data, fixing model performance issues, or forcing a complete model rebuild.

**Endpoint:** `POST /api/retrain`
**Authentication:** Required (JWT Bearer Token)
**Rate Limit:** 1 request per minute per user
**Response Time:** Typically 30+ seconds (depends on model size)

---

## Request

### Headers
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### Body

```json
{
  "full_retrain": false,
  "model_type": "all"
}
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `full_retrain` | boolean | No | `false` | If `true`, rebuilds all models from scratch. If `false`, performs incremental update. |
| `model_type` | string | No | `"all"` | Which models to retrain: `"all"`, `"probability"`, `"factors"`, `"comparison"`. |

---

## Response

### Success (200)

```json
{
  "success": true,
  "message": "Retreinamento iniciado",
  "data": {
    "user_id": "uuid-12345",
    "retrain_type": "all",
    "full_retrain": false,
    "python_response": {
      "status": "processing",
      "job_id": "retrain-uuid-12345",
      "estimated_time": 120
    },
    "initiated_at": "2026-01-04T10:30:45.123Z"
  }
}
```

### Error: Python Service Not Available (503)

```json
{
  "success": false,
  "error": "Python service not available",
  "details": "ML training service is not accessible",
  "service_url": "http://localhost:8000"
}
```

### Error: Python Service Error (503)

```json
{
  "success": false,
  "error": "Python service error",
  "details": "Insufficient training data available",
  "status": 400
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
  "error": "Failed to initiate model retraining",
  "details": "Timeout waiting for Python service"
}
```

---

## Status Codes

| Status | Meaning | Scenario |
|--------|---------|----------|
| 200 | OK | Retraining successfully initiated |
| 401 | Unauthorized | Missing or invalid JWT token |
| 503 | Service Unavailable | Python service is not accessible or returned an error |
| 500 | Internal Server Error | Unexpected server error |

---

## Examples

### JavaScript/Node.js

```javascript
// Using fetch
const response = await fetch('http://localhost:3001/api/retrain', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    full_retrain: false,
    model_type: 'all',
  }),
});

const data = await response.json();
console.log(data);
// Output: { success: true, message: "Retreinamento iniciado", data: {...} }

// Using axios
import axios from 'axios';

const response = await axios.post('http://localhost:3001/api/retrain', {
  full_retrain: false,
  model_type: 'all',
}, {
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
  },
});

console.log(response.data);
```

### Python

```python
import requests
import json

# Get JWT token first (from login endpoint)
jwt_token = "your-jwt-token-here"

# Prepare headers
headers = {
    "Authorization": f"Bearer {jwt_token}",
    "Content-Type": "application/json"
}

# Prepare body
body = {
    "full_retrain": False,
    "model_type": "all"
}

# Make POST request
response = requests.post(
    "http://localhost:3001/api/retrain",
    headers=headers,
    json=body
)

# Check response
if response.status_code == 200:
    data = response.json()
    print(f"✅ {data['message']}")
    print(f"Job ID: {data['data']['python_response']['job_id']}")
else:
    print(f"❌ Error {response.status_code}: {response.json()['error']}")
```

### cURL

```bash
curl -X POST http://localhost:3001/api/retrain \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_retrain": false,
    "model_type": "all"
  }'
```

### React Component

```typescript
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function RetrainModels() {
  const [isLoading, setIsLoading] = useState(false);
  const [fullRetrain, setFullRetrain] = useState(false);
  const [modelType, setModelType] = useState('all');
  const { toast } = useToast();

  const handleRetrain = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('jwt_token');
      
      const response = await fetch('/api/retrain', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_retrain: fullRetrain,
          model_type: modelType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "✅ " + data.message,
          description: `Job ID: ${data.data.python_response.job_id}`,
        });
      } else {
        toast({
          title: "❌ " + data.error,
          description: data.details,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Retrain Models</h2>
      
      <label className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          checked={fullRetrain}
          onChange={(e) => setFullRetrain(e.target.checked)}
        />
        <span>Full Retrain (from scratch)</span>
      </label>

      <select
        value={modelType}
        onChange={(e) => setModelType(e.target.value)}
        className="mb-4 p-2 border rounded"
      >
        <option value="all">All Models</option>
        <option value="probability">Probability Model</option>
        <option value="factors">Factors Model</option>
        <option value="comparison">Comparison Model</option>
      </select>

      <button
        onClick={handleRetrain}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Retraining...' : 'Start Retrain'}
      </button>
    </div>
  );
}
```

---

## Database Integration

### User Tracking

The endpoint automatically records the retraining initiation in the `analises` table:

```sql
-- Logged activity (optional, can be added)
INSERT INTO analises (usuario_id, tipo, data_criacao)
VALUES (?, 'retrain_initiated', NOW());
```

### Audit Log (Recommended)

Create an audit log for all retraining events:

```sql
CREATE TABLE IF NOT EXISTS retrain_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  retrain_type VARCHAR(50),
  full_retrain BOOLEAN DEFAULT false,
  python_response JSONB,
  status VARCHAR(50) DEFAULT 'initiated',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT
);

INSERT INTO retrain_logs (usuario_id, retrain_type, full_retrain, python_response)
VALUES (?, ?, ?, ?);
```

---

## Python Service Integration

### Expected Python Endpoint

The endpoint expects a Python service at `http://localhost:8000/retrain`:

```python
# Flask example
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/retrain', methods=['POST'])
def retrain_models():
    data = request.json
    user_id = data.get('user_id')
    full_retrain = data.get('full_retrain', False)
    model_type = data.get('model_type', 'all')
    
    # Start background training job
    job_id = start_training_job(user_id, model_type, full_retrain)
    
    return jsonify({
        'status': 'processing',
        'job_id': job_id,
        'estimated_time': 120  # seconds
    })

def start_training_job(user_id, model_type, full_retrain):
    # Implementation details
    import uuid
    return f"retrain-{uuid.uuid4()}"
```

### Configuration

Set the Python service URL via environment variable:

```bash
# .env
PYTHON_SERVICE_URL=http://localhost:8000
```

---

## Error Handling

### Connection Refused
- **Cause:** Python service is not running
- **Solution:** Start the Python ML service: `python app.py`

### Service Timeout
- **Cause:** Model training is taking too long
- **Timeout:** 30 seconds
- **Solution:** Either wait longer or check Python service logs

### Insufficient Data
- **Cause:** Not enough training data available
- **Solution:** Run more analyses first before retraining

### Service Not Found (ENOTFOUND)
- **Cause:** Hostname resolution failed
- **Solution:** Check `PYTHON_SERVICE_URL` environment variable

---

## Performance

### Timing

| Type | Typical Time | Max Time |
|------|-------------|----------|
| Incremental Update | 30-60s | 120s |
| Full Retrain | 2-5 min | 10 min |
| Complete Rebuild | 5-15 min | 30 min |

### Resource Usage

- **CPU:** High during retraining
- **Memory:** 500MB - 2GB depending on dataset size
- **Disk:** Temporary files for model training

### Rate Limiting

- **Per User:** 1 request per minute
- **Per Server:** 10 concurrent retrain operations max
- **Recommended:** Schedule retrain during off-peak hours

---

## Best Practices

1. **Schedule Retraining**
   - Run during off-peak hours to avoid performance impact
   - Use background job system for better management

2. **Monitor Progress**
   - Store job_id from response for tracking
   - Implement status polling endpoint on Python service

3. **Fallback Strategy**
   - Keep previous model version as fallback
   - Validate new model performance before deployment

4. **Error Recovery**
   - Log all retrain failures for analysis
   - Alert administrators on critical failures

5. **User Feedback**
   - Show progress indicator to users
   - Display estimated completion time

---

## Troubleshooting

### Issue: "Python service not available"
```
Check:
1. Is Python service running? (ps aux | grep python)
2. Is it on the correct port? (netstat -an | grep 8000)
3. Check firewall rules
4. Check PYTHON_SERVICE_URL environment variable
```

### Issue: "Timeout waiting for Python service"
```
Check:
1. Is model training taking too long?
2. Check Python service logs for errors
3. Try with full_retrain=false first
4. Reduce model_type to specific model only
```

### Issue: "Insufficient training data"
```
Solution:
1. Run more analyses first
2. Wait for analysis pipeline to complete
3. Check data quality in database
```

---

## Related Endpoints

- `GET /api/history` - View past analyses and metrics
- `POST /api/upload` - Upload new data for training
- `GET /api/plans` - Check available analysis plans
- `POST /api/feedback` - Provide feedback on predictions

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-04 | Initial endpoint implementation |

---

## Support

For issues or questions:
- Check Python service logs: `tail -f python_service.log`
- Review server logs: `tail -f node_server.log`
- Contact: support@trinityofluck.com

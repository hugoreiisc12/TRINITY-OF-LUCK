# POST /api/retrain - Quick Reference

## One-Liner
```bash
curl -X POST http://localhost:3001/api/retrain \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"full_retrain": false, "model_type": "all"}'
```

## Success Response
```json
{
  "success": true,
  "message": "Retreinamento iniciado",
  "data": {
    "user_id": "user-uuid",
    "retrain_type": "all",
    "python_response": { "status": "processing", "job_id": "..." },
    "initiated_at": "2026-01-04T10:30:45.123Z"
  }
}
```

## Error Responses

| Error | Status | Cause |
|-------|--------|-------|
| "Python service not available" | 503 | Service not running at localhost:8000 |
| "Python service error" | 503 | Service returned error |
| "Unauthorized" | 401 | Missing/invalid JWT token |
| "Failed to initiate model retraining" | 500 | Unexpected server error |

## Quick Examples

### JavaScript
```javascript
const response = await fetch('http://localhost:3001/api/retrain', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ full_retrain: false, model_type: 'all' })
});
const data = await response.json();
console.log(data.message); // "Retreinamento iniciado"
```

### Python
```python
import requests
response = requests.post(
  'http://localhost:3001/api/retrain',
  headers={'Authorization': f'Bearer {token}'},
  json={'full_retrain': False, 'model_type': 'all'}
)
print(response.json()['message'])  # "Retreinamento iniciado"
```

### React
```typescript
const { data } = await axios.post('/api/retrain', 
  { full_retrain: false, model_type: 'all' },
  { headers: { 'Authorization': `Bearer ${token}` } }
);
toast(data.message);  // "Retreinamento iniciado"
```

## Request Parameters

```json
{
  "full_retrain": false,      // false = incremental, true = from scratch
  "model_type": "all"         // "all" | "probability" | "factors" | "comparison"
}
```

## Key Points

✅ Requires JWT authentication  
✅ Triggers background training job  
✅ Returns success message immediately (doesn't wait for training)  
✅ Use job_id to track progress  
✅ Recommended: Run 1x per minute maximum  
✅ Typical duration: 30-120 seconds

## Common Issues & Solutions

### "Python service not available"
```bash
# Check if Python service is running
lsof -i :8000                              # macOS/Linux
netstat -ano | findstr :8000               # Windows

# Start Python service
python app.py --port 8000
```

### "Timeout"
```
Solutions:
1. Try with full_retrain=false
2. Try with model_type="probability" (single model)
3. Check Python service logs
4. Increase timeout (default: 30s)
```

### "Unauthorized"
```
1. Verify JWT token is valid
2. Check Authorization header format: "Bearer TOKEN"
3. Log in again to get fresh token
```

## Default Configuration

| Setting | Value | Env Variable |
|---------|-------|---|
| Python Service URL | http://localhost:8000 | PYTHON_SERVICE_URL |
| Request Timeout | 30 seconds | REQUEST_TIMEOUT |
| Rate Limit | 1 per minute per user | RATE_LIMIT |

## Related Endpoints

- `GET /api/history` - View past analyses
- `POST /api/upload` - Upload training data
- `GET /api/plans` - View available plans

## Status Codes Reference

| Code | Meaning |
|------|---------|
| 200 | ✅ Retraining initiated successfully |
| 401 | ❌ Not authenticated (missing/invalid token) |
| 503 | ❌ Python service unavailable or error |
| 500 | ❌ Unexpected server error |

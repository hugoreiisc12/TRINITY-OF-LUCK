# POST /api/retrain - Quick Start

## 5-Minute Setup

### 1. Start the API Gateway (if not already running)
```bash
cd api-gateway
npm install
npm start
```

### 2. Start Python ML Service
```bash
python app.py --port 8000
```

### 3. Get a JWT Token
Log in to get a JWT token (from auth endpoint):
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

Save the token from response: `response.data.token`

### 4. Call the Retrain Endpoint
```bash
curl -X POST http://localhost:3001/api/retrain \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"full_retrain": false, "model_type": "all"}'
```

### 5. See the Response
```json
{
  "success": true,
  "message": "Retreinamento iniciado",
  "data": {
    "user_id": "uuid",
    "retrain_type": "all",
    "python_response": {
      "status": "processing",
      "job_id": "retrain-uuid"
    },
    "initiated_at": "2026-01-04T10:30:45.123Z"
  }
}
```

## Common Parameters

| Parameter | Values | Purpose |
|-----------|--------|---------|
| `full_retrain` | `false` (default) or `true` | `false` = incremental update, `true` = rebuild from scratch |
| `model_type` | `"all"`, `"probability"`, `"factors"`, `"comparison"` | Which models to retrain |

## JavaScript Example
```javascript
const token = 'your-jwt-token';

const response = await fetch('http://localhost:3001/api/retrain', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    full_retrain: false,
    model_type: 'all'
  })
});

const data = await response.json();
console.log(data.message); // "Retreinamento iniciado"
```

## Run Tests
```bash
node test-retrain.js
```

## Troubleshooting

### "Python service not available"
```bash
# Check if Python service is running
netstat -ano | findstr :8000

# Start it if not
python app.py --port 8000
```

### "Unauthorized"
```bash
# Get a fresh JWT token
curl -X POST http://localhost:3001/api/auth/login \
  -d '{"email": "test@example.com", "password": "password"}'
```

### More Help
- Full docs: [RETRAIN_ENDPOINT.md](RETRAIN_ENDPOINT.md)
- Quick ref: [RETRAIN_QUICK_REF.md](RETRAIN_QUICK_REF.md)
- Test suite: [test-retrain.js](test-retrain.js)

---

**Status:** ✅ Ready to use  
**API Gateway Port:** 3001  
**Python Service Port:** 8000

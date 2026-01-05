# API Gateway - Rotas Implementadas

## 📊 Status Geral

```
┌─────────────────────────────────────────────────────────────────┐
│ Trinity of Luck - API Gateway (Port 3001)                       │
│ ✅ Express Server                                               │
│ ✅ Supabase Integration                                         │
│ ✅ Stripe Payment Processing                                    │
│ ✅ JWT Authentication                                           │
│ ✅ Rate Limiting (100 req/min)                                  │
│ ✅ Multer File Upload                                           │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Endpoints Implementados

### Health Check (Public)
```
GET /health                    → Server health status
GET /api/health                → API health status
GET /api/test-supabase         → Database connection test
```

### 📤 File Upload & Context Import (Protected - JWT Required)
```
POST /api/upload               → Upload CSV/JSON files
POST /api/import-context       → Import from URL
```

### 🔐 Authentication (Protected - JWT Required)
```
GET  /api/auth/me              → Get current user profile
PUT  /api/auth/profile         → Update user profile
GET  /api/auth/subscriptions   → Get user subscriptions
GET  /api/auth/analyses        → Get user analyses
```

### 💳 Payment Processing (Protected - JWT Required)
```
POST /api/stripe/checkout      → Create Stripe checkout session
```

### 🔔 Webhooks (Public - No Auth)
```
POST /api/webhooks/stripe      → Stripe payment events
POST /api/webhooks/auth        → Supabase auth events
```

## 📈 Recent Features

### 1️⃣ File Upload (NEW - Jan 4, 2026)
**Endpoint:** `POST /api/upload`
- Accepts CSV and JSON files
- Max 5MB per file
- Automatic data cleaning (removes nulls)
- Stores in Supabase `contextos` table
- Returns processed data with metadata

**Response:**
```json
{
  "success": true,
  "message": "Uploaded",
  "data": {
    "id": "uuid",
    "filename": "data.csv",
    "format": "csv",
    "recordsProcessed": 100,
    "records": [...],
    "timestamp": "2026-01-04T10:30:00Z"
  }
}
```

### 2️⃣ URL Context Import
**Endpoint:** `POST /api/import-context`
- Fetch data from whitelisted domains
- HTTPS only validation
- HTML parsing with Cheerio
- Domain-specific processing:
  - Polymarket: Market data
  - ESPN: Sports events
  - Weather: Temperature/conditions
  - Generic: Paragraphs, headings, metadata
- Stores in Supabase `contextos` table

### 3️⃣ JWT Authentication
- Supabase JWT token validation
- `authenticateToken` middleware
- Optional auth with `optionalAuth`
- User ID extraction from token claims
- Rate limiting with IP-based throttling

### 4️⃣ Stripe Integration
- SDK initialization with STRIPE_SECRET_KEY
- Checkout session creation
- Webhook event handling
  - customer.subscription.created
  - customer.subscription.updated
  - customer.subscription.deleted
- Webhook signature verification

## 🛠️ Tech Stack

```
Frontend:        React 18 + Vite 5.4
Backend:         Express.js 4.18.2
Database:        Supabase PostgreSQL
Authentication:  Supabase JWT
Payments:        Stripe API
File Uploads:    Multer 10.4.0
CSV Parsing:     csv-parser 3.0.0
HTML Parsing:    Cheerio 1.0.0
HTTP Client:     Axios 1.6.2
Logging:         Morgan 1.10.0
Rate Limit:      express-rate-limit 7.1.5
Security:        Helmet 7.1.0
```

## 📚 Documentation Files

| File | Purpose | Lines |
|------|---------|-------|
| README.md | Quick start guide | 80 |
| AUTH_ENDPOINTS.md | Authentication & protected routes | 250 |
| STRIPE_JWT_SETUP.md | Setup & testing guide | 400+ |
| ARCHITECTURE.md | System design & diagrams | 300 |
| SETUP_CHECKLIST.md | Deployment guide | 250 |
| IMPLEMENTATION_SUMMARY.md | Features overview | 200 |
| COMPLETION_SUMMARY.md | Visual summary | 150 |
| START_HERE.txt | Quick reference | 50 |
| IMPORT_CONTEXT_ENDPOINT.md | URL import docs | 350+ |
| IMPORT_CONTEXT_QUICK_REF.md | Quick reference | 120 |
| UPLOAD_ENDPOINT.md | File upload docs | 350+ |
| UPLOAD_QUICK_REF.md | Quick reference | 120 |
| UPLOAD_IMPLEMENTATION.md | Implementation details | 400+ |

## 🧪 Testing Tools

| File | Type | Purpose |
|------|------|---------|
| client-protected-endpoints.js | JS Library | Frontend integration examples |
| client-upload.js | JS Library | 15 upload utility functions |
| test-upload.html | Web UI | Interactive upload tester |
| sample-data.csv | Data | Example CSV file |
| sample-data.json | Data | Example JSON file |

## 🚀 Getting Started

### 1. Start the Server
```bash
cd api-gateway
npm install
npm start
```

### 2. Test File Upload
```bash
# Get JWT token from your auth system
JWT_TOKEN="eyJ..."

# Upload CSV
curl -X POST http://localhost:3001/api/upload \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@sample-data.csv"

# Or use the web interface
# http://localhost:3001/api-gateway/test-upload.html
```

### 3. Test URL Import
```bash
curl -X POST http://localhost:3001/api/import-context \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://polymarket.com"}'
```

## 📊 Database Schema

**Tabela: contextos**
```sql
CREATE TABLE contextos (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT,
  tipo_origem TEXT,           -- 'upload', 'url', 'api'
  url TEXT,                   -- For URL imports
  dados_brutos JSONB,         -- Raw data/metadata
  dados_processados JSONB,    -- Cleaned records
  eventos JSONB[],            -- Extracted events
  variaveis JSONB,            -- Summary variables
  tags TEXT[],                -- ['csv', 'uploaded', ...]
  status TEXT,                -- 'ativo', 'inativo'
  criado_em TIMESTAMP,
  atualizado_em TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES usuarios(id)
);
```

## ⚙️ Configuration

### .env Variables
```
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=sk_test_...
CORS_ORIGIN=http://localhost:8080
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
PORT=3001
NODE_ENV=development
```

## 🔒 Security Features

✅ **CORS Protection** - Whitelist origins  
✅ **Helmet** - Security headers  
✅ **Rate Limiting** - 100 req/min per IP  
✅ **JWT Validation** - Supabase tokens  
✅ **File Validation** - Size & type checks  
✅ **HTTPS Enforcement** - For URL imports  
✅ **Domain Whitelist** - 9 approved domains  
✅ **Error Hiding** - No internal details in responses  

## 📈 Middleware Stack

```
1. Helmet           → Security headers
2. CORS             → Cross-origin requests
3. express.json     → Body parsing (10MB limit)
4. Morgan           → Request logging
5. Rate Limiter     → 100 req/min throttle
6. Routes           → All endpoints
7. 404 Handler      → Not found
8. Error Handler    → Exception catching
```

## 🎯 Next Steps

### Current Phase Completed ✅
- ✅ API Gateway infrastructure
- ✅ JWT authentication
- ✅ Stripe integration
- ✅ URL context import
- ✅ File upload endpoint

### Future Enhancements 📋
- [ ] WebSocket support for real-time updates
- [ ] GraphQL API gateway
- [ ] Redis caching layer
- [ ] Background job processing
- [ ] Data validation schemas
- [ ] Extended file format support (XLSX, XML)
- [ ] Bulk import operations
- [ ] Data transformation pipelines
- [ ] Analytics and metrics
- [ ] API versioning

## 📞 Support

### Documentation
- 📖 Full docs in `/api-gateway/*.md` files
- 🔗 Quick refs in `*_QUICK_REF.md` files
- 💻 Code examples in `client-*.js` files

### Testing
- 🧪 Web interface at `test-upload.html`
- 📊 Sample data in `sample-data.*` files
- 📝 cURL examples in documentation

### Troubleshooting
1. Check `.env` file configuration
2. Verify Supabase connection
3. Validate JWT token format
4. Check rate limiting status
5. Review error messages in logs

---

**Version:** 1.0.0  
**Status:** Production Ready ✅  
**Last Updated:** January 4, 2026  
**Port:** 3001  
**Rate Limit:** 100 req/min  
**Auth:** JWT Required (except webhooks)

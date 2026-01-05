# API Gateway - Environment Configuration Guide

## Overview
The GET /api/platforms endpoint requires proper Supabase configuration to connect to the database.

## Required Environment Variables

### Supabase Configuration
```env
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Optional Environment Variables
```env
PORT=3001
NODE_ENV=development
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
CORS_ORIGIN=http://localhost:8080
JWT_SECRET=your-jwt-secret-key
```

## Setup Instructions

### 1. Get Supabase Credentials
1. Go to https://supabase.com
2. Create a new project or use existing one
3. Go to Settings → API
4. Copy:
   - **Project URL** → SUPABASE_URL
   - **anon public key** → SUPABASE_ANON_KEY
   - **service_role key** → SUPABASE_SERVICE_ROLE_KEY

### 2. Create/Update .env File
```bash
# In api-gateway folder
cp .env.example .env

# Edit .env and add your credentials:
nano .env
# or
code .env
```

### 3. Database Schema
The endpoint expects the following table structure:
```sql
CREATE TABLE plataformas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  nicho VARCHAR(100) NOT NULL,
  url VARCHAR(500),
  descricao TEXT,
  suportado BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_plataformas_nome ON plataformas(nome);
CREATE INDEX idx_plataformas_nicho ON plataformas(nicho);
CREATE INDEX idx_plataformas_suportado ON plataformas(suportado);
```

### 4. Insert Sample Data
```sql
INSERT INTO plataformas (nome, nicho, url, descricao, suportado) VALUES
('Polymarket', 'sports', 'https://polymarket.com', 'Prediction market for sports', true),
('ESPN', 'sports', 'https://espn.com', 'Sports news and odds', true),
('Binance', 'crypto', 'https://binance.com', 'Cryptocurrency exchange', true),
('Kraken', 'crypto', 'https://kraken.com', 'Crypto trading platform', true),
('Riot Games', 'esports', 'https://www.riotgames.com', 'Esports betting', true);
```

### 5. Restart API Gateway
```bash
# Stop current process
# Ctrl+C or killall node

# Start fresh
node server.js
```

## Testing the Endpoint

### After Configuration

#### Test 1: Get All Platforms
```bash
curl http://localhost:3001/api/platforms
```

Expected Response:
```json
{
  "success": true,
  "message": "Platforms retrieved successfully",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nome": "Polymarket",
      "nicho": "sports",
      "url": "https://polymarket.com",
      "descricao": "Prediction market for sports",
      "suportado": true,
      "criado_em": "2025-01-01T10:00:00.000Z",
      "atualizado_em": "2025-01-04T10:00:00.000Z"
    }
  ],
  "count": 5,
  "filters": {
    "niche": null
  }
}
```

#### Test 2: Filter by Niche
```bash
curl "http://localhost:3001/api/platforms?niche=sports"
```

Expected Response:
```json
{
  "success": true,
  "message": "Platforms retrieved successfully",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nome": "Polymarket",
      "nicho": "sports",
      "url": "https://polymarket.com",
      "descricao": "Prediction market for sports",
      "suportado": true,
      "criado_em": "2025-01-01T10:00:00.000Z",
      "atualizado_em": "2025-01-04T10:00:00.000Z"
    }
  ],
  "count": 1,
  "filters": {
    "niche": "sports"
  }
}
```

#### Test 3: Invalid Niche
```bash
curl "http://localhost:3001/api/platforms?niche=invalid"
```

Expected Response:
```json
{
  "success": true,
  "message": "No platforms found for niche: invalid",
  "data": [],
  "count": 0,
  "filters": {
    "niche": "invalid"
  }
}
```

## Troubleshooting

### Error: "SUPABASE_URL and SUPABASE_ANON_KEY must be defined in .env"

**Cause:** Environment variables not set

**Solution:**
1. Check if `.env` file exists in `api-gateway` folder
2. Verify it contains `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. Restart the server after updating `.env`

### Error: "Failed to fetch platforms" with "TypeError: fetch failed"

**Cause:** Invalid or missing Supabase URL

**Solution:**
1. Check `SUPABASE_URL` format: `https://xxxxx.supabase.co` (no trailing slash)
2. Verify URL is accessible: `curl https://xxxxx.supabase.co/rest/v1/` should not timeout
3. Check internet connection
4. Check Supabase project is active

### Error: "Database query error"

**Cause:** `plataformas` table doesn't exist or wrong schema

**Solution:**
1. Check table exists in Supabase SQL editor
2. Verify table name is lowercase: `plataformas`
3. Verify columns match schema above
4. Run SQL schema creation script in Supabase console

## Client Library Usage

Once configured, you can use the client library:

```javascript
import {
  getPlatforms,
  getPlatformsByNiche,
  getUniqueNiches,
  usePlatforms
} from './client-platforms.js';

// Get all platforms
const response = await getPlatforms();
console.log(response.data);

// Filter by niche
const sports = await getPlatformsByNiche('sports');
console.log(`Found ${sports.count} sports platforms`);

// Get all niches
const niches = getUniqueNiches(response.data);
console.log(niches); // ['crypto', 'esports', 'sports']

// Use in React
function PlatformList() {
  const { platforms, loading } = usePlatforms('sports');
  return loading ? 'Loading...' : <ul>{platforms.map(p => <li>{p.nome}</li>)}</ul>;
}
```

## Production Checklist

- [ ] Supabase credentials set in environment
- [ ] .env file is NOT committed to git (add to .gitignore)
- [ ] Plataformas table created with proper schema
- [ ] Sample data inserted
- [ ] Endpoint tested and working
- [ ] Rate limiting enabled
- [ ] CORS configured for your domain
- [ ] Monitoring/logging set up
- [ ] Database backups enabled in Supabase

## Next Steps

1. **Configure Supabase credentials in .env**
2. **Create plataformas table with schema**
3. **Insert sample data**
4. **Restart API Gateway**
5. **Test endpoint with curl**
6. **Integrate client library into React frontend**

---

**Status:** 🔴 Awaiting Supabase Configuration  
**Endpoint:** GET /api/platforms  
**Documentation:** PLATFORMS_ENDPOINT.md, PLATFORMS_QUICK_REF.md  
**Client Library:** client-platforms.js

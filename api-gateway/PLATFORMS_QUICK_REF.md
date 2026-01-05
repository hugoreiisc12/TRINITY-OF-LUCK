# GET /api/platforms - Quick Reference

## Quick Start

### Get All Platforms
```bash
curl http://localhost:3001/api/platforms
```

### Get Specific Niche
```bash
curl "http://localhost:3001/api/platforms?niche=sports"
```

## Response Format
```json
{
  "success": true,
  "message": "Platforms retrieved successfully",
  "data": [{...}, {...}],
  "count": 2,
  "filters": {"niche": null},
  "timestamp": "2026-01-04T10:30:00.000Z"
}
```

## Usage Examples

### JavaScript - Basic
```javascript
const response = await fetch('/api/platforms');
const data = await response.json();
console.log(data.data); // array of platforms
```

### JavaScript - By Niche
```javascript
const niche = 'sports';
const response = await fetch(`/api/platforms?niche=${niche}`);
const data = await response.json();
console.log(`Found ${data.count} ${niche} platforms`);
```

### React Hook
```javascript
import { usePlatforms } from './client-platforms.js';

function App() {
  const { platforms, loading, error } = usePlatforms('sports');
  
  return loading ? 'Loading...' : (
    <ul>
      {platforms.map(p => <li key={p.id}>{p.nome}</li>)}
    </ul>
  );
}
```

### Client Library Functions
```javascript
import {
  getPlatforms,              // Get all platforms
  getPlatformsByNiche,       // Filter by niche
  findPlatformByName,        // Find by name
  getUniqueNiches,           // Get all niches
  countPlatformsByNiche,     // Count by niche
  filterPlatforms            // Multi-criteria filter
} from './client-platforms.js';

// Get all
const all = await getPlatforms();

// By niche
const sports = await getPlatformsByNiche('sports');

// By name
const poly = findPlatformByName('Polymarket', all.data);

// Get all niches
const niches = getUniqueNiches(all.data);

// Count by niche
const counts = countPlatformsByNiche(all.data);

// Advanced filter
const filtered = filterPlatforms(all.data, {
  niche: 'crypto',
  suportado: true
});
```

## Platform Object
```javascript
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  nome: "Polymarket",
  nicho: "sports",
  url: "https://polymarket.com",
  descricao: "Prediction market for sports",
  suportado: true,
  criado_em: "2025-01-01T10:00:00.000Z",
  atualizado_em: "2025-01-04T10:00:00.000Z"
}
```

## Available Niches
- `sports` - Sports betting
- `crypto` - Cryptocurrency
- `esports` - Esports betting
- `politics` - Political markets
- `entertainment` - Celebrity markets
- `weather` - Weather prediction
- `finance` - Stock markets

## Testing
```bash
# All platforms
curl http://localhost:3001/api/platforms

# Sports platforms
curl "http://localhost:3001/api/platforms?niche=sports"

# Crypto platforms
curl "http://localhost:3001/api/platforms?niche=crypto"

# Count platforms
curl http://localhost:3001/api/platforms | jq '.count'

# List all niches
curl http://localhost:3001/api/platforms | jq -r '.data[].nicho' | sort -u
```

## Status
✅ Live on `http://localhost:3001`  
✅ Production ready  
✅ Rate limited: 100 req/min  
✅ No authentication required  
✅ Supports niche filtering  

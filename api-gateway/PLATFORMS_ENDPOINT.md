# GET /api/platforms - Platforms Endpoint

## Overview
Retrieve a list of supported platforms from the database. Supports optional filtering by niche.

## Authentication
❌ **Not required** - Public endpoint

## Request

### Endpoint
```
GET /api/platforms
GET /api/platforms?niche=sports
```

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `niche` | string | No | Filter by platform niche (e.g., 'sports', 'crypto', 'esports') |

## Response

### Success (200)
All platforms without filter:
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
      "descricao": "Prediction market for sports and events",
      "suportado": true,
      "criado_em": "2025-01-01T10:00:00.000Z",
      "atualizado_em": "2025-01-04T10:00:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "nome": "ESPN",
      "nicho": "sports",
      "url": "https://espn.com",
      "descricao": "Sports news and betting odds",
      "suportado": true,
      "criado_em": "2025-01-01T10:00:00.000Z",
      "atualizado_em": "2025-01-04T10:00:00.000Z"
    }
  ],
  "count": 2,
  "filters": {
    "niche": null
  },
  "timestamp": "2026-01-04T10:30:00.000Z"
}
```

With niche filter:
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
  },
  "timestamp": "2026-01-04T10:30:00.000Z"
}
```

### No Results (200)
```json
{
  "success": true,
  "message": "No platforms found for niche: crypto",
  "data": [],
  "count": 0,
  "filters": {
    "niche": "crypto"
  }
}
```

### Error (500)
```json
{
  "success": false,
  "error": "Failed to fetch platforms",
  "details": "Database connection error"
}
```

## Features

✅ **No Authentication Required** - Public API  
✅ **Optional Filtering** - Filter by niche  
✅ **Caching Ready** - Can be cached by CDN  
✅ **Rate Limited** - Global rate limit applies (100 req/min)  
✅ **Error Handling** - Detailed error messages  
✅ **Timestamp** - Response includes server timestamp  

## Data Structure

Each platform object contains:
```javascript
{
  id: string,              // UUID of the platform
  nome: string,            // Platform name
  nicho: string,           // Platform niche/category
  url: string,             // Official website URL
  descricao: string,       // Platform description
  suportado: boolean,      // Whether platform is supported
  criado_em: string,       // ISO timestamp of creation
  atualizado_em: string    // ISO timestamp of last update
}
```

## Testing

### Using cURL

Get all platforms:
```bash
curl http://localhost:3001/api/platforms
```

Get platforms by niche:
```bash
curl "http://localhost:3001/api/platforms?niche=sports"
curl "http://localhost:3001/api/platforms?niche=crypto"
curl "http://localhost:3001/api/platforms?niche=esports"
```

### Using JavaScript/Fetch

```javascript
// Get all platforms
async function getAllPlatforms() {
  const response = await fetch('/api/platforms');
  const data = await response.json();
  console.log(data.data); // Array of platforms
  return data;
}

// Get platforms by niche
async function getPlatformsByNiche(niche) {
  const response = await fetch(`/api/platforms?niche=${niche}`);
  const data = await response.json();
  console.log(`Found ${data.count} platforms in ${niche}`);
  return data;
}

// Usage
const allPlatforms = await getAllPlatforms();
const sportsPlatforms = await getPlatformsByNiche('sports');
```

### Using Client Library

```javascript
import { 
  getPlatforms, 
  getPlatformsByNiche,
  getUniqueNiches,
  countPlatformsByNiche 
} from './client-platforms.js';

// Get all platforms
const allData = await getPlatforms();
console.log(allData.data);

// Get by niche
const sportsData = await getPlatformsByNiche('sports');
console.log(sportsData.count); // 2

// Get available niches
const platforms = allData.data;
const niches = getUniqueNiches(platforms);
console.log(niches); // ['crypto', 'esports', 'sports']

// Count by niche
const counts = countPlatformsByNiche(platforms);
console.log(counts); // { sports: 2, crypto: 1, esports: 1 }
```

## Common Queries

### Get all unique niches
```bash
curl http://localhost:3001/api/platforms | jq '.data[].nicho' | sort -u
```

### Count platforms by niche
```bash
curl http://localhost:3001/api/platforms | jq '.data | group_by(.nicho) | map({niche: .[0].nicho, count: length})'
```

### Find specific platform
```bash
curl "http://localhost:3001/api/platforms" | jq '.data[] | select(.nome == "Polymarket")'
```

## Available Niches

Common platform niches:
- `sports` - Sports betting and prediction markets
- `crypto` - Cryptocurrency exchanges and DeFi
- `esports` - Esports betting and analytics
- `politics` - Political prediction markets
- `entertainment` - Entertainment/celebrity markets
- `weather` - Weather prediction markets
- `finance` - Stock and financial markets

## Rate Limiting

- **Global Limit:** 100 requests/minute per IP
- **Per User:** No per-user limit (public endpoint)
- **No Auth Required:** Can be used without JWT

## Caching Strategy

This endpoint is ideal for caching:
- Response does not change frequently
- Multiple clients request same data
- Can be cached for 1-24 hours

HTTP Cache Headers:
```
Cache-Control: public, max-age=3600
```

## Integration Examples

### React Component
```javascript
import { usePlatforms } from './client-platforms.js';

function PlatformList({ niche = null }) {
  const { platforms, loading, error } = usePlatforms(niche);

  if (loading) return <div>Loading platforms...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>{niche ? `${niche} Platforms` : 'All Platforms'}</h2>
      <ul>
        {platforms.map(p => (
          <li key={p.id}>
            <a href={p.url}>{p.nome}</a> - {p.descricao}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Form Select/Dropdown
```javascript
async function populatePlatformsDropdown(selectElement, niche = null) {
  const data = niche
    ? await getPlatformsByNiche(niche)
    : await getPlatforms();

  selectElement.innerHTML = data.data.map(p => 
    `<option value="${p.id}">${p.nome}</option>`
  ).join('');
}
```

### Filter Platforms
```javascript
import { filterPlatforms } from './client-platforms.js';

// Get all platforms first
const allData = await getPlatforms();
const platforms = allData.data;

// Filter by multiple criteria
const filtered = filterPlatforms(platforms, {
  niche: 'sports',
  suportado: true,
  nome: 'poly' // partial match
});
```

## Performance Notes

- Response includes all platform records
- For large lists, consider pagination in future
- Filtering done server-side for better performance
- No heavy computations on client side

## Future Enhancements

- [ ] Pagination support for large result sets
- [ ] Sort by name/creation date
- [ ] Search by name (substring match)
- [ ] Include analytics (usage stats)
- [ ] Platform status/health check
- [ ] Response caching headers
- [ ] GraphQL endpoint

---

**Last Updated:** January 4, 2026  
**Status:** Production Ready  
**Rate Limited:** Yes (100 req/min)  
**Authentication:** Not Required  
**Response Format:** JSON

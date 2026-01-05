# POST /api/import-context - Quick Reference

## Overview
Import context data from external HTTPS URLs with automatic processing and storage.

## Quick Start

```bash
# Get JWT token
JWT_TOKEN="eyJ..."

# Import from Polymarket
curl -X POST http://localhost:3001/api/import-context \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://polymarket.com/markets"}'

# Import from ESPN
curl -X POST http://localhost:3001/api/import-context \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"url": "https://www.espn.com/nfl/schedule"}'

# Import from Weather
curl -X POST http://localhost:3001/api/import-context \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"url": "https://weather.com"}'
```

## URL Validation

✅ **Must be HTTPS** (not HTTP)  
✅ **Must be from allowed domain:**
- polymarket.com
- espn.com, sports.espn.go.com
- weather.com
- news.ycombinator.com
- reddit.com
- twitter.com, x.com
- wikipedia.org

❌ **Rejected:**
- HTTP URLs → 400 error
- Disallowed domains → 403 error
- Invalid URLs → 400 error

## Response

**Success (200):**
```json
{
  "success": true,
  "message": "Context imported successfully",
  "context": {
    "id": "uuid",
    "url": "https://polymarket.com/markets",
    "title": "Polymarket",
    "events": [...],
    "variables": {...},
    "eventCount": 5
  }
}
```

**Error (403 - Domain Not Allowed):**
```json
{
  "success": false,
  "error": "Domain not allowed",
  "allowedDomains": [...]
}
```

## Features

✅ **Domain Validation** - Whitelist of trusted domains  
✅ **HTTPS Enforcement** - Secure URLs only  
✅ **HTML Parsing** - Uses Cheerio for scraping  
✅ **Smart Extraction** - Different parsing for each domain  
✅ **Events & Variables** - Structured data output  
✅ **Database Storage** - Saved to `contextos` table  
✅ **User Association** - Links to authenticated user  
✅ **Error Handling** - Detailed error messages  

## Domain-Specific Parsing

### Polymarket
- Extracts market information
- Counts markets
- Variables: source, pageTitle, marketCount

### ESPN
- Extracts sports events
- Detects sport type
- Variables: source, sport, eventCount

### Weather
- Extracts temperature & conditions
- Page analysis
- Variables: source, extractedElements

### Other Domains
- Extracts paragraphs and headings
- Gets metadata (title, description, og:image)
- Variables: source, pageTitle, description

## Frontend Integration

```javascript
// Import function
async function importContext(url) {
  const response = await fetch('/api/import-context', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url })
  });
  return response.json();
}

// Usage
const context = await importContext('https://polymarket.com/markets');
console.log('Imported events:', context.context.events);
console.log('Variables:', context.context.variables);
```

## Error Codes

| Code | Error | Solution |
|------|-------|----------|
| 400 | Missing URL | Add `url` parameter |
| 400 | Invalid URL format | Check URL syntax |
| 400 | Invalid protocol | Use HTTPS, not HTTP |
| 403 | Domain not allowed | Use allowed domain |
| 400 | Failed to fetch | Check URL is accessible |
| 401 | No token | Add Authorization header |
| 500 | Database error | Check Supabase connection |

## Use Cases

1. **Market Research** - Import prediction market data
2. **Sports Analysis** - Import sports schedules
3. **Weather Integration** - Import weather data
4. **News Aggregation** - Import news articles
5. **Data Collection** - Gather external data for analysis

## Technical Details

- **Timeout:** 10 seconds per request
- **Rate Limited:** 100 requests/min per IP
- **Storage:** JSONB columns in Supabase
- **User Scoped:** Data associated with authenticated user
- **Async:** Non-blocking imports

## Complete Documentation

See [IMPORT_CONTEXT_ENDPOINT.md](./IMPORT_CONTEXT_ENDPOINT.md) for comprehensive documentation including:
- Detailed validation rules
- Complete response schemas
- Domain-specific parsing details
- Testing procedures
- Security considerations
- Future enhancements

## JavaScript Client

Use the included functions in `client-protected-endpoints.js`:

```javascript
import {
  importContext,
  importPolymarketContext,
  importESPNContext,
  importWeatherContext,
  importCustomContext
} from './client-protected-endpoints.js';

// Import specific sources
await importPolymarketContext();
await importESPNContext();
await importWeatherContext();

// Import custom URL (with validation)
await importCustomContext('https://polymarket.com/markets');
```

---

**Last Updated:** January 4, 2026  
**Status:** Production Ready  
**Authentication:** Required (JWT)

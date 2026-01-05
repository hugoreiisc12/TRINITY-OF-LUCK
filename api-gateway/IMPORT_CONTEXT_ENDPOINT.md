# Import Context Endpoint - Documentation

## Overview

The `POST /api/import-context` endpoint allows authenticated users to import context data from external URLs. The endpoint validates the URL, fetches the content, processes it to extract events and variables, and stores the processed data in the Supabase `contextos` table.

---

## Endpoint Details

**URL:** `POST /api/import-context`  
**Authentication:** Required (JWT Token)  
**Rate Limited:** Yes (100 requests/min per IP)  
**Content-Type:** `application/json`

---

## Request

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Body
```json
{
  "url": "https://polymarket.com/markets"
}
```

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | HTTPS URL from allowed domains |

---

## Validation Rules

### 1. URL Format
- Must be a valid URL string
- Must use HTTPS protocol (not HTTP)
- Must be from an allowed domain

### 2. Allowed Domains
```
- polymarket.com
- espn.com
- sports.espn.go.com
- weather.com
- news.ycombinator.com
- reddit.com
- twitter.com
- x.com
- wikipedia.org
```

### 3. Request Timeout
- Maximum 10 seconds to fetch content
- Returns error if timeout exceeded

---

## Response

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Context imported successfully",
  "context": {
    "id": "uuid-context-id",
    "url": "https://polymarket.com/markets",
    "title": "Polymarket - Prediction Markets",
    "events": [
      {
        "name": "Event 1 Title",
        "source": "polymarket",
        "timestamp": "2024-01-04T12:00:00Z"
      },
      {
        "name": "Event 2 Title",
        "source": "polymarket",
        "timestamp": "2024-01-04T12:00:00Z"
      }
    ],
    "variables": {
      "source": "polymarket",
      "pageTitle": "Polymarket",
      "marketCount": 2
    },
    "eventCount": 2,
    "sourceHostname": "polymarket.com",
    "timestamp": "2024-01-04T12:00:00Z"
  }
}
```

### Error Responses

**400 - Missing/Invalid URL**
```json
{
  "success": false,
  "error": "Missing or invalid URL parameter"
}
```

**400 - Invalid URL Format**
```json
{
  "success": false,
  "error": "Invalid URL format",
  "details": "URL must be a valid, properly formatted URL"
}
```

**400 - Invalid Protocol**
```json
{
  "success": false,
  "error": "Invalid protocol",
  "details": "Only HTTPS URLs are allowed"
}
```

**403 - Domain Not Allowed**
```json
{
  "success": false,
  "error": "Domain not allowed",
  "details": "This domain is not in the allowed list. Allowed domains: ...",
  "allowedDomains": ["polymarket.com", "espn.com", ...]
}
```

**400 - Failed to Fetch URL**
```json
{
  "success": false,
  "error": "Failed to fetch URL content",
  "details": "Connection timeout"
}
```

**401 - Unauthorized**
```json
{
  "success": false,
  "error": "No authorization token provided"
}
```

**500 - Database Error**
```json
{
  "success": false,
  "error": "Failed to store context in database",
  "details": "Error message from Supabase"
}
```

---

## Data Processing

### Domain-Specific Parsing

#### Polymarket
Extracts market information:
- Market titles
- Market data
- Count of markets

```json
{
  "events": [
    {"name": "Event Title", "source": "polymarket", "timestamp": "..."}
  ],
  "variables": {
    "source": "polymarket",
    "pageTitle": "...",
    "marketCount": 5
  }
}
```

#### ESPN
Extracts sports events:
- Game scores
- Event information
- Sport type

```json
{
  "events": [
    {"name": "Game/Event Info", "source": "espn", "timestamp": "..."}
  ],
  "variables": {
    "source": "espn",
    "pageTitle": "...",
    "sport": "football",
    "eventCount": 3
  }
}
```

#### Weather
Extracts weather data:
- Temperature
- Conditions
- Page information

```json
{
  "events": [
    {"name": "Weather Data", "data": "...", "source": "weather", "timestamp": "..."}
  ],
  "variables": {
    "source": "weather",
    "pageTitle": "..."
  }
}
```

#### Generic Parsing (Other Domains)
For allowed domains not specifically handled:
- Extracts paragraphs and headings
- Gets page metadata (title, description, og:image)
- Counts HTML elements

---

## Database Schema

### Stored in `contextos` table:

```json
{
  "id": "uuid",
  "user_id": "uuid-user-id",
  "plataforma_id": null,
  "url": "https://polymarket.com/markets",
  "titulo": "Page Title",
  "dados_entrada": {
    "url": "https://polymarket.com/markets",
    "hostname": "polymarket.com",
    "description": "Page description",
    "fetchedAt": "2024-01-04T12:00:00Z"
  },
  "eventos": [...],
  "variáveis": {...},
  "created_at": "2024-01-04T12:00:00Z",
  "updated_at": "2024-01-04T12:00:00Z"
}
```

---

## Testing

### Using cURL

```bash
# Get JWT token first
JWT_TOKEN="eyJ..."

# Import from Polymarket
curl -X POST http://localhost:3001/api/import-context \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://polymarket.com/markets"}'

# Import from ESPN
curl -X POST http://localhost:3001/api/import-context \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.espn.com/nfl"}'

# Import from Weather
curl -X POST http://localhost:3001/api/import-context \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://weather.com"}'
```

### Test Cases

**Valid Request:**
```bash
curl -X POST http://localhost:3001/api/import-context \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://polymarket.com/markets"}'
# Expected: 200 OK with context data
```

**Invalid Protocol (HTTP):**
```bash
curl -X POST http://localhost:3001/api/import-context \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "http://polymarket.com/markets"}'
# Expected: 400 - Only HTTPS URLs are allowed
```

**Disallowed Domain:**
```bash
curl -X POST http://localhost:3001/api/import-context \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
# Expected: 403 - Domain not allowed
```

**Missing URL:**
```bash
curl -X POST http://localhost:3001/api/import-context \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 400 - Missing or invalid URL parameter
```

**No Authentication:**
```bash
curl -X POST http://localhost:3001/api/import-context \
  -H "Content-Type: application/json" \
  -d '{"url": "https://polymarket.com/markets"}'
# Expected: 401 - No authorization token provided
```

---

## Use Cases

### 1. Import Market Data
User imports prediction market data from Polymarket to analyze trends:
```bash
POST /api/import-context
{"url": "https://polymarket.com/markets"}
```

### 2. Import Sports Events
User imports ESPN sports schedule for analysis:
```bash
POST /api/import-context
{"url": "https://www.espn.com/nfl/schedule"}
```

### 3. Import Weather Data
User imports weather information for context:
```bash
POST /api/import-context
{"url": "https://weather.com"}
```

### 4. Import News or Information
User imports news or article data:
```bash
POST /api/import-context
{"url": "https://news.ycombinator.com"}
```

---

## Implementation Details

### Technologies Used
- **Axios** - HTTP client for fetching URLs
- **Cheerio** - HTML parser for scraping (similar to jQuery)
- **Supabase** - Database for storing contexts

### Process Flow
```
1. Receive URL in request
   ↓
2. Validate URL format and HTTPS protocol
   ↓
3. Check domain is in allowed list
   ↓
4. Fetch HTML content via Axios (10s timeout)
   ↓
5. Parse HTML using Cheerio
   ↓
6. Extract data based on domain type
   ↓
7. Create events and variables objects
   ↓
8. Store in Supabase 'contextos' table
   ↓
9. Return processed data to user
```

### Error Handling
- Invalid URL format → 400 error
- Non-HTTPS protocol → 400 error
- Disallowed domain → 403 error
- Network timeout → 400 error
- Database error → 500 error
- Missing authentication → 401 error

---

## Security Considerations

✅ **HTTPS Only** - Rejects HTTP URLs to ensure secure communication  
✅ **Domain Whitelist** - Only allows trusted domains  
✅ **Timeout Protection** - 10-second limit prevents hanging requests  
✅ **User Association** - Data associated with authenticated user  
✅ **Input Validation** - URL format and protocol verified  
✅ **Rate Limiting** - Endpoint subject to 100 req/min rate limit  

---

## Performance Notes

- **Timeout:** 10 seconds for fetching remote content
- **Parsing:** Fast with Cheerio (in-memory parsing)
- **Storage:** Efficient JSONB columns in Supabase
- **Scalability:** Each import creates one record per user

---

## Future Enhancements

- [ ] Add caching for frequently accessed URLs
- [ ] Support additional domains
- [ ] Custom domain whitelist per user
- [ ] Scheduled/periodic imports
- [ ] Data transformation pipelines
- [ ] Import history and versioning
- [ ] Background job processing for large imports
- [ ] Webhook support for import events

---

**Last Updated:** January 4, 2026  
**Version:** 1.0.0  
**Status:** Production Ready

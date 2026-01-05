# Security Middleware Implementation - Phase 12

## Overview

Comprehensive security middleware added to the API Gateway to protect against common web attacks and ensure data integrity.

**Date:** January 4, 2026  
**Status:** PRODUCTION READY ✅

---

## Security Features Implemented

### 1. Input Validation (Express-Validator)
- **Email Validation:** Validates email format, normalizes, and escapes
- **Password Validation:** Enforces minimum 8 characters, uppercase, lowercase, numbers
- **UUID Validation:** Validates UUID format for ID parameters
- **URL Validation:** Validates HTTP/HTTPS URLs with proper format
- **String Validation:** Length constraints (1-500 chars by default)
- **Number Validation:** Integer range validation
- **Date Range Validation:** ISO 8601 dates with range checking

### 2. Input Sanitization
- **NoSQL Injection Prevention:** Uses `mongo-sanitize` to remove $ and . characters
- **XSS Attack Prevention:** Uses `xss-clean` to strip HTML/script tags
- **Parameter Escaping:** All string parameters escaped using express-validator
- **Email Normalization:** Lowercase and trim email inputs

### 3. Rate Limiting
- **Global Rate Limiter:** 100 requests/minute per IP address
- **Auth Rate Limiter:** 5 attempts/15 minutes (login endpoint)
- **Configurable via Environment:** `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`
- **Proxy Support:** Uses X-Forwarded-For header when behind proxy
- **Skip Successful Requests:** Auth limiter only counts failed attempts

### 4. CORS (Cross-Origin Resource Sharing)
- **Whitelist Origins:** Configurable CORS origins via `CORS_ORIGIN` env var
- **Credentials Support:** Allows credentials in cross-origin requests
- **Methods:** GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Headers:** Content-Type, Authorization, X-API-Key
- **Cache:** 24-hour preflight cache

### 5. Security Headers (Helmet)
- **Content-Security-Policy:** Prevents XSS, clickjacking
- **X-Frame-Options:** Prevents clickjacking (DENY)
- **X-Content-Type-Options:** Prevents MIME type sniffing (nosniff)
- **Strict-Transport-Security:** Enforces HTTPS (1 year)
- **Referrer-Policy:** Limits referrer information
- **Permissions-Policy:** Controls browser features

### 6. Parameter Pollution Prevention
- **Detection:** Checks for duplicate parameters in query and body
- **Prevention:** Rejects requests with parameter pollution
- **Security:** Prevents parameter override attacks

### 7. Enhanced Token Authentication
- **Token Format Validation:** Checks token length and type
- **User Validation:** Verifies user ID and email exist
- **Input Sanitization:** Trims and normalizes user data
- **Error Messages:** Different messages for development/production

---

## Implementation Details

### Code Added to server.js

**Line 1-18:** Added imports:
```javascript
import { body, param, query, validationResult } from 'express-validator';
import mongoSanitize from 'mongo-sanitize';
import xss from 'xss-clean';
```

**Line 47-91:** Enhanced security middleware:
```javascript
// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS attacks
app.use(xss());

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({...})),
    });
  }
  next();
};

// Parameter pollution prevention
const preventParameterPollution = (req, res, next) => {
  // Check for duplicate parameters
};
```

**Line 374-470:** Enhanced authenticateToken middleware:
```javascript
const authenticateToken = async (req, res, next) => {
  // Token format validation
  // User object validation
  // Input sanitization (trim, lowercase)
  // Better error handling
};
```

**Line 472-534:** Reusable validators:
```javascript
const validateEmail = body('email')
  .trim()
  .isEmail()
  .normalizeEmail()
  .escape();

const validatePassword = body('password')
  .trim()
  .isLength({ min: 8 })
  .matches(/[A-Z]/)
  .matches(/[a-z]/)
  .matches(/[0-9]/);

// ... more validators ...
```

---

## Usage Examples

### Example 1: Login Endpoint with Validation

```javascript
app.post('/api/auth/login', 
  authLimiter,
  [
    validateEmail,
    validatePassword,
    handleValidationErrors,
  ],
  async (req, res) => {
    // Handler code
  }
);
```

### Example 2: Get Analysis by ID

```javascript
app.get('/api/results/:id',
  authenticateToken,
  [
    validateUUID,
    handleValidationErrors,
  ],
  async (req, res) => {
    const { id } = req.params;
    // Handler code
  }
);
```

### Example 3: Update Settings with Multiple Validations

```javascript
app.put('/api/settings',
  authenticateToken,
  [
    validateString('preferredNiche', 1, 50),
    validateNumber('theme', 0, 5),
    validateUrl.optional(),
    handleValidationErrors,
  ],
  async (req, res) => {
    // Handler code
  }
);
```

### Example 4: Date Range Filter

```javascript
app.get('/api/history',
  authenticateToken,
  [
    ...validateDateRange('data_inicio', 'data_fim'),
    handleValidationErrors,
  ],
  async (req, res) => {
    // Handler code with validated dates
  }
);
```

---

## Validator Reference

### Available Validators

```javascript
// Email validation
validateEmail
  // Usage: body('email')
  // Checks: Valid format, normalizes, escapes

// Password validation
validatePassword
  // Usage: body('password')
  // Checks: Min 8 chars, uppercase, lowercase, number

// UUID validation
validateUUID
  // Usage: param('id')
  // Checks: Valid UUID v4 format

// URL validation
validateUrl
  // Usage: body('url')
  // Checks: Valid HTTP/HTTPS URL

// String with length
validateString(field, minLength, maxLength)
  // Usage: validateString('name', 1, 100)
  // Checks: Length constraints

// Number with range
validateNumber(field, min, max)
  // Usage: validateNumber('age', 0, 120)
  // Checks: Integer within range

// Date range
validateDateRange(startField, endField)
  // Usage: validateDateRange('start_date', 'end_date')
  // Checks: ISO8601 format and range
```

---

## Security Best Practices

### 1. Always Validate Input
```javascript
app.post('/api/endpoint',
  [
    body('field1').trim().escape().notEmpty(),
    body('field2').isEmail().normalizeEmail(),
    handleValidationErrors,
  ],
  handler
);
```

### 2. Sanitize Before Storage
```javascript
// Already done by mongo-sanitize and xss-clean
// But also escape in validators:
body('input').escape().withMessage('...')
```

### 3. Use Rate Limiting on Auth
```javascript
app.post('/api/auth/login', authLimiter, handler);
app.post('/api/auth/register', authLimiter, handler);
```

### 4. Require Authentication for Protected Routes
```javascript
app.get('/api/protected', authenticateToken, handler);
```

### 5. Validate UUIDs in URL Parameters
```javascript
app.get('/api/resource/:id',
  param('id').isUUID().escape(),
  handler
);
```

---

## Environment Variables

```bash
# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:8080,https://example.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000          # 1 minute window
RATE_LIMIT_MAX_REQUESTS=100         # 100 requests per window

# Node Environment
NODE_ENV=production|development
```

---

## Middleware Stack Order

The middleware is applied in this secure order:

```
1. helmet()                          # Security headers
2. mongoSanitize()                   # NoSQL injection prevention
3. xss()                             # XSS prevention
4. preventParameterPollution()       # Parameter pollution check
5. cors(corsOptions)                 # CORS setup
6. express.json()                    # Body parser
7. morgan()                          # Logging
8. globalLimiter()                   # Rate limiting
9. Route handlers (with validators)  # Validation middleware
```

---

## Rate Limiting Details

### Global Limiter
- **Window:** 1 minute (configurable)
- **Max Requests:** 100 per window
- **Applies to:** All `/api/` routes
- **Headers:** Sends RateLimit-* headers
- **Status Code:** 429 Too Many Requests

### Auth Limiter
- **Window:** 15 minutes
- **Max Attempts:** 5
- **Skip:** Successful requests don't count
- **Use Case:** POST /api/auth/login, POST /api/auth/register

### Custom Example
```javascript
const customLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,  // 30 minutes
  max: 10,                     // 10 requests
  skipSuccessfulRequests: true,
});

app.post('/api/expensive-operation', customLimiter, handler);
```

---

## CORS Configuration

### Default Origins (Development)
```
http://localhost:8080
http://127.0.0.1:8080
```

### Production Configuration
```bash
# .env file
CORS_ORIGIN=https://example.com,https://app.example.com
```

### Enable CORS for All Origins (NOT RECOMMENDED)
```bash
CORS_ORIGIN=*
```

---

## Validation Error Response

When validation fails, response format:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email address",
      "value": "invalid-email"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters",
      "value": "short"
    }
  ]
}
```

---

## Attack Prevention

### 1. NoSQL Injection
```javascript
// Example attack (prevented):
// { "$ne": null }
// Removed by mongo-sanitize
```

### 2. XSS (Cross-Site Scripting)
```javascript
// Example attack (prevented):
// <script>alert('XSS')</script>
// Stripped by xss-clean
```

### 3. Parameter Pollution
```javascript
// Example attack (prevented):
// GET /api/endpoint?id=1&id=2&id=3
// Rejected by preventParameterPollution
```

### 4. Brute Force
```javascript
// Example attack (prevented):
// 100 login attempts in 1 minute
// Blocked by authLimiter (5 per 15 min)
```

### 5. CORS Attacks
```javascript
// Example attack (prevented):
// Request from unauthorized origin
// Blocked by CORS whitelist
```

---

## Testing Security

### Test Rate Limiting
```bash
# Should fail after 5 attempts
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -d '{"email":"test@example.com","password":"wrong"}'
done
```

### Test Input Validation
```bash
# Should fail (invalid email)
curl -X POST http://localhost:3001/api/auth/login \
  -d '{"email":"not-an-email","password":"Password123"}'
```

### Test XSS Prevention
```bash
# Should be sanitized
curl -X POST http://localhost:3001/api/feedback \
  -d '{"comment":"<script>alert(1)</script>"}'
```

### Test NoSQL Injection
```bash
# Should be sanitized
curl -X POST http://localhost:3001/api/search \
  -d '{"query":{"$ne":null}}'
```

---

## Logging & Monitoring

All security events are logged:

```javascript
// Rate limit exceeded
console.log('Rate limit exceeded for IP: X.X.X.X');

// Validation error
console.log('Validation error on POST /api/login');

// Invalid token
console.log('Invalid token for user: uuid-123');

// Parameter pollution detected
console.log('Parameter pollution detected');
```

---

## Troubleshooting

### Issue: "CORS policy: No 'Access-Control-Allow-Origin' header"
**Solution:**
1. Check `CORS_ORIGIN` env variable
2. Ensure origin matches exactly (case-sensitive)
3. Verify request includes proper headers

### Issue: "Rate limit exceeded"
**Solution:**
1. Check request frequency
2. Use different IP (proxy vs direct)
3. Wait for window to pass (check Retry-After header)

### Issue: "Validation failed"
**Solution:**
1. Check error details in response
2. Validate field format (email, UUID, etc.)
3. Check field length/range constraints

### Issue: "Invalid token"
**Solution:**
1. Verify token is not expired
2. Check Authorization header format: "Bearer TOKEN"
3. Get fresh token from login endpoint

---

## Security Checklist

- [x] Input validation on all endpoints
- [x] NoSQL injection prevention
- [x] XSS attack prevention
- [x] CORS properly configured
- [x] Rate limiting on auth endpoints
- [x] Security headers (Helmet)
- [x] Parameter pollution prevention
- [x] Token validation
- [x] Error message sanitization
- [x] Proxy support for rate limiting

---

## Related Documentation

- Express-Validator: https://express-validator.github.io/
- Helmet: https://helmetjs.github.io/
- Rate Limit: https://github.com/nfriedly/express-rate-limit
- OWASP Top 10: https://owasp.org/www-project-top-ten/

---

## Next Security Enhancements

1. **API Key Authentication** - For service-to-service calls
2. **IP Whitelisting** - Restrict access by IP
3. **Request Signing** - Sign requests with HMAC
4. **Security Audit Logging** - Detailed security events
5. **WAF Integration** - Web Application Firewall
6. **Two-Factor Authentication** - 2FA for critical operations
7. **API Versioning** - Manage API versions securely
8. **Database Encryption** - Encrypt sensitive fields

---

**Status:** PRODUCTION READY ✅  
**Phase:** 12 - Security Middleware  
**Implementation Date:** January 4, 2026

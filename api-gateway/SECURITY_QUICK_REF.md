# Security Quick Reference Guide

*A one-page quick reference for implementing security in your API endpoints.*

---

## 1️⃣ PROTECT A ROUTE

```javascript
app.get('/api/protected', authenticateToken, handler);
```

---

## 2️⃣ VALIDATE EMAIL

```javascript
import { body, validationResult } from 'express-validator';

app.post('/api/endpoint',
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors });
    next();
  },
  handler
);
```

**Quick:** `validateEmail` (pre-built)

---

## 3️⃣ VALIDATE PASSWORD

```javascript
body('password')
  .trim()
  .isLength({ min: 8 })
  .matches(/[A-Z]/, 'Password must contain uppercase')
  .matches(/[a-z]/, 'Password must contain lowercase')
  .matches(/[0-9]/, 'Password must contain number')
```

**Quick:** `validatePassword` (pre-built)

---

## 4️⃣ VALIDATE UUID (ID Parameter)

```javascript
app.get('/api/results/:id',
  param('id').isUUID().escape(),
  handleValidationErrors,
  handler
);
```

**Quick:** `validateUUID` (pre-built)

---

## 5️⃣ VALIDATE URL

```javascript
body('website_url')
  .trim()
  .isURL()
  .escape()
  .withMessage('Invalid URL format')
```

**Quick:** `validateUrl` (pre-built)

---

## 6️⃣ VALIDATE STRING WITH LENGTH

```javascript
body('name')
  .trim()
  .isLength({ min: 1, max: 100 })
  .escape()

// Or use helper:
validateString('name', 1, 100)
```

---

## 7️⃣ VALIDATE NUMBER WITH RANGE

```javascript
body('age')
  .isInt({ min: 0, max: 120 })
  .toInt()

// Or use helper:
validateNumber('age', 0, 120)
```

---

## 8️⃣ VALIDATE DATE RANGE

```javascript
body('start_date')
  .isISO8601()
  .toDate(),
body('end_date')
  .isISO8601()
  .toDate()
  .custom((value, { req }) => {
    if (value < req.body.start_date) {
      throw new Error('End date must be after start date');
    }
  })

// Or use helper:
validateDateRange('start_date', 'end_date')
```

---

## 🔒 RATE LIMIT AUTH ENDPOINTS

```javascript
app.post('/api/auth/login', authLimiter, handler);
app.post('/api/auth/register', authLimiter, handler);
```

---

## 📝 COMPLETE ENDPOINT EXAMPLE

```javascript
app.post('/api/feedback',
  authenticateToken,           // Auth check
  authLimiter,                 // Rate limit
  [
    validateString('comment', 1, 500),
    validateNumber('rating', 1, 5),
    handleValidationErrors,
  ],
  async (req, res) => {
    const { comment, rating } = req.body;
    const userId = req.user.id;
    
    // Handler code here
    res.json({ success: true, data: {} });
  }
);
```

---

## ⚠️ VALIDATION ERROR RESPONSE

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email address",
      "value": "not-an-email"
    }
  ]
}
```

---

## 🛡️ AUTOMATIC PROTECTION

These run on ALL requests (no code needed):

| Protection | Blocks |
|-----------|--------|
| `mongoSanitize()` | NoSQL injection: `{$ne: null}` |
| `xss()` | XSS: `<script>alert(1)</script>` |
| `helmet()` | Clickjacking, MIME sniffing |
| `cors()` | Unauthorized cross-origin |
| `globalLimiter` | >100 req/min per IP |

---

## 🎯 COMMON PATTERNS

### Admin Only Route
```javascript
app.delete('/api/users/:id',
  authenticateToken,
  [param('id').isUUID(), handleValidationErrors],
  async (req, res) => {
    if (req.user.role !== 'admin') 
      return res.status(403).json({ error: 'Forbidden' });
    // Delete code
  }
);
```

### Search with Query Validation
```javascript
app.get('/api/search',
  authenticateToken,
  query('q')
    .trim()
    .isLength({ min: 1, max: 100 })
    .escape(),
  handleValidationErrors,
  handler
);
```

### Update with Optional Fields
```javascript
app.put('/api/settings',
  authenticateToken,
  [
    body('email').if(body('email').exists()).isEmail(),
    body('phone').if(body('phone').exists()).isMobilePhone(),
    handleValidationErrors,
  ],
  handler
);
```

---

## 📊 VALIDATOR CHEAT SHEET

| Method | Example | Purpose |
|--------|---------|---------|
| `.trim()` | `body('x').trim()` | Remove whitespace |
| `.escape()` | `.escape()` | Escape HTML chars |
| `.isEmail()` | `.isEmail()` | Validate email |
| `.isLength({min,max})` | `.isLength({min:1,max:50})` | String length |
| `.isInt()` | `.isInt()` | Integer check |
| `.isUUID()` | `.isUUID()` | UUID format |
| `.isURL()` | `.isURL()` | URL format |
| `.isISO8601()` | `.isISO8601()` | Date format |
| `.matches(regex)` | `.matches(/[A-Z]/)` | Pattern match |
| `.normalizeEmail()` | `.normalizeEmail()` | Normalize email |
| `.toInt()` | `.toInt()` | Convert to int |
| `.toDate()` | `.toDate()` | Convert to date |
| `.custom(fn)` | `.custom(fn)` | Custom validation |
| `.optional()` | `.optional()` | Optional field |
| `.if(condition)` | `.if(body('x').exists())` | Conditional validation |

---

## 🚀 QUICK START

### Step 1: Import validators
```javascript
import { validateEmail, validatePassword, handleValidationErrors } from './server.js';
```

### Step 2: Add to route
```javascript
app.post('/api/endpoint',
  [validateEmail, validatePassword, handleValidationErrors],
  handler
);
```

### Step 3: Test
```bash
curl -X POST http://localhost:3001/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'
```

---

## 🐛 TROUBLESHOOTING

### 400 Bad Request - "Validation failed"
✅ Check error details in response  
✅ Verify field format and length  
✅ Ensure all required fields present

### 401 Unauthorized - "Invalid token"
✅ Add `Authorization: Bearer TOKEN` header  
✅ Verify token not expired  
✅ Get fresh token from login

### 429 Too Many Requests
✅ Wait ~1 minute  
✅ Check Retry-After header  
✅ Reduce request frequency

### 403 Forbidden - CORS error
✅ Check `CORS_ORIGIN` env variable  
✅ Verify origin matches exactly  
✅ Test with curl if browser CORS fails

---

## 📦 ALL PRE-BUILT VALIDATORS

```javascript
// Import from server.js:
import {
  validateEmail,
  validatePassword,
  validateUUID,
  validateUrl,
  validateString,
  validateNumber,
  validateDateRange,
  handleValidationErrors,
} from './server.js';
```

---

## 🔐 SECURITY CHECKLIST

- [ ] Route requires `authenticateToken` if user-specific
- [ ] All inputs have validation rules
- [ ] Email inputs use `validateEmail`
- [ ] Passwords use `validatePassword`
- [ ] IDs in URL use `validateUUID`
- [ ] URLs use `validateUrl`
- [ ] Strings have length limits
- [ ] Numbers have range limits
- [ ] Dates use ISO8601 format
- [ ] Auth endpoints use `authLimiter`

---

## 📚 More Info

See `SECURITY_MIDDLEWARE.md` for detailed documentation.

---

**Last Updated:** January 4, 2026  
**Version:** 1.0  
**Status:** PRODUCTION READY ✅

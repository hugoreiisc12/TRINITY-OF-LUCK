# 🚀 Logging System - Quick Reference Guide

**Last Updated:** January 4, 2026 | **Version:** 1.0.0

---

## ⚡ Quick Start

### Import Logger
```javascript
import { logger, monitor } from './logging.js';
```

### Log Information
```javascript
logger.log('info', 'User action', { userId: 123 });
```

### Log Error
```javascript
logger.logError(error, { url: '/api/endpoint', userId: 456 });
```

### Log Security Event
```javascript
logger.logSecurityEvent('failed_login', { ip: '192.168.1.1' });
```

### Get Metrics
```javascript
const metrics = logger.getMetrics();
```

---

## 📊 Logger Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `log(level, message, data)` | General logging | `logger.log('info', 'msg', {})` |
| `logRequest(req, res, time)` | HTTP requests | Auto-called by middleware |
| `logError(error, context)` | Error tracking | `logger.logError(err, {})` |
| `logSecurityEvent(event, details)` | Security logging | `logger.logSecurityEvent('attack', {})` |
| `getMetrics()` | Get metrics | `logger.getMetrics()` |
| `createMorganTokens()` | Morgan tokens | Static method, auto-used |

---

## 🎯 Log Levels

```
DEBUG    - Detailed development information
INFO     - General informational messages
WARN     - Warning messages for potential issues
ERROR    - Error conditions
CRITICAL - Critical system failures
```

---

## 🔍 Morgan Tokens

```
:responseTime     - Response time in milliseconds
:userId           - Authenticated user ID
:body             - Request body preview
:userAgent        - Client user agent
:ipAddress        - Client IP address
```

Example format:
```
:ipAddress ":method :url HTTP/:http-version" :status :responseTime ms
```

---

## 📁 Log Files

```
logs/
├── all.log       # Complete log history
├── info.log      # Information messages
├── error.log     # Errors and warnings
├── security.log  # Security events
└── request.log   # HTTP requests
```

---

## 🌐 API Endpoints

### Health Status
```
GET /api/monitoring/health
Headers: Authorization: Bearer {admin-token}
```

### Metrics
```
GET /api/monitoring/metrics
Headers: Authorization: Bearer {admin-token}
```

### Logs Query
```
GET /api/monitoring/logs?limit=100&severity=error
Headers: Authorization: Bearer {admin-token}
```

### Test Alert
```
POST /api/monitoring/test-alert
Body: { "type": "email", "message": "Test" }
Headers: Authorization: Bearer {admin-token}
```

---

## 💾 What Gets Stored in Supabase

- ✅ Errors (status >= 500)
- ✅ Security events
- ✅ Critical alerts
- ✅ Failed authentications
- ✅ System warnings

---

## 🧪 Testing

```bash
node test-logging.js
```

Expected: **18+ tests passing ✅**

---

## 🛠️ Common Tasks

### View Recent Errors
```bash
tail -f logs/error.log
```

### Check Health
```bash
curl -H "Authorization: Bearer token" http://localhost:3001/api/monitoring/health
```

### Get Metrics
```bash
curl -H "Authorization: Bearer token" http://localhost:3001/api/monitoring/metrics
```

### Query Logs by Severity
```bash
curl -H "Authorization: Bearer token" "http://localhost:3001/api/monitoring/logs?severity=error"
```

### Search Log Files
```bash
grep "error_message" logs/error.log
```

---

## 🔗 File Locations

- **Module:** `api-gateway/logging.js`
- **Server:** `api-gateway/server.js`
- **Tests:** `api-gateway/test-logging.js`
- **Logs:** `api-gateway/logs/`
- **Docs:** `LOGGING_SYSTEM.md`, `LOGGING_DELIVERY.md`

---

## 📈 Metrics Available

```javascript
{
  requests: 1250,           // Total requests
  errors: 15,               // Error count
  avgResponseTime: 45,      // Average response (ms)
  errorRate: 1.2,          // Error percentage
  uptime: 12345,           // Uptime (seconds)
  lastError: timestamp     // Last error time
}
```

---

## 🚨 Alert Types

```
- console  : Console output
- email    : Email notification
- slack    : Slack webhook
```

---

## 🔐 Security

- ✅ Admin-only endpoints
- ✅ Token validation
- ✅ Sensitive data filtering
- ✅ Rate limiting ready
- ✅ Audit trails

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| No logs | Check `logs/` directory permissions |
| 403 errors | Verify admin token and role |
| No Supabase logs | Check database connection |
| High memory | Archive/rotate old logs |

---

## 📚 Documentation

- **Full Docs:** [LOGGING_SYSTEM.md](LOGGING_SYSTEM.md)
- **Delivery Report:** [LOGGING_DELIVERY.md](LOGGING_DELIVERY.md)
- **Test Suite:** [test-logging.js](test-logging.js)

---

## ✨ Quick Examples

### Log a user action
```javascript
logger.log('info', 'User registered', { 
  userId: user.id, 
  email: user.email 
});
```

### Log an error with context
```javascript
logger.logError(new Error('Database failed'), {
  operation: 'insertUser',
  userId: 123
});
```

### Log suspicious activity
```javascript
logger.logSecurityEvent('multiple_failed_attempts', {
  ip: req.ip,
  attempts: 5,
  userId: user.id
});
```

### Get current health
```javascript
const health = monitor.checkHealth();
console.log(health);
```

---

## 🎯 Status

✅ Production Ready  
✅ All Tests Passing  
✅ Documentation Complete  
✅ Security Verified  

---

*For detailed information, see LOGGING_SYSTEM.md*

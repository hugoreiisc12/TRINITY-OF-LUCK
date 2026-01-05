# PUT /api/settings - User Settings Update Endpoint

> Update user account settings (theme, language, notifications, profile, privacy)

## 🚀 Quick Start

### Simple Update
```javascript
const response = await fetch('/api/settings', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tema: 'escuro',
    idioma: 'pt-BR'
  })
});

const data = await response.json();
console.log(data.message); // "Configurações atualizadas"
```

## 📋 Endpoint Details

| Property | Value |
|----------|-------|
| **Method** | PUT |
| **Route** | `/api/settings` |
| **Authentication** | Required (JWT Bearer) |
| **Content-Type** | application/json |
| **Response** | JSON with success flag and data |

## 📝 Request Body (All Optional)

```json
{
  "perfil": "experiente",              // User profile type
  "notificacoes": false,                // General notifications
  "privacidade": "publico",             // Privacy level
  "idioma": "pt-BR",                    // Preferred language  
  "tema": "escuro",                     // UI theme
  "notificacoes_email": false,          // Email notifications
  "notificacoes_push": true             // Push notifications
}
```

**Requirements:**
- At least one field must be provided
- Fields not included are not updated
- Timestamp is automatically managed

## ✅ Success Response (200)

```json
{
  "success": true,
  "message": "Configurações atualizadas",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "perfil": "experiente",
    "notificacoes": false,
    "privacidade": "publico",
    "idioma": "pt-BR",
    "tema": "escuro",
    "notificacoes_email": false,
    "notificacoes_push": true,
    "updated_at": "2026-01-04T10:30:00.000Z"
  }
}
```

## ❌ Error Responses

### 400 - No Settings Provided
```json
{
  "success": false,
  "error": "No settings provided to update"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### 404 - User Not Found
```json
{
  "success": false,
  "error": "User not found"
}
```

### 500 - Server Error
```json
{
  "success": false,
  "error": "Failed to update settings",
  "details": "..."
}
```

## 🧪 Testing

### Run Node.js Test Suite
```bash
# Set your token and run tests
TEST_TOKEN="your_jwt_token" node test-settings.js

# Expected output:
# ✅ Test 1: Update single setting (theme) - PASS
# ✅ Test 2: Update multiple settings - PASS
# ... (10 tests total)
# 📊 Results: 10/10 tests passed
```

### Run cURL Tests
```bash
# Single setting
curl -X PUT http://localhost:3001/api/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tema":"escuro"}'

# Multiple settings
curl -X PUT http://localhost:3001/api/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tema":"claro","idioma":"en-US"}'
```

## 💻 Code Examples

### JavaScript/React
```javascript
import { useState } from 'react';

export function UserSettings({ token }) {
  const [tema, setTema] = useState('claro');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tema })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Settings saved!');
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <select value={tema} onChange={e => setTema(e.target.value)}>
        <option value="claro">Light</option>
        <option value="escuro">Dark</option>
      </select>
      
      <button onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </button>
      
      {message && <p>{message}</p>}
    </div>
  );
}
```

### Python
```python
import requests

def update_settings(settings, token):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    response = requests.put(
        'http://localhost:3001/api/settings',
        json=settings,
        headers=headers
    )
    
    return response.json()

# Usage
result = update_settings({'tema': 'escuro'}, user_token)
if result['success']:
    print(result['message'])
```

### Node.js
```javascript
const axios = require('axios');

async function updateSettings(settings, token) {
  try {
    const response = await axios.put(
      'http://localhost:3001/api/settings',
      settings,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
}

// Usage
const result = await updateSettings({ tema: 'escuro' }, token);
console.log(result.message); // "Configurações atualizadas"
```

## 🔐 Security

- **Authentication:** JWT Bearer token required
- **Authorization:** Users can only update their own settings
- **Validation:** At least one field required
- **Logging:** All updates logged for audit trail
- **Escaping:** Supabase client handles SQL injection prevention

## 📊 Database Impact

**Table:** `usuarios`

**Updated Fields:**
- `perfil` - User profile/experience level
- `notificacoes` - General notifications flag
- `privacidade` - Privacy setting
- `idioma` - Preferred language
- `tema` - UI theme preference
- `notificacoes_email` - Email notifications flag
- `notificacoes_push` - Push notifications flag
- `updated_at` - Auto-updated timestamp

## 🔗 Related Endpoints

- `GET /api/auth/me` - Get current user with settings
- `PUT /api/auth/profile` - Update user profile/name
- `GET /api/subscription` - Get subscription info

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **SETTINGS_ENDPOINT.md** | Complete API specification (400+ lines) |
| **SETTINGS_QUICK_REF.md** | One-page quick reference |
| **SETTINGS_DELIVERY.md** | Implementation and integration guide |
| **test-settings.js** | Node.js test suite (10 tests) |
| **test-settings.sh** | Bash test script with cURL |
| **SETTINGS_COMPLETE.md** | Status and completion summary |

## ✨ Features

- ✅ Update any subset of settings
- ✅ Automatic timestamp management
- ✅ Comprehensive error handling
- ✅ JWT authentication required
- ✅ Full request validation
- ✅ Detailed response with updated data
- ✅ Console logging for debugging
- ✅ Production-ready code

## 🐛 Troubleshooting

**"Unauthorized" (401)**
- Ensure token is valid
- Check Bearer format: `Bearer {token}`

**"No settings provided" (400)**
- Send at least one setting field
- Empty object `{}` will be rejected

**"User not found" (404)**
- Verify user exists in database
- Check that token matches user ID

## 📞 Support

See **SETTINGS_ENDPOINT.md** for:
- Complete API reference
- Detailed troubleshooting
- React component example
- Performance characteristics
- Testing procedures

---

**Status:** ✅ Production Ready  
**Last Updated:** January 4, 2026  
**Version:** 1.0.0

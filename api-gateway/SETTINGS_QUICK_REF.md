# PUT /api/settings - Guia Rápido

**Status:** ✅ Implementado  
**Data:** 4 de janeiro de 2026

---

## ⚡ Uso Rápido

### Requisição Básica

```bash
curl -X PUT http://localhost:3001/api/settings \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tema": "escuro",
    "idioma": "pt-BR"
  }'
```

### Resposta de Sucesso

```json
{
  "success": true,
  "message": "Configurações atualizadas",
  "data": {
    "id": "uuid...",
    "email": "user@example.com",
    "tema": "escuro",
    "idioma": "pt-BR",
    "updated_at": "2026-01-04T14:22:31Z"
  }
}
```

---

## 📋 Campos Disponíveis

| Campo | Tipo | Exemplo |
|-------|------|---------|
| `perfil` | string | "iniciante" \| "experiente" |
| `notificacoes` | boolean | true \| false |
| `privacidade` | string | "privado" \| "publico" |
| `idioma` | string | "pt-BR" \| "en-US" |
| `tema` | string | "claro" \| "escuro" |
| `notificacoes_email` | boolean | true \| false |
| `notificacoes_push` | boolean | true \| false |

**Nota:** Todos os campos são opcionais. Envie apenas os que quer atualizar.

---

## 💻 Exemplos por Linguagem

### JavaScript (Fetch)

```javascript
const updateSettings = async (settings) => {
  const response = await fetch('/api/settings', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });

  return response.json();
};

// Uso
updateSettings({ tema: 'escuro' });
```

### Python (Requests)

```python
import requests

response = requests.put(
  'http://localhost:3001/api/settings',
  headers={'Authorization': f'Bearer {token}'},
  json={'tema': 'escuro'}
)

print(response.json())
```

### Node.js (Axios)

```javascript
const axios = require('axios');

axios.put('/api/settings', 
  { tema: 'escuro' },
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

### React

```jsx
const [settings, setSettings] = useState({});

const save = async () => {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });
  
  const data = await res.json();
  console.log(data.message); // "Configurações atualizadas"
};
```

---

## 🔑 Códigos de Resposta

| Código | Significado |
|--------|-----------|
| 200 | ✅ Sucesso |
| 400 | ❌ Nenhum campo fornecido |
| 401 | ❌ Token inválido/ausente |
| 404 | ❌ Usuário não encontrado |
| 500 | ❌ Erro do servidor |

---

## 📝 Casos de Uso Comuns

### Atualizar Tema
```javascript
fetch('/api/settings', {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ tema: 'escuro' })
});
```

### Desabilitar Notificações
```javascript
fetch('/api/settings', {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ 
    notificacoes: false,
    notificacoes_email: false,
    notificacoes_push: false 
  })
});
```

### Mudar Idioma e Privacidade
```javascript
fetch('/api/settings', {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ 
    idioma: 'en-US',
    privacidade: 'publico' 
  })
});
```

### Atualizar Perfil
```javascript
fetch('/api/settings', {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ perfil: 'experiente' })
});
```

---

## ⚠️ Erros Comuns

### Erro: "No settings provided to update"
```javascript
// ❌ Errado - corpo vazio
fetch('/api/settings', { 
  method: 'PUT',
  body: JSON.stringify({}) 
});

// ✅ Correto - inclua pelo menos um campo
fetch('/api/settings', { 
  method: 'PUT',
  body: JSON.stringify({ tema: 'escuro' }) 
});
```

### Erro: "Unauthorized"
```javascript
// ❌ Errado - sem token
fetch('/api/settings', { method: 'PUT' });

// ✅ Correto - inclua token
fetch('/api/settings', {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 🧪 Teste Rápido

```bash
# Substitua SEU_TOKEN pelo seu JWT
TOKEN="eyJhbGciOiJIUzI1NiI..."

# Teste simples
curl -X PUT http://localhost:3001/api/settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tema":"escuro"}'

# Esperado:
# {
#   "success": true,
#   "message": "Configurações atualizadas",
#   "data": { ... }
# }
```

---

## 📚 Documentação Completa

Para mais detalhes, consulte [SETTINGS_ENDPOINT.md](./SETTINGS_ENDPOINT.md)

---

**Status:** ✅ Pronto para Usar  
**Versão:** 1.0.0

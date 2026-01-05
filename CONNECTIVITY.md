# 🌐 GUIA DE CONECTIVIDADE - TRINITY OF LUCK

## Servidores em Execução

### 1. **Frontend (Vite React)**
- **URL Local**: http://localhost:8080/
- **URL Network**: http://192.168.1.14:8080/
- **Porta**: 8080
- **Status**: ✅ Rodando
- **Hot Reload**: Ativado

### 2. **API Gateway (Express)**
- **URL Local**: http://localhost:3001/
- **URL Network**: http://192.168.1.14:3001/
- **Porta**: 3001
- **Status**: ✅ Rodando
- **Rate Limit**: 100 req/min por IP

---

## 📋 Checklist de Inicialização

### Terminal 1: Frontend
```bash
cd "c:\Users\User\Desktop\TRINITY OF LUCK"
npm run dev
```
✅ **Status**: Rodando em http://localhost:8080

### Terminal 2: API Gateway
```bash
cd "c:\Users\User\Desktop\TRINITY OF LUCK\api-gateway"
npm start
```
✅ **Status**: Rodando em http://localhost:3001

---

## 🔗 Conectar Frontend ao API Gateway

### Em src/main.tsx ou src/App.tsx

```typescript
// Configurar API Gateway URL
const API_GATEWAY_URL = process.env.VITE_API_GATEWAY_URL || 'http://localhost:3001';

// Usar em fetch
const response = await fetch(`${API_GATEWAY_URL}/api/health`);
const data = await response.json();
console.log(data);
```

### Em .env do Frontend (Vite)
```env
VITE_API_GATEWAY_URL=http://localhost:3001
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Em .env.production do Frontend
```env
VITE_API_GATEWAY_URL=https://api.trinity-of-luck.com
VITE_SUPABASE_URL=https://your-project.supabase.co
```

---

## 🧪 Testar Conectividade

### 1. Testar API Gateway Localmente

```bash
# Terminal - Health check
curl http://localhost:3001/health

# Esperado: Status 200 com dados
```

### 2. Testar do Frontend em React

```typescript
// Em um componente React
useEffect(() => {
  fetch('http://localhost:3001/api/health')
    .then(res => res.json())
    .then(data => console.log('API OK:', data))
    .catch(err => console.error('API Error:', err));
}, []);
```

### 3. Verificar CORS

O Frontend em http://localhost:8080 deve conseguir acessar:
- ✅ http://localhost:3001/health
- ✅ http://localhost:3001/api/health
- ✅ http://localhost:3001/api/test-supabase

Se receber erro CORS, verifique em `.env` do API Gateway:
```env
CORS_ORIGIN=http://localhost:8080,http://192.168.1.14:8080
```

---

## 📊 Fluxo de Requisição

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│              http://localhost:8080                           │
│                                                              │
│  - User Interface                                            │
│  - State Management                                          │
│  - API Calls                                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ HTTP Request
                      │ (CORS enabled)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                               │
│               http://localhost:3001                          │
│                                                              │
│  - Express Server                                            │
│  - Middleware (CORS, RateLimit, etc)                         │
│  - Route Handlers                                            │
│  - Request Validation                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Database Query
                      │ or External API Call
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase                                  │
│               (PostgreSQL Database)                          │
│                                                              │
│  - Authentication                                            │
│  - Data Storage                                              │
│  - Real-time Subscriptions                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Autenticação & Autorização

### Fluxo de Autenticação

```
1. Usuário faz login no Frontend
   POST http://localhost:3001/api/auth/login
   {
     "email": "user@example.com",
     "password": "password"
   }

2. API Gateway valida com Supabase
   supabasePublic.auth.signInWithPassword()

3. API retorna JWT token
   {
     "success": true,
     "token": "eyJhbGc...",
     "userId": "uuid"
   }

4. Frontend armazena token (localStorage/cookies)

5. Requisições futuras incluem token
   Authorization: Bearer eyJhbGc...
```

---

## 🚀 Deployment (Futura Referência)

### Frontend Deployment (Vercel)
```bash
# Deploy do Vite React para Vercel
npm run build
vercel deploy --prod

# URL será: https://trinity-of-luck.vercel.app
```

### API Gateway Deployment (Railway/Render)
```bash
# Deploy Express para Railway
railway up

# URL será: https://api-trinity.railway.app
```

### Após Deployment

Atualizar `.env.production` do Frontend:
```env
VITE_API_GATEWAY_URL=https://api-trinity.railway.app
```

Atualizar `.env.production` do API Gateway:
```env
CORS_ORIGIN=https://trinity-of-luck.vercel.app
NODE_ENV=production
```

---

## 📱 Testar em Dispositivos Diferentes

### Pelo IP da Rede

#### Frontend (Vite)
```
http://192.168.1.14:8080/
```

#### API Gateway
```
http://192.168.1.14:3001/
```

### Configurar CORS para Rede Local
Em `api-gateway/.env`:
```env
CORS_ORIGIN=http://localhost:8080,http://192.168.1.14:8080,http://127.0.0.1:8080
```

---

## 🛠️ Debug de Conectividade

### Problema: CORS Error

**Sintoma**: 
```
Access to XMLHttpRequest at 'http://localhost:3001/api/...' 
from origin 'http://localhost:8080' has been blocked by CORS policy
```

**Solução**:
```bash
# 1. Verifique CORS_ORIGIN no .env
cat api-gateway/.env | grep CORS_ORIGIN

# 2. Reinicie o API Gateway
# (deve incluir http://localhost:8080)

# 3. Limpe cache do navegador (F12 → Storage → Clear)
```

### Problema: Connection Refused

**Sintoma**:
```
Error: connect ECONNREFUSED 127.0.0.1:3001
```

**Solução**:
```bash
# 1. Verifique se API Gateway está rodando
lsof -i :3001

# 2. Se não estiver, inicie
cd api-gateway
npm start

# 3. Teste connectivity
curl http://localhost:3001/health
```

### Problema: Rate Limit

**Sintoma**:
```
HTTP 429 - Too Many Requests
```

**Solução**:
```bash
# 1. Aguarde 1 minuto (janela padrão)
# 2. Ou reduza taxa de requisições
# 3. Ou aumente limite em .env
RATE_LIMIT_MAX_REQUESTS=200
```

---

## 📈 Monitoramento

### Ver Requisições em Tempo Real

**Terminal do API Gateway** mostará:
```
[2026-01-04T04:50:04.500Z] GET /api/health | Status: 200 | Duration: 5ms | IP: 127.0.0.1
[2026-01-04T04:50:05.120Z] POST /api/users | Status: 201 | Duration: 145ms | IP: 127.0.0.1
[2026-01-04T04:50:06.780Z] GET /api/test-supabase | Status: 200 | Duration: 234ms | IP: 127.0.0.1
```

### Headers de Response Úteis

```
X-Request-ID: Identification-timestamp-hash
X-Response-Time: 145ms
RateLimit-Limit: 100
RateLimit-Remaining: 98
RateLimit-Reset: 1262304000
```

---

## 🔄 Atualizar Código

### Sem Reiniciar (Hot Reload)

**Frontend**:
```bash
# Qualquer mudança em src/ recarrega automaticamente
# Vite HMR habilitado
```

**API Gateway**:
```bash
# Use npm run dev para hot reload com nodemon
npm run dev  # Reinicia automaticamente ao detectar mudanças
```

---

## 📊 Arquitetura Final

```
TRINITY OF LUCK
├── 🎨 Frontend (React + Vite)
│   ├── Port: 8080
│   ├── Hot Reload: ✅
│   ├── Otimizações: ✅ Lazy loading, Code splitting
│   └── URL: http://localhost:8080
│
├── 🔗 API Gateway (Express.js)
│   ├── Port: 3001
│   ├── Rate Limit: 100 req/min
│   ├── Middleware: Helmet, CORS, Morgan, etc
│   ├── Autenticação: JWT + Supabase
│   └── URL: http://localhost:3001
│
└── 💾 Backend (Supabase PostgreSQL)
    ├── Autenticação
    ├── Banco de Dados
    ├── Real-time Subscriptions
    └── Storage

```

---

## ✅ Checklist Final de Conectividade

- [ ] Frontend rodando em http://localhost:8080
- [ ] API Gateway rodando em http://localhost:3001
- [ ] CORS configurado corretamente
- [ ] Consegue acessar /api/health do Frontend
- [ ] Headers de autenticação funcionando
- [ ] Rate limiting testado
- [ ] Supabase connection testada
- [ ] Logs aparecendo no console

---

## 📚 Recursos Úteis

### Documentação
- [Express CORS](https://expressjs.com/en/resources/middleware/cors.html)
- [Vite Guide](https://vitejs.dev/guide/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

### Ferramentas de Debug
- [Insomnia](https://insomnia.rest/) - Cliente REST
- [Postman](https://www.postman.com/) - Teste de API
- [DevTools](https://developer.chrome.com/docs/devtools/) - Browser DevTools
- [curl](https://curl.se/) - CLI HTTP

---

**Trinity of Luck - Sistema Pronto para Desenvolvimento** 🚀

Ambos os servidores (Frontend e API Gateway) estão operacionais e conectados!

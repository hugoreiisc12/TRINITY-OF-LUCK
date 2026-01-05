# 🚀 API Gateway - Configuração Completa

## ✅ Status: CONFIGURADO E RODANDO

### 🌐 Servidor em Execução
- **Porta**: 3001
- **URL Local**: http://localhost:3001
- **Ambiente**: development

---

## 📦 Dependências Instaladas

```
✅ express (4.18.2)
✅ cors (2.8.5)
✅ dotenv (16.3.1)
✅ axios (1.6.2)
✅ cheerio (1.0.0-rc.12)
✅ @supabase/supabase-js (2.38.4)
✅ stripe (14.11.0)
✅ express-rate-limit (7.1.5)
✅ helmet (7.1.0)
✅ morgan (1.10.0)
```

Total: **153 pacotes instalados**

---

## ⚙️ Middleware Configurado

### 🔒 Segurança
- ✅ **Helmet** - Headers de segurança HTTP
- ✅ **CORS** - Origens permitidas configuradas
- ✅ **Rate Limiting** - 100 req/min por IP
- ✅ **API Key Validation** - Validação de chaves

### 📊 Parsing
- ✅ **JSON Parser** - Limite 10MB
- ✅ **URL Encoded** - Suporte a formulários

### 📝 Logging
- ✅ **Morgan** - Logging de requisições
- ✅ **Custom Request ID** - Rastreamento de requisições
- ✅ **Response Timing** - Tempo de resposta em headers

### 🛑 Error Handling
- ✅ **Global Error Handler** - Tratamento centralizado
- ✅ **404 Handler** - Rotas não encontradas
- ✅ **Graceful Shutdown** - Encerramento limpo

---

## 🔐 Supabase Inicializado

### Cliente Público (Anon Key)
```javascript
supabasePublic
- Para operações do lado do cliente
- Usa SUPABASE_ANON_KEY
```

### Cliente Admin (Service Role Key)
```javascript
supabaseAdmin
- Para operações administrativas
- Usa SUPABASE_SERVICE_ROLE_KEY (opcional)
```

**Status**: ✅ Clientes inicializados com sucesso

---

## 📍 Endpoints Disponíveis

### Health Checks
- `GET /health` - Health check simples
  ```json
  {
    "status": "ok",
    "timestamp": "2026-01-04T...",
    "environment": "development",
    "uptime": 12.5
  }
  ```

- `GET /api/health` - Health check completo
  ```json
  {
    "success": true,
    "message": "API Gateway is running",
    "timestamp": "2026-01-04T...",
    "environment": "development",
    "supabaseConnected": true
  }
  ```

### Testes
- `GET /api/test-supabase` - Testa conexão com Supabase
  ```json
  {
    "success": true,
    "message": "Supabase connection successful",
    "usersCount": 0
  }
  ```

---

## ⚡ Rate Limiting Configurado

### Global Rate Limiter
- **Janela**: 60 segundos (configurável em .env)
- **Limite**: 100 requisições por IP
- **Resposta**: Headers `RateLimit-*` padrão
- **Status**: 429 (Too Many Requests)

### Auth Rate Limiter (configurado para rotas de auth)
- **Janela**: 15 minutos
- **Limite**: 5 tentativas
- **Comportamento**: Pula requisições bem-sucedidas

### Configuração do IP
- Suporta proxy reverso (X-Forwarded-For)
- Fallback para X-Client-IP
- Último recurso: IP de conexão

---

## 📋 Estrutura de Pastas Criada

```
api-gateway/
├── server.js                 # Servidor principal com middleware
├── config.js                 # Configurações centralizadas
├── package.json              # Dependências
├── .env                       # Variáveis de ambiente
├── .env.example               # Exemplo de .env
├── .gitignore                 # Git ignore
├── README.md                  # Documentação
│
└── utils/
    ├── responses.js           # Respostas padronizadas
    └── helpers.js             # Funções auxiliares
│
└── middleware/
    └── index.js               # Middleware customizado
```

---

## 🛠️ Configuração via .env

### Variáveis Principais
```env
NODE_ENV=development
PORT=3001

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:8080,http://192.168.1.14:8080

# API Keys
API_SECRET_KEY=your-secure-api-secret-key
```

---

## 🔗 Conectar Frontend ao API Gateway

### Exemplo React
```javascript
const API_GATEWAY = 'http://localhost:3001';

// Com autenticação via token
const response = await fetch(`${API_GATEWAY}/api/health`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

// Com API Key
const response = await fetch(`${API_GATEWAY}/api/test-supabase`, {
  headers: {
    'X-API-Key': process.env.API_SECRET_KEY,
  },
});
```

---

## 🚀 Como Usar

### Iniciar em Desenvolvimento
```bash
cd api-gateway
npm run dev  # com nodemon (auto-reload)
```

### Iniciar em Produção
```bash
cd api-gateway
npm start
```

### Testar Endpoints
```bash
# Health Check
curl http://localhost:3001/health

# API Health
curl http://localhost:3001/api/health

# Test Supabase
curl http://localhost:3001/api/test-supabase
```

---

## 📊 Recursos Implementados

### Segurança
- [x] Helmet para headers de segurança
- [x] CORS com múltiplas origens
- [x] Rate limiting por IP
- [x] Validação de API Key
- [x] Proteção contra XSS

### Performance
- [x] Request ID tracking
- [x] Response time headers
- [x] Logging eficiente
- [x] Body size limits (10MB)

### Confiabilidade
- [x] Error handling robusto
- [x] Graceful shutdown
- [x] Uncaught exception handling
- [x] Unhandled promise rejection handling

### Integração
- [x] Supabase (anon + admin)
- [x] Stripe (configurado)
- [x] Axios para HTTP requests
- [x] Cheerio para parsing HTML

---

## 🎯 Próximas Etapas Recomendadas

1. **Criar Rotas**
   - Auth routes (/api/auth/login, /api/auth/signup)
   - User routes (/api/users)
   - Payment routes (/api/payments)

2. **Implementar Controllers**
   - AuthController
   - UserController
   - PaymentController

3. **Adicionar Validação**
   - Joi ou Yup para validação de input
   - Custom validation middleware

4. **Configurar Database**
   - Migrations do Supabase
   - Seeders para dados de teste

5. **Testes**
   - Jest para testes unitários
   - Supertest para testes de API

6. **Deployment**
   - Docker container
   - GitHub Actions CI/CD
   - Deploy em Heroku/Vercel/Railway

---

## 🐛 Troubleshooting

### Erro: "Port 3001 already in use"
```bash
# Mude a porta
PORT=3002 npm start
```

### Erro: "SUPABASE_URL is not defined"
```bash
# Verifique o arquivo .env
# Copie de .env.example se necessário
cp .env.example .env
```

### CORS error no frontend
```bash
# Adicione seu domínio em CORS_ORIGIN
CORS_ORIGIN=http://seu-dominio:8080
```

### Rate limit atingido
- Aguarde 1 minuto (janela global)
- Verifique se está mandando muitas requisições
- Ajuste RATE_LIMIT_MAX_REQUESTS se necessário

---

## 📈 Monitoramento

### Headers de Resposta Úteis
- `X-Request-ID` - ID único da requisição
- `X-Response-Time` - Tempo de resposta em ms
- `RateLimit-Limit` - Limite de requisições
- `RateLimit-Remaining` - Requisições restantes
- `RateLimit-Reset` - Quando o limite reseta

### Logs Console
- Todas as requisições são logadas
- Erros são destacados com ❌
- Sucessos com ✅

---

## 📧 Contato & Suporte

Para mais informações:
- [Express Docs](https://expressjs.com)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)

---

**API Gateway da Trinity of Luck**
**Desenvolvido em: 04/01/2026**
**Status: ✅ Totalmente Operacional**

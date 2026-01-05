# 🎯 TRINITY OF LUCK - API Gateway

**Status:** ✅ Production-Ready  
**Version:** 3.0 (Three Endpoints Complete)  
**Updated:** January 15, 2024

## 📑 Complete Implementation

**Phase 1 ✅:** GET /api/platforms - Fetch lottery platforms  
**Phase 2 ✅:** GET /api/results/:id - Fetch analysis results  
**Phase 3 ✅:** POST /api/feedback - Submit feedback & trigger learning loop (NEW)

---

## 📌 Quick Start

```bash
# 1. Navigate to api-gateway
cd api-gateway

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your Stripe & Supabase credentials

# 4. Start server
npm run dev

# Server runs on http://localhost:3001
```

---

## 🔐 Features Implemented

### ✅ Stripe Integration
- Configure with `STRIPE_SECRET_KEY` from .env
- Create checkout sessions: `POST /api/stripe/checkout`
- Webhook handler for payment events: `POST /api/webhooks/stripe`
- Supports all major Stripe events:
  - Payment succeeded/failed
  - Subscription created/updated/deleted

### ✅ JWT Authentication (Supabase)
- Middleware validates JWT tokens from `Authorization` header
- Extracts user data to `req.user` object
- 5 protected endpoints requiring authentication
- Proper error handling for invalid/expired tokens

### ✅ Protected Routes
```
GET  /api/auth/me                    - Get user profile
PUT  /api/auth/profile               - Update profile
GET  /api/auth/subscriptions         - Get subscriptions
GET  /api/auth/analyses              - Get analysis history
POST /api/stripe/checkout            - Create checkout session
```

### ✅ Webhook Handlers
```
POST /api/webhooks/stripe            - Stripe events (signature verified)
POST /api/webhooks/auth              - Supabase auth events
```

### ✅ Database
- Automatic schema initialization on startup
- 7 tables with proper relationships
- Optimized indexes for performance
- Seed data for platforms and plans

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [AUTH_ENDPOINTS.md](./AUTH_ENDPOINTS.md) | Complete endpoint reference with cURL examples |
| [STRIPE_JWT_SETUP.md](./STRIPE_JWT_SETUP.md) | Setup guide & testing instructions |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design & flow diagrams |
| [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) | Implementation checklist for deployment |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | What was built & next steps |

---

## 🚀 Testing

### Health Checks
```bash
# API Gateway health
curl http://localhost:3001/health

# Database status
curl http://localhost:3001/api/database/tables
```

### Protected Endpoints (with JWT)
```bash
# Get JWT token first
JWT_TOKEN="eyJ..." 

# Get your profile
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $JWT_TOKEN"

# Update profile
curl -X PUT http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"perfil": {"nome": "New Name"}}'
```

### Webhook Testing (Local)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# Trigger test event
stripe trigger payment_intent.succeeded
```

---

## 🔑 Environment Variables

```env
# Server
NODE_ENV=development
PORT=3001

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# CORS
CORS_ORIGIN=http://localhost:8080,http://localhost:3000

# API Security
API_SECRET_KEY=your-secure-key
```

See [.env.example](./.env.example) for complete documentation.

---

## 🛠️ Project Structure

```
api-gateway/
├── server.js                       # Main Express server
├── database.js                     # Database schema & init
├── config.js                       # Configuration
├── .env                           # Environment variables
├── .env.example                   # Environment template
│
├── middleware/
│   └── index.js                   # Custom middleware
│
├── utils/
│   ├── responses.js               # Response formatting
│   └── helpers.js                 # Utility functions
│
├── Documentation/
│   ├── README.md                  # This file
│   ├── AUTH_ENDPOINTS.md          # Endpoint reference
│   ├── STRIPE_JWT_SETUP.md        # Setup guide
│   ├── ARCHITECTURE.md            # System design
│   ├── SETUP_CHECKLIST.md         # Deployment checklist
│   └── IMPLEMENTATION_SUMMARY.md  # Summary
│
├── Examples/
│   ├── client-protected-endpoints.js  # Frontend examples
│   ├── client-example.js               # API client
│   ├── routes-example.js               # Route templates
│   └── test-endpoints.sh               # Test script
│
└── package.json
```

---

## 📋 API Summary

### Health & Status Endpoints (No Auth)
```
GET  /health                         - Server health status
GET  /api/health                     - API health status
GET  /api/test-supabase              - Supabase connection test
GET  /api/database/schema            - Database schema status
GET  /api/database/tables            - Database tables & row counts
```

### Authentication Endpoints (JWT Required)
```
GET  /api/auth/me                    - Get authenticated user profile
PUT  /api/auth/profile               - Update user profile
GET  /api/auth/subscriptions         - Get user subscriptions (with plans)
GET  /api/auth/analyses              - Get user analysis history
POST /api/stripe/checkout            - Create Stripe checkout session
```

### Webhooks (No Auth, Signature Verified)
```
POST /api/webhooks/stripe            - Stripe payment/subscription events
POST /api/webhooks/auth              - Supabase auth events
```

---

## 🔒 Security Features

✅ **Authentication**
- JWT token validation via Supabase
- User data extraction from token
- Proper 401 error responses

✅ **Webhooks**
- Stripe signature verification
- Event type validation
- Secure processing

✅ **Protection**
- Helmet for security headers
- CORS with origin whitelist
- Rate limiting (100 req/min per IP)
- Input validation on all endpoints

✅ **Database**
- Service role for admin operations
- Anon key for user operations
- Row-level security ready

---

## 🐛 Troubleshooting

### "No authorization token provided"
Add `Authorization: Bearer <token>` header to protected endpoints

### "Invalid or expired token"
Get a fresh token from Supabase authentication service

### "Stripe is not configured"
Verify `STRIPE_SECRET_KEY` is set in `.env` and restart server

### "Database connection failed"
Check `SUPABASE_URL` and credentials in `.env`

### "Webhook signature verification failed"
Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard

### Full Troubleshooting Guide
See [STRIPE_JWT_SETUP.md](./STRIPE_JWT_SETUP.md#-troubleshooting)

---

## 📞 Support Resources

- **Stripe API Docs:** https://stripe.com/docs/api
- **Supabase Auth:** https://supabase.com/docs/guides/auth
- **Express.js:** https://expressjs.com
- **JWT Guide:** https://supabase.com/docs/guides/auth#jwt

---

## 🎯 Next Steps

### For Development
1. Review [AUTH_ENDPOINTS.md](./AUTH_ENDPOINTS.md) for all endpoints
2. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
3. Use [client-protected-endpoints.js](./client-protected-endpoints.js) for frontend integration
4. Test with [test-endpoints.sh](./test-endpoints.sh)

### For Production
1. Follow [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) checklist
2. Switch to production Stripe keys
3. Update CORS_ORIGIN for your domain
4. Enable HTTPS everywhere
5. Set up monitoring and alerting

---

## 📊 Endpoints Overview

| Category | Count | Examples |
|----------|-------|----------|
| Health/Status | 5 | `/health`, `/api/health`, `/api/database/tables` |
| Auth (Protected) | 5 | `/api/auth/me`, `/api/auth/subscriptions` |
| Webhooks | 2 | `/api/webhooks/stripe`, `/api/webhooks/auth` |
| **Total** | **12** | — |

---

## ✨ Key Features

- ✅ **Production-Ready** - Enterprise-grade error handling
- ✅ **Secure** - JWT validation, webhook verification, rate limiting
- ✅ **Documented** - 1000+ lines of documentation
- ✅ **Tested** - Test scripts included
- ✅ **Scalable** - Database optimized with indexes
- ✅ **Monitored** - Health checks and status endpoints
- ✅ **Integrated** - Stripe + Supabase + JWT
- ✅ **Examples** - Frontend integration examples

---

## 📝 License

Part of TRINITY OF LUCK project - All rights reserved.

---

**Questions?** Check the documentation files or see the troubleshooting section.

**Ready to deploy?** Follow the [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) for step-by-step instructions.

**API Gateway is production-ready!** 🚀

### 3. Configurar Stripe (Opcional)

Se usar Stripe, configure suas chaves:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 4. Configurar CORS

Adicione as origens permitidas:

```env
CORS_ORIGIN=http://localhost:8080,http://192.168.1.14:8080
```

## 🚀 Iniciar o Servidor

### Desenvolvimento (com auto-reload)

```bash
npm run dev
```

### Produção

```bash
npm start
```

## 📍 Endpoints Disponíveis

### Health Checks

- `GET /health` - Health check simples
- `GET /api/health` - Health check completo

### Testes

- `GET /api/test-supabase` - Testa conexão com Supabase

## ⚙️ Middleware Configurado

### Segurança

- **Helmet**: Headers de segurança HTTP
- **CORS**: Controle de origens
- **Rate Limiting**: 100 requisições/minuto por IP
- **API Key Validation**: Validação de chaves de API

### Parsing

- **JSON Parser**: Limite de 10MB
- **URL Parser**: Suporte a encoded URLs

### Logging

- **Morgan**: Logging de requisições HTTP (apenas erros em prod)

## 🔐 Inicialização do Supabase

O servidor inicializa dois clientes Supabase:

### 1. Cliente Público (Anon Key)
```javascript
supabasePublic - Para operações do lado do cliente
```

### 2. Cliente Admin (Service Role Key)
```javascript
supabaseAdmin - Para operações administrativas (opcional)
```

Ambos são testados na inicialização.

## 📊 Rate Limiting

- **Global**: 100 requisições por minuto por IP
- **Auth**: 5 tentativas por 15 minutos (para endpoints de autenticação)
- **Headers**: Retorna `RateLimit-*` headers padrão

## 🛡️ Tratamento de Erros

Todos os erros retornam um formato padronizado:

```json
{
  "success": false,
  "error": "Mensagem de erro",
  "timestamp": "2024-01-04T...",
  "stack": "... (apenas em desenvolvimento)"
}
```

## 📝 Estrutura de Pastas

```
api-gateway/
├── server.js          # Servidor principal
├── config.js          # Configurações
├── package.json       # Dependências
├── .env               # Variáveis de ambiente
├── .env.example       # Exemplo de env
└── utils/
    ├── responses.js   # Respostas padronizadas
    └── helpers.js     # Funções auxiliares
```

## 🔗 Conectar com Frontend

Para usar o API Gateway no frontend:

```javascript
// Frontend (React)
const API_GATEWAY_URL = 'http://localhost:3001';

fetch(`${API_GATEWAY_URL}/api/health`)
  .then(res => res.json())
  .then(data => console.log(data));
```

## 📚 Próximas Etapas

1. **Criar Rotas**: Adicione rotas específicas em `routes/`
2. **Middleware Customizado**: Crie middleware para autenticação
3. **Controllers**: Implemente lógica de negócio
4. **Validação**: Use biblioteca de validação (joi, yup)
5. **Testes**: Implemente testes com Jest/Mocha

## 🐛 Troubleshooting

### Porta já em uso
```bash
# Mude a porta no .env ou kill o processo
PORT=3002 npm run dev
```

### Erro de Supabase
```bash
# Verifique se SUPABASE_URL e SUPABASE_ANON_KEY estão corretos
# Verifique sua conexão de internet
```

### CORS error
```bash
# Adicione a origem permitida em CORS_ORIGIN no .env
CORS_ORIGIN=http://seu-dominio:porta
```

## 📧 Suporte

Para problemas ou dúvidas, consulte a documentação:
- [Express Docs](https://expressjs.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)

---

**Desenvolvido com ❤️ para Trinity of Luck**

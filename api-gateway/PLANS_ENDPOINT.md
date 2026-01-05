# GET /api/plans - TRINITY OF LUCK Plans API

## Overview

The plans endpoint allows you to retrieve all subscription plans available in the system. This is essential for displaying pricing pages, plan comparisons, and subscription management interfaces.

**Endpoint:** `GET /api/plans`  
**Base URL:** `http://localhost:3001`  
**Authentication:** None required  
**Rate Limit:** 100 requests/minute (global limit)

---

## Request Format

### URL
```
GET http://localhost:3001/api/plans
```

### Headers
```http
Content-Type: application/json
```

### Query Parameters
None. The endpoint returns all available plans.

---

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Plans fetched successfully",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nome": "Basic",
      "preco": 29.90,
      "descricao": "Plano básico para iniciantes",
      "ciclo": "monthly",
      "features": ["5 análises/mês", "Email support"],
      "criado_em": "2024-01-15T10:00:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "nome": "Premium",
      "preco": 99.90,
      "descricao": "Plano premium com recursos avançados",
      "ciclo": "monthly",
      "features": ["Análises ilimitadas", "Prioridade support", "API access"],
      "criado_em": "2024-01-15T10:00:00Z"
    }
  ],
  "count": 2,
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Failed to fetch plans",
  "details": "Database connection error"
}
```

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the request succeeded |
| `message` | string | Human-readable status message |
| `data` | array | Array of plan objects |
| `count` | number | Number of plans returned |
| `timestamp` | string | ISO-8601 timestamp of response |

### Plan Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique plan identifier |
| `nome` | string | Plan name (e.g., "Basic", "Premium") |
| `preco` | number | Price in BRL |
| `descricao` | string | Plan description |
| `ciclo` | string | Billing cycle ("monthly", "yearly") |
| `features` | array | List of features included |
| `criado_em` | string | ISO-8601 creation timestamp |

---

## Error Codes

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| 500 | Failed to fetch plans | Database connection error | Check Supabase connection |
| 500 | Failed to retrieve plans | Server error | Check server logs |

---

## Examples

### cURL

#### Fetch All Plans

```bash
curl -X GET http://localhost:3001/api/plans \
  -H "Content-Type: application/json"
```

#### Pretty Print with jq

```bash
curl -s http://localhost:3001/api/plans | jq '.data[] | {nome, preco}'
```

Output:
```json
{
  "nome": "Basic",
  "preco": 29.90
}
{
  "nome": "Premium",
  "preco": 99.90
}
```

### JavaScript (Fetch)

#### Basic Usage

```javascript
const fetchPlans = async () => {
  const response = await fetch('http://localhost:3001/api/plans');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch plans');
  }

  return data.data; // Return just the plans array
};

// Usage
const plans = await fetchPlans();
plans.forEach(plan => {
  console.log(`${plan.nome}: R$ ${plan.preco}/mês`);
});
```

#### With Error Handling

```javascript
const getPlansWithError = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/plans');
    const data = await response.json();

    if (!response.ok) {
      console.error('Error:', data.error);
      console.error('Details:', data.details);
      return [];
    }

    console.log(`Found ${data.count} plans`);
    return data.data;

  } catch (error) {
    console.error('Network error:', error.message);
    return [];
  }
};
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

const getPlans = async () => {
  try {
    const response = await axios.get('http://localhost:3001/api/plans');
    console.log('Plans:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response?.data?.error);
    throw error;
  }
};
```

### React (Using Client Library)

#### Display All Plans

```javascript
import { usePlans, PriceComparison } from './client-plans';

function PriceTable() {
  const { plans, loading, error } = usePlans();

  if (loading) return <p>Carregando planos...</p>;
  if (error) return <p>Erro: {error}</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Plano</th>
          <th>Preço</th>
          <th>Ciclo</th>
        </tr>
      </thead>
      <tbody>
        {plans.map(plan => (
          <tr key={plan.id}>
            <td>{plan.nome}</td>
            <td>R$ {plan.preco.toFixed(2)}</td>
            <td>{plan.ciclo}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

#### Get Cheapest Plan

```javascript
import { getCheapestPlan } from './client-plans';

async function ShowBestValue() {
  const cheapest = await getCheapestPlan();
  return <div>{cheapest.nome} - R$ {cheapest.preco}</div>;
}
```

#### Price Comparison Component

```javascript
import { PriceComparison } from './client-plans';

function PricingPage() {
  const handleSelectPlan = (plan) => {
    console.log('Selected plan:', plan.nome);
    // Navigate to checkout or subscription page
  };

  return (
    <div>
      <h1>Escolha seu plano</h1>
      <PriceComparison onSelectPlan={handleSelectPlan} />
    </div>
  );
}
```

---

## Database Integration

The plans are stored in the Supabase `planos` table with the following structure:

```sql
CREATE TABLE planos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  preco DECIMAL(10, 2) NOT NULL,
  descricao TEXT,
  ciclo VARCHAR(50) DEFAULT 'monthly',
  features TEXT[] OR JSON,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plans_preco ON planos(preco);
```

### Example Data

```sql
INSERT INTO planos (nome, preco, descricao, ciclo, features) VALUES
('Basic', 29.90, 'Plano básico para iniciantes', 'monthly', 
 '["5 análises/mês", "Email support", "Básico de análise"]'),
('Premium', 99.90, 'Plano premium com recursos avançados', 'monthly',
 '["Análises ilimitadas", "Prioridade support", "API access", "Relatórios customizados"]'),
('Enterprise', 299.90, 'Solução enterprise com dedicação', 'monthly',
 '["Análises ilimitadas", "Suporte 24/7", "API completa", "Relatórios customizados", "Gestor dedicado"]');
```

### Query Examples

```sql
-- Get all plans ordered by price
SELECT * FROM planos ORDER BY preco ASC;

-- Get plans in a price range
SELECT * FROM planos WHERE preco BETWEEN 50 AND 150;

-- Get most expensive plan
SELECT * FROM planos ORDER BY preco DESC LIMIT 1;

-- Count plans
SELECT COUNT(*) as total_plans FROM planos;
```

---

## Performance Considerations

### Request Timing

- **Average Response Time:** 100-300ms
- **Database Query:** Simple SELECT with ordering
- **Cache Strategy:** Can be cached for 5-10 minutes (plans rarely change)

### Optimization Tips

1. **Client-side caching:**
   ```javascript
   const cachedPlans = localStorage.getItem('plans');
   if (cachedPlans && isStillValid()) {
     return JSON.parse(cachedPlans);
   }
   ```

2. **React memo for components:**
   ```javascript
   const PlanCard = React.memo(({ plan }) => { ... });
   ```

3. **Batch multiple plans queries:**
   ```javascript
   // Instead of calling getPlans() multiple times,
   // cache the result and reuse it
   const plans = await getPlans();
   const basic = plans.data.find(p => p.nome === 'Basic');
   ```

---

## Best Practices

1. **Cache Plans Data:**
   Plans don't change frequently, so cache them client-side
   ```javascript
   const useCachedPlans = () => {
     const [plans, setPlans] = useState(null);
     
     useEffect(() => {
       const cached = localStorage.getItem('plans');
       if (cached) {
         setPlans(JSON.parse(cached));
       } else {
         getPlans().then(data => {
           localStorage.setItem('plans', JSON.stringify(data));
           setPlans(data);
         });
       }
     }, []);
     
     return plans;
   };
   ```

2. **Format Prices Consistently:**
   ```javascript
   import { formatPrice } from './client-plans';
   
   <span>{formatPrice(plan.preco)}</span>
   ```

3. **Separate Concerns:**
   - API calls in hooks
   - UI rendering in components
   - Business logic in utility functions

4. **Error Handling:**
   Always provide fallback UI
   ```javascript
   if (error) return <EmptyState message="Unable to load plans" />;
   ```

---

## Related Endpoints

- [GET /api/platforms](./PLATFORMS_ENDPOINT.md) - Fetch lottery platforms
- [GET /api/results/:id](./RESULTS_ENDPOINT.md) - Fetch analysis results
- [POST /api/feedback](./FEEDBACK_ENDPOINT.md) - Submit feedback

---

## Changelog

**Version 1.0** (2024-01-15)
- Initial plans endpoint implementation
- Client library with React hooks
- Complete documentation

---

## Support

For issues or questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review the [examples](#examples)
3. Check server logs: `tail -f api-gateway/logs/server.log`
4. Contact development team

---

**Last Updated:** 2024-01-15  
**Maintained By:** TRINITY OF LUCK Team

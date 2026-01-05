# GET /api/plans - Quick Reference

## Quick Start

```javascript
import { getPlans, usePlans, PriceComparison } from './client-plans';

// Function call
const response = await getPlans();
console.log(response.data); // Array of plans

// React hook
const { plans, loading, error } = usePlans();

// Component
<PriceComparison onSelectPlan={handleSelect} />
```

## API Endpoint

```
GET http://localhost:3001/api/plans
Content-Type: application/json
```

## Response

```json
{
  "success": true,
  "message": "Plans fetched successfully",
  "data": [
    {
      "id": "uuid",
      "nome": "Basic",
      "preco": 29.90,
      "descricao": "Descrição do plano",
      "ciclo": "monthly",
      "features": ["Feature 1", "Feature 2"]
    }
  ],
  "count": 3,
  "timestamp": "2024-01-15..."
}
```

## Client Functions

```javascript
// Get all plans
getPlans()

// Get plan by ID
getPlanById(planId)

// Get sorted by price
getPlansSortedByPrice('asc') // or 'desc'

// Get by price range
getPlansByPriceRange(0, 100)

// Get cheapest
getCheapestPlan()

// Get premium
getPremiumPlan()

// Format price
formatPrice(99.90) // 'R$ 99.90'

// Check feature
hasFeature(plan, 'analytics')
```

## React Hooks

```javascript
// All plans
const { plans, loading, error, refetch, cheapest, premium } = usePlans();

// Single plan
const { plan, loading, error } = usePlan(planId);
```

## React Components

```javascript
<PriceComparison onSelectPlan={handleSelect} />

<PlanCard 
  plan={plan}
  highlighted={true}
  onSelect={handleSelect}
/>
```

## Examples

### cURL
```bash
curl http://localhost:3001/api/plans
```

### JavaScript
```javascript
const plans = await getPlans();
console.log(`${plans.data.length} plans available`);
```

### React
```javascript
<PriceComparison onSelectPlan={(plan) => alert(plan.nome)} />
```

## Fields

| Field | Type | Example |
|-------|------|---------|
| `id` | UUID | "550e8400..." |
| `nome` | string | "Basic" |
| `preco` | number | 29.90 |
| `descricao` | string | "Plano básico" |
| `ciclo` | string | "monthly" |
| `features` | array | ["Feature 1", "Feature 2"] |

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 500 | Server error |

## Features Included

✅ Get all plans  
✅ Filter by price  
✅ Sort by price  
✅ Format prices  
✅ React hooks  
✅ Price comparison component  
✅ Plan cards component  
✅ Feature checking  

---

**Full Docs:** See [PLANS_ENDPOINT.md](./PLANS_ENDPOINT.md)

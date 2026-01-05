/**
 * TRINITY OF LUCK - Plans Client Library
 * 
 * Handles subscription plans retrieval and filtering
 * Provides JavaScript and React interfaces for accessing plans
 * 
 * Usage:
 *   const plans = await getPlans();
 *   const filteredPlans = await getPlansByFeature('analytics');
 *   
 * React Hook:
 *   const { plans, loading, error } = usePlans();
 */

// ============================================================
// CONFIGURATION
// ============================================================

const PLANS_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const PLANS_ENDPOINT = `${PLANS_API_URL}/api/plans`;

// ============================================================
// CORE FUNCTIONS
// ============================================================

/**
 * Fetch all subscription plans
 * 
 * @returns {Promise<{success: boolean, data: Array, count: number, timestamp: string}>}
 * 
 * @example
 * const response = await getPlans();
 * console.log(`Found ${response.count} plans`);
 * response.data.forEach(plan => {
 *   console.log(`${plan.nome}: R$ ${plan.preco}`);
 * });
 */
export const getPlans = async () => {
  try {
    console.log('📋 Fetching subscription plans...');

    const response = await fetch(PLANS_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error || 'Failed to fetch plans');
      error.status = response.status;
      error.details = data.details;
      throw error;
    }

    console.log(`✅ Retrieved ${data.count} plans`);
    return data;

  } catch (error) {
    console.error('❌ Error fetching plans:', error);
    throw error;
  }
};

/**
 * Get a specific plan by ID
 * 
 * @param {string} planId - Plan UUID
 * @returns {Promise<{success: boolean, data: Object}>}
 * 
 * @example
 * const response = await getPlanById('premium-plan-id');
 * console.log(response.data.nome, response.data.preco);
 */
export const getPlanById = async (planId) => {
  try {
    if (!planId) {
      throw new Error('Plan ID is required');
    }

    const response = await getPlans();
    const plan = response.data.find(p => p.id === planId);

    if (!plan) {
      throw new Error(`Plan with ID ${planId} not found`);
    }

    return {
      success: true,
      data: plan,
    };

  } catch (error) {
    console.error('❌ Error getting plan by ID:', error);
    throw error;
  }
};

/**
 * Get plans sorted by price
 * 
 * @param {string} order - 'asc' for ascending, 'desc' for descending
 * @returns {Promise<Array>}
 * 
 * @example
 * const cheapest = await getPlansSortedByPrice('asc');
 * const mostExpensive = await getPlansSortedByPrice('desc');
 */
export const getPlansSortedByPrice = async (order = 'asc') => {
  try {
    const response = await getPlans();
    const sorted = [...response.data].sort((a, b) => {
      const comparison = a.preco - b.preco;
      return order === 'desc' ? -comparison : comparison;
    });
    return sorted;

  } catch (error) {
    console.error('❌ Error sorting plans:', error);
    throw error;
  }
};

/**
 * Get plans within a price range
 * 
 * @param {number} minPrice - Minimum price
 * @param {number} maxPrice - Maximum price
 * @returns {Promise<Array>}
 * 
 * @example
 * const affordable = await getPlansByPriceRange(0, 100);
 */
export const getPlansByPriceRange = async (minPrice, maxPrice) => {
  try {
    if (minPrice < 0 || maxPrice < 0) {
      throw new Error('Prices must be non-negative');
    }

    if (minPrice > maxPrice) {
      throw new Error('Minimum price cannot be greater than maximum price');
    }

    const response = await getPlans();
    const filtered = response.data.filter(
      plan => plan.preco >= minPrice && plan.preco <= maxPrice
    );

    console.log(`✅ Found ${filtered.length} plans in price range`);
    return filtered;

  } catch (error) {
    console.error('❌ Error filtering by price:', error);
    throw error;
  }
};

/**
 * Get the most affordable plan
 * 
 * @returns {Promise<Object>}
 * 
 * @example
 * const basic = await getCheapestPlan();
 * console.log(`Best value: ${basic.nome} - R$ ${basic.preco}`);
 */
export const getCheapestPlan = async () => {
  try {
    const plans = await getPlansSortedByPrice('asc');
    if (plans.length === 0) {
      throw new Error('No plans available');
    }
    return plans[0];

  } catch (error) {
    console.error('❌ Error getting cheapest plan:', error);
    throw error;
  }
};

/**
 * Get the premium plan
 * 
 * @returns {Promise<Object>}
 * 
 * @example
 * const premium = await getPremiumPlan();
 * console.log(`Premium: ${premium.nome} - R$ ${premium.preco}`);
 */
export const getPremiumPlan = async () => {
  try {
    const plans = await getPlansSortedByPrice('desc');
    if (plans.length === 0) {
      throw new Error('No plans available');
    }
    return plans[0];

  } catch (error) {
    console.error('❌ Error getting premium plan:', error);
    throw error;
  }
};

/**
 * Format price for display
 * 
 * @param {number} price - Price value
 * @param {string} currency - Currency code (default: 'BRL')
 * @returns {string}
 * 
 * @example
 * formatPrice(99.90) // 'R$ 99.90'
 * formatPrice(99.90, 'USD') // '$99.90'
 */
export const formatPrice = (price, currency = 'BRL') => {
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
  });
  return formatter.format(price);
};

/**
 * Check if plan includes a feature
 * 
 * @param {Object} plan - Plan object
 * @param {string} featureName - Feature name to check
 * @returns {boolean}
 * 
 * @example
 * const hasPremiumFeature = hasFeature(plan, 'advanced_analytics');
 */
export const hasFeature = (plan, featureName) => {
  if (!plan || !plan.features) return false;
  return Array.isArray(plan.features) 
    ? plan.features.includes(featureName)
    : plan.features[featureName] === true;
};

// ============================================================
// REACT HOOKS
// ============================================================

/**
 * React Hook for plans
 * Manages loading, error, and plans data states
 * 
 * @returns {{
 *   plans: Array,
 *   loading: boolean,
 *   error: string|null,
 *   refetch: function,
 *   cheapest: Object|null,
 *   premium: Object|null
 * }}
 * 
 * @example
 * export function PriceTable() {
 *   const { plans, loading, error } = usePlans();
 *   
 *   if (loading) return <p>Carregando planos...</p>;
 *   if (error) return <p>Erro: {error}</p>;
 *   
 *   return (
 *     <div>
 *       {plans.map(plan => (
 *         <div key={plan.id}>
 *           <h3>{plan.nome}</h3>
 *           <p>R$ {plan.preco}</p>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 */
export const usePlans = () => {
  const [plans, setPlans] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [cheapest, setCheapest] = React.useState(null);
  const [premium, setPremium] = React.useState(null);

  const fetchPlans = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getPlans();
      setPlans(response.data || []);
      
      // Calculate cheapest and premium
      if (response.data && response.data.length > 0) {
        const sorted = [...response.data].sort((a, b) => a.preco - b.preco);
        setCheapest(sorted[0]);
        setPremium(sorted[sorted.length - 1]);
      }

    } catch (err) {
      const errorMessage = err.message || 'Failed to load plans';
      setError(errorMessage);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch plans on mount
  React.useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    loading,
    error,
    refetch: fetchPlans,
    cheapest,
    premium,
  };
};

/**
 * Hook to fetch a specific plan by ID
 * 
 * @param {string} planId - Plan UUID
 * @returns {{
 *   plan: Object|null,
 *   loading: boolean,
 *   error: string|null
 * }}
 */
export const usePlan = (planId) => {
  const [plan, setPlan] = React.useState(null);
  const [loading, setLoading] = React.useState(!!planId);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!planId) {
      setPlan(null);
      setLoading(false);
      return;
    }

    const fetchPlan = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getPlanById(planId);
        setPlan(response.data);
      } catch (err) {
        setError(err.message || 'Failed to load plan');
        setPlan(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId]);

  return { plan, loading, error };
};

// ============================================================
// REACT COMPONENTS
// ============================================================

/**
 * PriceComparison Component
 * Displays all plans in a comparison table
 * 
 * @param {Object} props
 * @param {function} props.onSelectPlan - Callback when plan is selected
 * @param {string} props.className - CSS class
 * @returns {JSX.Element}
 * 
 * @example
 * <PriceComparison 
 *   onSelectPlan={(plan) => console.log('Selected:', plan)}
 * />
 */
export const PriceComparison = ({ onSelectPlan, className = '' }) => {
  const { plans, loading, error } = usePlans();

  if (loading) {
    return (
      <div className={`plans-loading ${className}`} style={{ padding: '20px', textAlign: 'center' }}>
        <p>Carregando planos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`plans-error ${className}`} style={{ padding: '20px', color: 'red' }}>
        <p>❌ Erro ao carregar planos: {error}</p>
      </div>
    );
  }

  return (
    <div className={`price-comparison ${className}`} style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      {plans.map((plan) => (
        <div
          key={plan.id}
          style={{
            flex: '1',
            minWidth: '250px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
          }}
        >
          <h3>{plan.nome}</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>
            {formatPrice(plan.preco)}
          </div>
          {plan.descricao && <p style={{ color: '#666' }}>{plan.descricao}</p>}
          
          {plan.features && (
            <ul style={{ margin: '15px 0', paddingLeft: '20px' }}>
              {Array.isArray(plan.features) ? (
                plan.features.map((feature, idx) => <li key={idx}>{feature}</li>)
              ) : (
                Object.entries(plan.features).map(([key, value]) => (
                  value && <li key={key}>{key}</li>
                ))
              )}
            </ul>
          )}

          <button
            onClick={() => onSelectPlan?.(plan)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Selecionar Plano
          </button>
        </div>
      ))}
    </div>
  );
};

/**
 * PlanCard Component
 * Displays a single plan card
 * 
 * @param {Object} props
 * @param {Object} props.plan - Plan data
 * @param {boolean} props.highlighted - Whether to highlight this plan
 * @param {function} props.onSelect - Callback when selected
 * @returns {JSX.Element}
 */
export const PlanCard = ({ plan, highlighted = false, onSelect }) => {
  if (!plan) return null;

  return (
    <div
      style={{
        border: highlighted ? '3px solid #007bff' : '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: highlighted ? '#f0f8ff' : 'white',
      }}
    >
      {highlighted && (
        <div style={{ color: '#007bff', fontWeight: 'bold', marginBottom: '10px' }}>
          ⭐ Mais Popular
        </div>
      )}
      <h3>{plan.nome}</h3>
      <div style={{ fontSize: '28px', fontWeight: 'bold', margin: '15px 0' }}>
        {formatPrice(plan.preco)}
        {plan.ciclo && <span style={{ fontSize: '14px', color: '#666' }}>/{plan.ciclo}</span>}
      </div>
      {plan.descricao && <p>{plan.descricao}</p>}
      
      <button
        onClick={() => onSelect?.(plan)}
        style={{
          width: '100%',
          padding: '12px',
          marginTop: '15px',
          backgroundColor: highlighted ? '#007bff' : '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Escolher Plano
      </button>
    </div>
  );
};

// ============================================================
// EXPORT SUMMARY
// ============================================================

export default {
  // Core functions
  getPlans,
  getPlanById,
  getPlansSortedByPrice,
  getPlansByPriceRange,
  getCheapestPlan,
  getPremiumPlan,
  formatPrice,
  hasFeature,

  // React
  usePlans,
  usePlan,

  // Components
  PriceComparison,
  PlanCard,
};

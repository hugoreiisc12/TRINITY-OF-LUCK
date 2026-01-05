/**
 * TRINITY OF LUCK - Checkout Client Library
 * 
 * Handles Stripe checkout session creation and redirection
 * Provides JavaScript and React interfaces for subscription checkout
 * 
 * Usage:
 *   const response = await createCheckoutSession(planId);
 *   window.location.href = response.data.url;
 *   
 * React Hook:
 *   const { startCheckout, loading, error } = useCheckout();
 *   await startCheckout(planId);
 */

// ============================================================
// CONFIGURATION
// ============================================================

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const CHECKOUT_ENDPOINT = `${API_URL}/api/stripe/checkout`;

// ============================================================
// CORE FUNCTIONS
// ============================================================

/**
 * Create a Stripe checkout session and get the URL
 * 
 * @param {string} planId - Plan UUID
 * @returns {Promise<{success: boolean, data: {sessionId, url, planName, planPrice}, timestamp: string}>}
 * 
 * @example
 * const response = await createCheckoutSession('plan-uuid');
 * if (response.success) {
 *   window.location.href = response.data.url;
 * }
 */
export const createCheckoutSession = async (planId) => {
  try {
    if (!planId) {
      throw new Error('Plan ID is required');
    }

    console.log(`💳 Creating checkout session for plan: ${planId}`);

    const response = await fetch(CHECKOUT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        planId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error || 'Failed to create checkout session');
      error.status = response.status;
      error.details = data.details;
      throw error;
    }

    console.log(`✅ Checkout session created:`, data.data.sessionId);
    return data;

  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    throw error;
  }
};

/**
 * Start checkout and redirect to Stripe
 * 
 * @param {string} planId - Plan UUID
 * @returns {Promise<void>}
 * 
 * @example
 * try {
 *   await startCheckout(planId);
 *   // User will be redirected to Stripe checkout
 * } catch (error) {
 *   console.error('Checkout failed:', error.message);
 * }
 */
export const startCheckout = async (planId) => {
  try {
    const response = await createCheckoutSession(planId);

    if (!response.data?.url) {
      throw new Error('No checkout URL received from server');
    }

    // Redirect to Stripe checkout
    window.location.href = response.data.url;

  } catch (error) {
    console.error('❌ Checkout error:', error);
    throw error;
  }
};

/**
 * Get checkout status from session ID
 * 
 * @param {string} sessionId - Stripe session ID
 * @returns {Promise<Object>}
 * 
 * @example
 * const status = await getCheckoutStatus(sessionId);
 */
export const getCheckoutStatus = async (sessionId) => {
  try {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    // This would typically call a backend endpoint to retrieve session status
    // For now, return a template response
    console.log(`📊 Getting status for session: ${sessionId}`);

    return {
      success: true,
      data: {
        sessionId,
        status: 'pending', // 'pending', 'completed', 'expired'
      },
    };

  } catch (error) {
    console.error('❌ Error getting checkout status:', error);
    throw error;
  }
};

/**
 * Validate plan before checkout
 * 
 * @param {string} planId - Plan UUID
 * @returns {Promise<boolean>}
 * 
 * @example
 * const isValid = await validatePlan('plan-uuid');
 */
export const validatePlan = async (planId) => {
  try {
    if (!planId) {
      throw new Error('Plan ID is required');
    }

    // Call getPlan from client-plans
    const response = await fetch(`${API_URL}/api/plans`);
    const plansData = await response.json();

    const plan = plansData.data?.find(p => p.id === planId);

    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    console.log(`✅ Plan validated: ${plan.nome}`);
    return true;

  } catch (error) {
    console.error('❌ Plan validation error:', error);
    return false;
  }
};

// ============================================================
// REACT HOOKS
// ============================================================

/**
 * React Hook for checkout
 * Manages loading, error, and checkout states
 * 
 * @returns {{
 *   startCheckout: function,
 *   loading: boolean,
 *   error: string|null,
 *   success: boolean,
 *   sessionId: string|null,
 *   reset: function
 * }}
 * 
 * @example
 * export function SubscriptionButton({ planId }) {
 *   const { startCheckout, loading, error } = useCheckout();
 *   
 *   const handleClick = async () => {
 *     try {
 *       await startCheckout(planId);
 *     } catch (err) {
 *       console.error('Checkout failed:', err);
 *     }
 *   };
 *   
 *   return (
 *     <button onClick={handleClick} disabled={loading}>
 *       {loading ? 'Processando...' : 'Assinar'}
 *     </button>
 *   );
 * }
 */
export const useCheckout = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(false);
  const [sessionId, setSessionId] = React.useState(null);

  const handleStartCheckout = React.useCallback(async (planId) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await createCheckoutSession(planId);
      setSessionId(response.data.sessionId);
      setSuccess(true);

      // Redirect to Stripe checkout
      if (response.data?.url) {
        window.location.href = response.data.url;
      }

      return response;

    } catch (err) {
      const errorMessage = err.message || 'Failed to create checkout session';
      setError(errorMessage);
      setSuccess(false);
      throw err;

    } finally {
      setLoading(false);
    }
  }, []);

  const reset = React.useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
    setSessionId(null);
  }, []);

  return {
    startCheckout: handleStartCheckout,
    loading,
    error,
    success,
    sessionId,
    reset,
  };
};

/**
 * Hook to handle checkout success/cancel pages
 * 
 * @returns {{
 *   sessionId: string|null,
 *   status: 'success'|'cancel'|'unknown',
 *   loading: boolean
 * }}
 * 
 * @example
 * export function CheckoutSuccess() {
 *   const { sessionId, status, loading } = useCheckoutResult();
 *   
 *   if (loading) return <p>Verificando...</p>;
 *   if (status === 'success') return <p>Assinatura criada!</p>;
 *   return <p>Checkout cancelado</p>;
 * }
 */
export const useCheckoutResult = () => {
  const [sessionId, setSessionId] = React.useState(null);
  const [status, setStatus] = React.useState('unknown');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Get session ID from URL params
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session_id');

    if (session) {
      setSessionId(session);
      setStatus('success');
    } else if (window.location.pathname.includes('cancel')) {
      setStatus('cancel');
    }

    setLoading(false);
  }, []);

  return {
    sessionId,
    status,
    loading,
  };
};

// ============================================================
// REACT COMPONENTS
// ============================================================

/**
 * SubscribeButton Component
 * Button to initiate subscription checkout
 * 
 * @param {Object} props
 * @param {string} props.planId - Plan UUID
 * @param {string} props.planName - Plan name for display
 * @param {number} props.planPrice - Plan price for display
 * @param {function} props.onError - Error callback
 * @param {string} props.className - CSS class
 * @returns {JSX.Element}
 * 
 * @example
 * <SubscribeButton 
 *   planId="plan-uuid"
 *   planName="Premium"
 *   planPrice={99.90}
 * />
 */
export const SubscribeButton = ({
  planId,
  planName = 'Plan',
  planPrice,
  onError,
  className = '',
}) => {
  const { startCheckout, loading, error } = useCheckout();

  const handleClick = async () => {
    try {
      await startCheckout(planId);
    } catch (err) {
      if (onError) onError(err);
    }
  };

  return (
    <div className={`subscribe-button-container ${className}`}>
      <button
        onClick={handleClick}
        disabled={loading || !planId}
        style={{
          padding: '12px 24px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '100%',
        }}
      >
        {loading ? (
          <>
            <span style={{ marginRight: '8px' }}>⏳</span>
            Processando...
          </>
        ) : (
          <>
            <span style={{ marginRight: '8px' }}>💳</span>
            Assinar Agora
          </>
        )}
      </button>

      {error && (
        <div
          style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c33',
            fontSize: '14px',
          }}
        >
          ❌ {error}
        </div>
      )}

      {planPrice && (
        <div
          style={{
            marginTop: '10px',
            fontSize: '12px',
            color: '#666',
            textAlign: 'center',
          }}
        >
          R$ {planPrice.toFixed(2)}/mês
        </div>
      )}
    </div>
  );
};

/**
 * CheckoutSuccess Component
 * Displays checkout success page
 * 
 * @param {Object} props
 * @param {function} props.onContinue - Callback when user continues
 * @returns {JSX.Element}
 */
export const CheckoutSuccess = ({ onContinue }) => {
  const { sessionId, loading } = useCheckoutResult();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Verificando...</div>;
  }

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '40px',
        borderRadius: '8px',
        backgroundColor: '#f0fff4',
        border: '2px solid #48bb78',
      }}
    >
      <h2 style={{ color: '#22543d', marginBottom: '10px' }}>
        ✅ Assinatura Criada com Sucesso!
      </h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Sua assinatura foi processada e está ativa.
      </p>
      {sessionId && (
        <p style={{ fontSize: '12px', color: '#999' }}>
          ID da Sessão: {sessionId}
        </p>
      )}
      <button
        onClick={onContinue}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#48bb78',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Continuar
      </button>
    </div>
  );
};

/**
 * CheckoutCancel Component
 * Displays checkout cancel page
 * 
 * @param {Object} props
 * @param {function} props.onRetry - Callback to retry checkout
 * @returns {JSX.Element}
 */
export const CheckoutCancel = ({ onRetry }) => {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '40px',
        borderRadius: '8px',
        backgroundColor: '#fff5f5',
        border: '2px solid #f56565',
      }}
    >
      <h2 style={{ color: '#742a2a', marginBottom: '10px' }}>
        ❌ Checkout Cancelado
      </h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Você cancelou o processo de checkout. Nenhuma cobrança foi realizada.
      </p>
      <button
        onClick={onRetry}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#f56565',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Tentar Novamente
      </button>
    </div>
  );
};

// ============================================================
// EXPORT SUMMARY
// ============================================================

export default {
  // Core functions
  createCheckoutSession,
  startCheckout,
  getCheckoutStatus,
  validatePlan,

  // React hooks
  useCheckout,
  useCheckoutResult,

  // Components
  SubscribeButton,
  CheckoutSuccess,
  CheckoutCancel,
};

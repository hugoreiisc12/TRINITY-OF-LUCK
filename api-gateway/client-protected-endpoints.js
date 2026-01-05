/**
 * TRINITY OF LUCK - Protected Endpoints Client Example
 * 
 * Este arquivo demonstra como usar os endpoints protegidos com autenticação JWT
 * e como integrar com Stripe para pagamentos.
 */

// ============================================================
// CONFIGURAÇÃO BASE
// ============================================================

const API_BASE_URL = 'http://localhost:3001';
const STRIPE_PUBLIC_KEY = 'pk_test_your_stripe_publishable_key'; // From .env

/**
 * Armazena o JWT token após autenticação
 * Em produção, usar HttpOnly cookies ou secure storage
 */
let authToken = null;

// ============================================================
// AUTENTICAÇÃO
// ============================================================

/**
 * Login do usuário com Supabase
 * Retorna um JWT token que será usado em requisições protegidas
 */
async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success && data.token) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      console.log('✅ Usuário autenticado:', email);
      return data;
    } else {
      throw new Error(data.error || 'Login failed');
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    throw error;
  }
}

/**
 * Restaura token do localStorage (se disponível)
 */
function restoreAuthToken() {
  authToken = localStorage.getItem('authToken');
  if (authToken) {
    console.log('✅ Token restaurado do localStorage');
  }
  return authToken;
}

/**
 * Logout - remove o token
 */
function logoutUser() {
  authToken = null;
  localStorage.removeItem('authToken');
  console.log('✅ Usuário desconectado');
}

// ============================================================
// REQUISIÇÕES COM AUTENTICAÇÃO
// ============================================================

/**
 * Realiza uma requisição autenticada com JWT token
 */
async function authenticatedRequest(endpoint, options = {}) {
  if (!authToken) {
    throw new Error('No authentication token available. Please login first.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expirou
        logoutUser();
        throw new Error('Session expired. Please login again.');
      }
      throw new Error(data.error || `Request failed: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`Error on ${endpoint}:`, error);
    throw error;
  }
}

// ============================================================
// ENDPOINTS - AUTENTICAÇÃO
// ============================================================

/**
 * GET /api/auth/me
 * Obtém o perfil do usuário autenticado
 */
async function getUserProfile() {
  console.log('📋 Fetching user profile...');
  const data = await authenticatedRequest('/api/auth/me');
  console.log('✅ User profile:', data.user);
  return data.user;
}

/**
 * PUT /api/auth/profile
 * Atualiza o perfil do usuário
 */
async function updateUserProfile(perfil) {
  console.log('📝 Updating user profile...');
  const data = await authenticatedRequest('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify({ perfil }),
  });
  console.log('✅ Profile updated:', data.user);
  return data.user;
}

/**
 * GET /api/auth/subscriptions
 * Obtém todas as assinaturas do usuário
 */
async function getUserSubscriptions() {
  console.log('📊 Fetching subscriptions...');
  const data = await authenticatedRequest('/api/auth/subscriptions');
  console.log('✅ Subscriptions:', data.subscriptions);
  return data.subscriptions;
}

/**
 * GET /api/auth/analyses
 * Obtém todas as análises do usuário
 */
async function getUserAnalyses() {
  console.log('📊 Fetching analyses...');
  const data = await authenticatedRequest('/api/auth/analyses');
  console.log(`✅ Found ${data.total} analyses`);
  return data.analyses;
}

// ============================================================
// ENDPOINTS - STRIPE
// ============================================================

/**
 * POST /api/stripe/checkout
 * Cria uma sessão de checkout no Stripe
 */
async function createCheckoutSession(planId) {
  console.log('💳 Creating Stripe checkout session...');

  const successUrl = `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${window.location.origin}/cancel`;

  const data = await authenticatedRequest('/api/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify({
      planId,
      successUrl,
      cancelUrl,
    }),
  });

  if (data.sessionId) {
    console.log('✅ Checkout session created:', data.sessionId);
    // Redireciona para Stripe Checkout
    redirectToCheckout(data.sessionId);
  } else {
    console.warn('⚠️ Checkout session not ready:', data.note);
  }

  return data;
}

// ============================================================
// ENDPOINTS - CONTEXT IMPORT
// ============================================================

/**
 * POST /api/import-context
 * Importa dados de contexto de uma URL externa
 */
async function importContext(url) {
  console.log('📥 Importing context from URL:', url);

  if (!url || typeof url !== 'string') {
    throw new Error('URL must be a non-empty string');
  }

  // Validate URL format
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'https:') {
      throw new Error('Only HTTPS URLs are allowed');
    }
  } catch (err) {
    throw new Error(`Invalid URL: ${err.message}`);
  }

  const data = await authenticatedRequest('/api/import-context', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });

  if (data.success) {
    console.log('✅ Context imported:', data.context);
    return data.context;
  } else {
    throw new Error(data.error || 'Failed to import context');
  }
}

/**
 * Import context from Polymarket
 */
async function importPolymarketContext() {
  console.log('📥 Importing Polymarket context...');
  return importContext('https://polymarket.com/markets');
}

/**
 * Import context from ESPN
 */
async function importESPNContext() {
  console.log('📥 Importing ESPN context...');
  return importContext('https://www.espn.com/nfl/schedule');
}

/**
 * Import context from Weather
 */
async function importWeatherContext() {
  console.log('📥 Importing Weather context...');
  return importContext('https://weather.com');
}

/**
 * Import context from custom URL (with validation)
 */
async function importCustomContext(url) {
  const allowedDomains = [
    'polymarket.com',
    'espn.com',
    'sports.espn.go.com',
    'weather.com',
    'news.ycombinator.com',
    'reddit.com',
    'twitter.com',
    'x.com',
    'wikipedia.org',
  ];

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    const isAllowed = allowedDomains.some(domain =>
      hostname === domain || hostname.endsWith('.' + domain)
    );

    if (!isAllowed) {
      throw new Error(
        `Domain not allowed. Allowed domains: ${allowedDomains.join(', ')}`
      );
    }

    return importContext(url);
  } catch (err) {
    console.error('❌ Invalid context URL:', err);
    throw err;
  }
}

/**
 *
 * Redireciona para Stripe Checkout (requer Stripe.js)
 */
async function redirectToCheckout(sessionId) {
  const stripe = Stripe(STRIPE_PUBLIC_KEY);
  const result = await stripe.redirectToCheckout({ sessionId });

  if (result.error) {
    console.error('❌ Stripe error:', result.error.message);
  }
}

// ============================================================
// WORKFLOW EXAMPLES
// ============================================================

/**
 * Exemplo 1: Autenticar e obter perfil
 */
async function exampleGetProfile() {
  try {
    console.log('\n=== EXEMPLO 1: Obter Perfil ===\n');

    // Simulando login (em produção, seria via Supabase)
    authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

    const profile = await getUserProfile();
    console.log('Nome:', profile.perfil?.nome);
    console.log('Email:', profile.email);
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

/**
 * Exemplo 2: Atualizar perfil
 */
async function exampleUpdateProfile() {
  try {
    console.log('\n=== EXEMPLO 2: Atualizar Perfil ===\n');

    const updatedUser = await updateUserProfile({
      nome: 'New Name',
      avatar: 'https://example.com/avatar.jpg',
      telefone: '+55 11 98765-4321',
    });

    console.log('Perfil atualizado:', updatedUser.perfil);
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

/**
 * Exemplo 3: Ver assinaturas ativas
 */
async function exampleViewSubscriptions() {
  try {
    console.log('\n=== EXEMPLO 3: Ver Assinaturas ===\n');

    const subscriptions = await getUserSubscriptions();

    subscriptions.forEach((sub) => {
      console.log(`📦 ${sub.planos.nome}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Renovação: ${sub.data_fim}`);
    });
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

/**
 * Exemplo 4: Ver histórico de análises
 */
async function exampleViewAnalyses() {
  try {
    console.log('\n=== EXEMPLO 4: Ver Análises ===\n');

    const analyses = await getUserAnalyses();

    analyses.forEach((analysis) => {
      console.log(`📊 Análise ${analysis.id}`);
      console.log(`   Probabilidade: ${analysis.resultado?.probabilidade}%`);
      console.log(`   Data: ${new Date(analysis.created_at).toLocaleDateString()}`);
    });
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

/**
 * Exemplo 5: Realizar checkout de assinatura
 */
async function exampleCheckout() {
  try {
    console.log('\n=== EXEMPLO 5: Checkout de Assinatura ===\n');

    const planId = 'plan-uuid-here';
    await createCheckoutSession(planId);
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

// ============================================================
// INTEGRAÇÃO COM FRONTEND REACT
// ============================================================

/**
 * Hook para usar nos componentes React
 * 
 * Exemplo de uso:
 * const { user, loading, error, updateProfile } = useAuth();
 */
function useAuthAPI() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Restaurar token ao montar
  React.useEffect(() => {
    restoreAuthToken();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profile = await getUserProfile();
      setUser(profile);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (perfil) => {
    try {
      setLoading(true);
      const updated = await updateUserProfile(perfil);
      setUser(updated);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    fetchProfile,
    updateProfile,
    login: loginUser,
    logout: logoutUser,
  };
}

// ============================================================
// EXPORTS
// ============================================================

export {
  loginUser,
  logoutUser,
  restoreAuthToken,
  authenticatedRequest,
  getUserProfile,
  updateUserProfile,
  getUserSubscriptions,
  getUserAnalyses,
  createCheckoutSession,
  importContext,
  importPolymarketContext,
  importESPNContext,
  importWeatherContext,
  importCustomContext,
  useAuthAPI,
  exampleGetProfile,
  exampleUpdateProfile,
  exampleViewSubscriptions,
  exampleViewAnalyses,
  exampleCheckout,
};

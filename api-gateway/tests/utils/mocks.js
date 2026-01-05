/**
 * Test Utilities and Mocks
 * Funções auxiliares e mocks para testes
 */

/**
 * Mock Axios para simular requisições HTTP
 */
export const createMockAxios = () => {
  return {
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    patch: jest.fn().mockResolvedValue({ data: {} }),
    request: jest.fn().mockResolvedValue({ data: {} }),
    create: jest.fn().mockReturnThis(),
  };
};

/**
 * Mock Supabase Client
 */
export const createMockSupabaseClient = () => {
  return {
    auth: {
      signUp: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' }, session: { access_token: 'test-token' } },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      }),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
    update: jest.fn().mockResolvedValue({ data: {}, error: null }),
    delete: jest.fn().mockResolvedValue({ data: null, error: null }),
    eq: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: {}, error: null }),
  };
};

/**
 * Mock Redis Client
 */
export const createMockRedisClient = () => {
  const store = new Map();
  
  return {
    get: jest.fn(async (key) => store.get(key) || null),
    set: jest.fn(async (key, value) => {
      store.set(key, value);
      return 'OK';
    }),
    del: jest.fn(async (key) => {
      const existed = store.has(key);
      store.delete(key);
      return existed ? 1 : 0;
    }),
    exists: jest.fn(async (key) => store.has(key) ? 1 : 0),
    keys: jest.fn(async (pattern) => Array.from(store.keys())),
    flushdb: jest.fn(async () => {
      store.clear();
      return 'OK';
    }),
    expire: jest.fn(async () => 1),
    ttl: jest.fn(async () => -1),
    incr: jest.fn(async (key) => {
      const current = parseInt(store.get(key) || '0') + 1;
      store.set(key, current.toString());
      return current;
    }),
    lpush: jest.fn(async (key, value) => {
      const list = store.get(key) || [];
      list.push(value);
      store.set(key, list);
      return list.length;
    }),
    lpop: jest.fn(async (key) => {
      const list = store.get(key) || [];
      return list.shift() || null;
    }),
    quit: jest.fn(async () => 'OK'),
  };
};

/**
 * Mock Bull Queue
 */
export const createMockQueue = (name) => {
  const jobs = new Map();
  
  return {
    name,
    add: jest.fn(async (data, options = {}) => {
      const jobId = `job-${Date.now()}-${Math.random()}`;
      const job = {
        id: jobId,
        data,
        progress: 0,
        state: jest.fn().mockResolvedValue('waiting'),
        remove: jest.fn(),
        retry: jest.fn(),
      };
      jobs.set(jobId, job);
      return job;
    }),
    process: jest.fn(),
    on: jest.fn().mockReturnThis(),
    off: jest.fn().mockReturnThis(),
    getJob: jest.fn(async (jobId) => jobs.get(jobId) || null),
    getJobCounts: jest.fn().mockResolvedValue({
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      waiting: 0,
    }),
    clean: jest.fn().mockResolvedValue([]),
    close: jest.fn(),
    empty: jest.fn().mockResolvedValue(null),
    pause: jest.fn(),
    resume: jest.fn(),
  };
};

/**
 * Criar token JWT de teste
 */
export const createTestJWT = (userId = 'test-user-123', email = 'test@example.com') => {
  // Simulação simples de JWT (não usar em produção)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString('base64');
  const signature = Buffer.from('test-signature').toString('base64');
  
  return `${header}.${payload}.${signature}`;
};

/**
 * Criar requisição mock para Express
 */
export const createMockRequest = (options = {}) => {
  return {
    method: options.method || 'GET',
    url: options.url || '/',
    path: options.path || '/',
    headers: options.headers || { 'content-type': 'application/json' },
    body: options.body || {},
    query: options.query || {},
    params: options.params || {},
    cookies: options.cookies || {},
    user: options.user || { id: 'test-user-123', email: 'test@example.com' },
    get: jest.fn((header) => options.headers?.[header] || ''),
    set: jest.fn(),
  };
};

/**
 * Criar resposta mock para Express
 */
export const createMockResponse = () => {
  const response = {
    statusCode: 200,
    data: null,
    headers: {},
    status: jest.fn(function(code) {
      this.statusCode = code;
      return this;
    }),
    json: jest.fn(function(data) {
      this.data = data;
      return this;
    }),
    send: jest.fn(function(data) {
      this.data = data;
      return this;
    }),
    set: jest.fn(function(header, value) {
      this.headers[header] = value;
      return this;
    }),
    get: jest.fn((header) => response.headers[header] || ''),
    end: jest.fn(),
  };
  return response;
};

/**
 * Criar próximo middleware mock
 */
export const createMockNext = () => {
  return jest.fn();
};

/**
 * Aguardar um período de tempo
 */
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Simular resposta de análise de contexto
 */
export const createMockAnalysisResult = (overrides = {}) => {
  return {
    id: `analysis-${Date.now()}`,
    status: 'completed',
    contextType: 'csv',
    filename: 'test-data.csv',
    uploadedAt: new Date().toISOString(),
    analysis: {
      rowCount: 1000,
      columnCount: 10,
      missingValues: 50,
      statistics: {
        mean: 100.5,
        median: 95.0,
        stdDev: 15.3,
      },
    },
    predictions: {
      probability: 0.75,
      confidence: 0.82,
      factors: [
        { factor: 'seasonality', impact: 0.35 },
        { factor: 'market_trend', impact: 0.28 },
      ],
    },
    ...overrides,
  };
};

/**
 * Simular resposta de retreinamento
 */
export const createMockRetrainingResult = (overrides = {}) => {
  return {
    jobId: `job-${Date.now()}`,
    status: 'completed',
    startedAt: new Date(Date.now() - 60000).toISOString(),
    completedAt: new Date().toISOString(),
    metrics: {
      accuracy: 0.92,
      precision: 0.89,
      recall: 0.91,
      f1Score: 0.90,
    },
    samplesProcessed: 5000,
    errors: [],
    ...overrides,
  };
};

/**
 * Comparar objetos ignorando timestamps
 */
export const compareObjectsIgnoreTimestamps = (obj1, obj2, ignoreFields = []) => {
  const fieldsToIgnore = ['createdAt', 'updatedAt', 'timestamp', 'id', ...ignoreFields];
  
  const clean = (obj) => {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!fieldsToIgnore.includes(key)) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  };
  
  return JSON.stringify(clean(obj1)) === JSON.stringify(clean(obj2));
};

/**
 * Mock de dados de exemplo para testes
 */
export const MOCK_DATA = {
  users: [
    {
      id: 'user-1',
      email: 'admin@example.com',
      role: 'admin',
      subscription: 'premium',
    },
    {
      id: 'user-2',
      email: 'user@example.com',
      role: 'user',
      subscription: 'free',
    },
  ],
  contexts: [
    {
      id: 'context-1',
      userId: 'user-1',
      filename: 'historical-data.csv',
      format: 'csv',
      size: 2048000,
      rows: 1000,
      columns: 15,
    },
  ],
  analyses: [
    {
      id: 'analysis-1',
      contextId: 'context-1',
      status: 'completed',
      probability: 0.75,
      confidence: 0.82,
    },
  ],
};

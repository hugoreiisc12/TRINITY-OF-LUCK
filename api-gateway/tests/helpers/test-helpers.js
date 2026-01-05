/**
 * Test Helper Utilities
 * Utilitários para facilitar testes
 */

/**
 * Aguardar um valor específico em um observable/promise
 */
export async function waitFor(condition, options = {}) {
  const { timeout = 5000, interval = 100 } = options;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const checkCondition = () => {
      if (condition()) {
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for condition after ${timeout}ms`));
      } else {
        setTimeout(checkCondition, interval);
      }
    };

    checkCondition();
  });
}

/**
 * Criar seed data para testes
 */
export function seedTestData() {
  return {
    users: [
      {
        id: 'user-1',
        email: 'admin@trinity.local',
        password: 'AdminPassword123!',
        role: 'admin',
        subscription: 'premium',
      },
      {
        id: 'user-2',
        email: 'user@trinity.local',
        password: 'UserPassword123!',
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
        uploadedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'context-2',
        userId: 'user-2',
        filename: 'weekly-results.json',
        format: 'json',
        size: 512000,
        rows: 500,
        columns: 8,
        uploadedAt: '2024-01-02T00:00:00Z',
      },
    ],
    analyses: [
      {
        id: 'analysis-1',
        contextId: 'context-1',
        userId: 'user-1',
        status: 'completed',
        probability: 0.75,
        confidence: 0.82,
        factors: [
          { name: 'seasonality', impact: 0.35 },
          { name: 'market_trend', impact: 0.28 },
        ],
        completedAt: '2024-01-01T12:00:00Z',
      },
    ],
  };
}

/**
 * Comparar dois objetos JSON ignorando campos específicos
 */
export function compareJSON(obj1, obj2, ignoreFields = ['id', 'createdAt', 'updatedAt']) {
  const clean = (obj) => {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!ignoreFields.includes(key)) {
        if (typeof value === 'object' && value !== null) {
          result[key] = clean(value);
        } else {
          result[key] = value;
        }
      }
    }
    return result;
  };

  return JSON.stringify(clean(obj1)) === JSON.stringify(clean(obj2));
}

/**
 * Criar dados de arquivo para testes
 */
export function createTestFile(type = 'csv', rowCount = 10) {
  if (type === 'csv') {
    const headers = ['date', 'platform', 'odds', 'result'];
    const rows = [];

    for (let i = 0; i < rowCount; i++) {
      const date = new Date(2024, 0, i + 1).toISOString().split('T')[0];
      const platforms = ['betano', 'bet365', 'draftkings'];
      const platform = platforms[i % platforms.length];
      const odds = (1.5 + Math.random() * 2).toFixed(2);
      const result = Math.random() > 0.5 ? 'win' : 'loss';

      rows.push(`${date},${platform},${odds},${result}`);
    }

    return {
      filename: 'test-data.csv',
      content: [headers.join(','), ...rows].join('\n'),
      format: 'csv',
      size: rows.join('\n').length,
    };
  }

  if (type === 'json') {
    const data = [];
    for (let i = 0; i < rowCount; i++) {
      data.push({
        id: i + 1,
        date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
        platform: ['betano', 'bet365', 'draftkings'][i % 3],
        odds: 1.5 + Math.random() * 2,
        result: Math.random() > 0.5 ? 'win' : 'loss',
      });
    }

    const content = JSON.stringify(data, null, 2);
    return {
      filename: 'test-data.json',
      content,
      format: 'json',
      size: content.length,
    };
  }

  throw new Error(`Unsupported file type: ${type}`);
}

/**
 * Validar estrutura de resposta API
 */
export function validateAPIResponse(response, schema) {
  const validate = (obj, schema) => {
    for (const [key, type] of Object.entries(schema)) {
      if (!(key in obj)) {
        throw new Error(`Missing required field: ${key}`);
      }

      if (type === 'string' && typeof obj[key] !== 'string') {
        throw new Error(`Field ${key} should be string, got ${typeof obj[key]}`);
      }

      if (type === 'number' && typeof obj[key] !== 'number') {
        throw new Error(`Field ${key} should be number, got ${typeof obj[key]}`);
      }

      if (type === 'boolean' && typeof obj[key] !== 'boolean') {
        throw new Error(`Field ${key} should be boolean, got ${typeof obj[key]}`);
      }

      if (type === 'array' && !Array.isArray(obj[key])) {
        throw new Error(`Field ${key} should be array, got ${typeof obj[key]}`);
      }

      if (typeof type === 'object' && type !== null) {
        validate(obj[key], type);
      }
    }
  };

  try {
    validate(response, schema);
    return true;
  } catch (error) {
    throw new Error(`Response validation failed: ${error.message}`);
  }
}

/**
 * Schemas para validação de resposta
 */
export const API_SCHEMAS = {
  user: {
    id: 'string',
    email: 'string',
    name: 'string',
    subscription: 'string',
  },
  context: {
    id: 'string',
    filename: 'string',
    format: 'string',
    size: 'number',
    rows: 'number',
    columns: 'number',
    uploadedAt: 'string',
  },
  analysis: {
    id: 'string',
    contextId: 'string',
    status: 'string',
    probability: 'number',
    confidence: 'number',
    predictions: {
      probability: 'number',
      confidence: 'number',
    },
  },
  job: {
    id: 'string',
    status: 'string',
    progress: 'number',
    createdAt: 'string',
  },
  error: {
    error: 'string',
    code: 'string',
    details: 'string',
  },
};

/**
 * Gerar relatório de testes
 */
export function generateTestReport(results) {
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const duration = results.reduce((sum, r) => sum + r.duration, 0);

  return {
    summary: {
      total: results.length,
      passed,
      failed,
      success_rate: ((passed / results.length) * 100).toFixed(2) + '%',
      duration_ms: duration,
    },
    details: results,
  };
}

/**
 * Simular delay realista
 */
export async function simulateNetworkDelay(min = 100, max = 500) {
  const delay = min + Math.random() * (max - min);
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Extrair erros de resposta
 */
export function extractErrors(response) {
  if (!response) return [];

  const errors = [];

  if (response.error) {
    errors.push(response.error);
  }

  if (response.errors && Array.isArray(response.errors)) {
    errors.push(...response.errors);
  }

  if (response.validation_errors) {
    errors.push(...Object.values(response.validation_errors).flat());
  }

  return errors;
}

/**
 * Retry helper para operações flaky
 */
export async function retry(fn, options = {}) {
  const { maxAttempts = 3, delay = 1000, backoff = 2 } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        const waitTime = delay * Math.pow(backoff, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new Error(`Failed after ${maxAttempts} attempts: ${lastError.message}`);
}

export default {
  waitFor,
  seedTestData,
  compareJSON,
  createTestFile,
  validateAPIResponse,
  API_SCHEMAS,
  generateTestReport,
  simulateNetworkDelay,
  extractErrors,
  retry,
};

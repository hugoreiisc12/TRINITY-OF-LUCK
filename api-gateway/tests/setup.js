/**
 * Jest Setup File
 * Configuração global para testes
 */

// Configurar variáveis de ambiente de teste
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key-123456';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_123456';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.REDIS_PASSWORD = '';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/trinity_test';

// Aumentar timeout para testes de integração
jest.setTimeout(30000);

// Mock de console para testes
global.consoleLogs = [];
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = jest.fn((...args) => {
  global.consoleLogs.push({ level: 'log', args });
  originalLog(...args);
});

console.error = jest.fn((...args) => {
  global.consoleLogs.push({ level: 'error', args });
  originalError(...args);
});

console.warn = jest.fn((...args) => {
  global.consoleLogs.push({ level: 'warn', args });
  originalWarn(...args);
});

// Limpar mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
  global.consoleLogs = [];
});

// Configurar timeout global
beforeAll(() => {
  jest.setTimeout(30000);
});

// Mock de módulos globais
jest.mock('axios');
jest.mock('@supabase/supabase-js');

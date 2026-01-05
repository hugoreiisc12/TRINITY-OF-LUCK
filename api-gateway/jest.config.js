/**
 * Jest Configuration for Trinity of Luck API Gateway
 * Configuração para testes unitários, integração e E2E
 */

export default {
  testEnvironment: 'node',
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    'server.js',
    'queue.js',
    'logging.js',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js',
  ],
  transform: {},
  testTimeout: 30000,
  verbose: true,
  bail: false,
  maxWorkers: '50%',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  extensionsToTreatAsEsm: ['.js'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};

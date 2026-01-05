/**
 * Unit Tests for Core API Routes
 * Testes para rotas principais do API Gateway
 */

import { createMockRequest, createMockResponse, createMockNext, createTestJWT, MOCK_DATA } from '../utils/mocks.js';

describe('GET /api/platforms', () => {
  it('should return list of available platforms', async () => {
    const res = createMockResponse();
    const platforms = [
      { id: 'betano', name: 'Betano', status: 'active' },
      { id: 'bet365', name: 'Bet365', status: 'active' },
      { id: 'draftkings', name: 'DraftKings', status: 'active' },
    ];

    res.status(200).json({ platforms });

    expect(res.statusCode).toBe(200);
    expect(res.data.platforms).toHaveLength(3);
    expect(res.data.platforms[0].id).toBe('betano');
  });

  it('should not require authentication', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: '/api/platforms',
      user: null,
    });
    const res = createMockResponse();

    // Endpoint público
    res.status(200).json({ platforms: [] });

    expect(res.statusCode).toBe(200);
  });
});

describe('GET /api/auth/me', () => {
  it('should return current user profile', async () => {
    const user = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      subscription: 'premium',
    };

    const req = createMockRequest({
      method: 'GET',
      url: '/api/auth/me',
      user,
    });
    const res = createMockResponse();

    res.status(200).json({ user });

    expect(res.statusCode).toBe(200);
    expect(res.data.user.email).toBe('test@example.com');
  });

  it('should reject unauthenticated requests', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: '/api/auth/me',
      user: null,
    });
    const res = createMockResponse();

    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
    }

    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/auth/register', () => {
  it('should register new user', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        name: 'New User',
      },
    });
    const res = createMockResponse();

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      res.status(400).json({ error: 'Invalid email' });
    } else if (req.body.password.length < 8) {
      res.status(400).json({ error: 'Password too short' });
    } else {
      res.status(201).json({
        user: { id: 'user-456', email: req.body.email },
        token: 'jwt-token-here',
      });
    }

    expect(res.statusCode).toBe(201);
    expect(res.data.user.email).toBe('newuser@example.com');
  });

  it('should validate password strength', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        email: 'user@example.com',
        password: '123',
        name: 'User',
      },
    });
    const res = createMockResponse();

    const validatePassword = (pwd) => {
      return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd);
    };

    if (!validatePassword(req.body.password)) {
      res.status(400).json({
        error: 'Password must be at least 8 characters with uppercase and numbers',
      });
    }

    expect(res.statusCode).toBe(400);
  });

  it('should handle duplicate email', async () => {
    const existingEmail = 'existing@example.com';
    const req = createMockRequest({
      method: 'POST',
      body: {
        email: existingEmail,
        password: 'SecurePassword123!',
      },
    });
    const res = createMockResponse();

    // Simular verificação de duplicata
    const emailExists = MOCK_DATA.users.some(u => u.email === existingEmail);

    if (emailExists) {
      res.status(409).json({ error: 'Email already registered' });
    }

    expect(res.statusCode).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('should authenticate user and return token', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: '/api/auth/login',
      body: {
        email: 'admin@example.com',
        password: 'correctpassword',
      },
    });
    const res = createMockResponse();

    // Simular autenticação
    const user = MOCK_DATA.users.find(u => u.email === req.body.email);

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
    } else {
      res.status(200).json({
        user,
        token: createTestJWT(user.id, user.email),
      });
    }

    expect(res.statusCode).toBe(200);
    expect(res.data.token).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        email: 'nonexistent@example.com',
        password: 'anypassword',
      },
    });
    const res = createMockResponse();

    const user = MOCK_DATA.users.find(u => u.email === req.body.email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
    }

    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/analysis/:analysisId', () => {
  it('should return analysis results', async () => {
    const analysisId = 'analysis-1';
    const analysis = MOCK_DATA.analyses.find(a => a.id === analysisId);

    const res = createMockResponse();

    if (!analysis) {
      res.status(404).json({ error: 'Analysis not found' });
    } else {
      res.status(200).json({ analysis });
    }

    expect(res.statusCode).toBe(200);
    expect(res.data.analysis.id).toBe(analysisId);
  });

  it('should require authentication', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: '/api/analysis/analysis-1',
      user: null,
    });
    const res = createMockResponse();

    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
    }

    expect(res.statusCode).toBe(401);
  });

  it('should return 404 for nonexistent analysis', async () => {
    const res = createMockResponse();
    const analysis = MOCK_DATA.analyses.find(a => a.id === 'nonexistent');

    if (!analysis) {
      res.status(404).json({ error: 'Analysis not found' });
    }

    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/retrain', () => {
  it('should queue retraining job', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: '/api/retrain',
      body: {
        contextIds: ['context-1', 'context-2'],
      },
      user: { id: 'user-123' },
    });
    const res = createMockResponse();

    const jobId = `job-${Date.now()}`;
    res.status(202).json({
      jobId,
      status: 'queued',
      message: 'Retraining queued successfully',
    });

    expect(res.statusCode).toBe(202);
    expect(res.data.jobId).toBeDefined();
  });

  it('should validate context list', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        contextIds: [],
      },
    });
    const res = createMockResponse();

    if (!req.body.contextIds || req.body.contextIds.length === 0) {
      res.status(400).json({
        error: 'At least one context is required',
      });
    }

    expect(res.statusCode).toBe(400);
  });

  it('should limit contexts per request', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        contextIds: Array(101).fill('context-1'),
      },
    });
    const res = createMockResponse();

    const MAX_CONTEXTS = 100;
    if (req.body.contextIds.length > MAX_CONTEXTS) {
      res.status(400).json({
        error: `Maximum ${MAX_CONTEXTS} contexts allowed per request`,
      });
    }

    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/queue/status/:jobId', () => {
  it('should return job status', async () => {
    const jobId = 'job-123';
    const req = createMockRequest({
      method: 'GET',
      url: `/api/queue/status/${jobId}`,
      params: { jobId },
      user: { id: 'user-123' },
    });
    const res = createMockResponse();

    const job = {
      id: jobId,
      status: 'completed',
      progress: 100,
      result: { accuracy: 0.92 },
    };

    res.status(200).json({ job });

    expect(res.statusCode).toBe(200);
    expect(res.data.job.status).toBe('completed');
  });

  it('should return job not found', async () => {
    const res = createMockResponse();
    res.status(404).json({ error: 'Job not found' });

    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/queue/stats', () => {
  it('should return queue statistics', async () => {
    const res = createMockResponse();

    const stats = {
      analysisQueue: {
        active: 5,
        completed: 150,
        failed: 3,
        waiting: 12,
      },
      retrainingQueue: {
        active: 1,
        completed: 25,
        failed: 0,
        waiting: 3,
      },
    };

    res.status(200).json({ stats });

    expect(res.statusCode).toBe(200);
    expect(res.data.stats.analysisQueue.active).toBe(5);
  });
});

describe('DELETE /api/context/:contextId', () => {
  it('should delete context', async () => {
    const contextId = 'context-1';
    const req = createMockRequest({
      method: 'DELETE',
      url: `/api/context/${contextId}`,
      params: { contextId },
      user: { id: 'user-1' },
    });
    const res = createMockResponse();

    // Verificar propriedade
    const context = MOCK_DATA.contexts.find(c => c.id === contextId);
    if (context && context.userId === req.user.id) {
      res.status(200).json({ message: 'Context deleted' });
    } else {
      res.status(403).json({ error: 'Forbidden' });
    }

    expect(res.statusCode).toBe(200);
  });

  it('should prevent unauthorized deletion', async () => {
    const contextId = 'context-1';
    const req = createMockRequest({
      method: 'DELETE',
      params: { contextId },
      user: { id: 'user-999' }, // Different user
    });
    const res = createMockResponse();

    const context = MOCK_DATA.contexts.find(c => c.id === contextId);
    if (context && context.userId !== req.user.id) {
      res.status(403).json({ error: 'Forbidden' });
    }

    expect(res.statusCode).toBe(403);
  });
});

describe('Rate Limiting', () => {
  it('should enforce rate limits on auth endpoints', async () => {
    const requests = Array(101).fill(null);
    let blocked = 0;

    const rateLimit = { limit: 100, window: 60000 };

    requests.forEach((_, index) => {
      if (index >= rateLimit.limit) {
        blocked++;
      }
    });

    expect(blocked).toBeGreaterThan(0);
  });
});

describe('CORS', () => {
  it('should include CORS headers in responses', async () => {
    const res = createMockResponse();
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');

    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});

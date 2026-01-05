import request from 'supertest';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Use the app without starting the server
import * as serverModule from '../../server.js';

jest.mock('axios');
jest.mock('@supabase/supabase-js');

// Helper to set auth header
const authHeader = { Authorization: 'Bearer test-jwt-token' };

// Prepare Supabase mocks
const mockFrom = {
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockResolvedValue({ data: [{ id: 'ctx-1' }], error: null }),
};
const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'u@e.com' } }, error: null }),
  },
  from: jest.fn(() => mockFrom),
};

beforeAll(() => {
  // Make createClient return our mock for both public/admin clients
  createClient.mockReturnValue(mockSupabase);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/import-context', () => {
  test('rejects when missing auth', async () => {
    const res = await request(serverModule.app)
      .post('/api/import-context')
      .send({ url: 'https://polymarket.com/markets' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toMatch(/No authorization token/i);
  });

  test('rejects invalid URL', async () => {
    const res = await request(serverModule.app)
      .post('/api/import-context')
      .set(authHeader)
      .send({ url: 'notaurl' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid URL format/i);
  });

  test('rejects non-HTTPS', async () => {
    const res = await request(serverModule.app)
      .post('/api/import-context')
      .set(authHeader)
      .send({ url: 'http://polymarket.com/x' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid protocol/i);
  });

  test('rejects domain not allowed', async () => {
    const res = await request(serverModule.app)
      .post('/api/import-context')
      .set(authHeader)
      .send({ url: 'https://example.com' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Domain not allowed/i);
  });

  test('imports from allowed domain (polymarket) and stores context', async () => {
    axios.get.mockResolvedValueOnce({ data: '<html><head><title>Markets</title></head><body><article><h2>Event A</h2></article></body></html>' });

    const res = await request(serverModule.app)
      .post('/api/import-context')
      .set(authHeader)
      .send({ url: 'https://polymarket.com/markets' });

    expect(res.status).toBe(200);
    expect(axios.get).toHaveBeenCalled();
    expect(mockSupabase.from).toHaveBeenCalledWith('contextos');
    expect(mockFrom.insert).toHaveBeenCalled();
    expect(res.body.success).toBeTruthy();
    expect(res.body.context).toBeDefined();
    expect(res.body.context.events.length).toBeGreaterThan(0);
  });

  test('handles fetch failure gracefully', async () => {
    axios.get.mockRejectedValueOnce(new Error('timeout'));

    const res = await request(serverModule.app)
      .post('/api/import-context')
      .set(authHeader)
      .send({ url: 'https://polymarket.com/markets' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Failed to fetch URL content/i);
  });
});

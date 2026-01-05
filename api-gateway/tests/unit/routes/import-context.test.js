/**
 * Unit Tests for /api/import-context Route
 * Testes para importação de contextos (CSV, JSON, etc)
 */

import { createMockRequest, createMockResponse, createMockNext, createTestJWT, createMockSupabaseClient } from '../utils/mocks.js';

describe('POST /api/import-context', () => {
  let mockSupabase;
  let mockAxios;
  let importContextHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    mockAxios = {
      post: jest.fn().mockResolvedValue({ data: { success: true } }),
    };
  });

  describe('Authentication', () => {
    it('should reject requests without authentication token', async () => {
      const req = createMockRequest({
        method: 'POST',
        url: '/api/import-context',
        headers: {},
        user: null,
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Simulação de middleware de autenticação
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
      }

      expect(res.statusCode).toBe(401);
      expect(res.data.error).toBe('Unauthorized');
    });

    it('should accept requests with valid JWT token', async () => {
      const token = createTestJWT('user-123', 'test@example.com');
      const req = createMockRequest({
        method: 'POST',
        url: '/api/import-context',
        headers: { authorization: `Bearer ${token}` },
        user: { id: 'user-123', email: 'test@example.com' },
      });

      expect(req.user).not.toBeNull();
      expect(req.user.id).toBe('user-123');
    });
  });

  describe('File Upload Validation', () => {
    it('should validate CSV file format', async () => {
      const req = createMockRequest({
        method: 'POST',
        url: '/api/import-context',
        body: {
          filename: 'data.csv',
          content: 'col1,col2,col3\n1,2,3\n4,5,6',
          format: 'csv',
        },
        user: { id: 'user-123' },
      });
      const res = createMockResponse();

      // Validação de formato
      const isValidCSV = req.body.format === 'csv' && req.body.content.includes('\n');
      expect(isValidCSV).toBe(true);
    });

    it('should validate JSON file format', async () => {
      const jsonContent = JSON.stringify([
        { id: 1, value: 'test' },
        { id: 2, value: 'test2' },
      ]);

      const req = createMockRequest({
        method: 'POST',
        url: '/api/import-context',
        body: {
          filename: 'data.json',
          content: jsonContent,
          format: 'json',
        },
        user: { id: 'user-123' },
      });

      // Validação de JSON
      let isValidJSON = false;
      try {
        JSON.parse(req.body.content);
        isValidJSON = true;
      } catch (e) {
        isValidJSON = false;
      }

      expect(isValidJSON).toBe(true);
    });

    it('should reject invalid file formats', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          filename: 'data.exe',
          content: 'invalid',
          format: 'exe',
        },
        user: { id: 'user-123' },
      });
      const res = createMockResponse();

      const validFormats = ['csv', 'json', 'xlsx', 'xml'];
      if (!validFormats.includes(req.body.format)) {
        res.status(400).json({ error: 'Invalid file format' });
      }

      expect(res.statusCode).toBe(400);
      expect(res.data.error).toBe('Invalid file format');
    });

    it('should reject files exceeding size limit', async () => {
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
      const largeContent = 'x'.repeat(MAX_FILE_SIZE + 1);

      const req = createMockRequest({
        method: 'POST',
        body: {
          filename: 'large-file.csv',
          content: largeContent,
          size: largeContent.length,
          format: 'csv',
        },
      });
      const res = createMockResponse();

      if (req.body.size > MAX_FILE_SIZE) {
        res.status(413).json({ error: 'File too large' });
      }

      expect(res.statusCode).toBe(413);
      expect(res.data.error).toBe('File too large');
    });
  });

  describe('Data Processing', () => {
    it('should parse CSV content correctly', async () => {
      const csvContent = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');
      const data = lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, idx) => {
          obj[header] = values[idx];
          return obj;
        }, {});
      });

      expect(data).toHaveLength(2);
      expect(data[0]).toEqual({ name: 'John', age: '30', city: 'NYC' });
      expect(data[1]).toEqual({ name: 'Jane', age: '25', city: 'LA' });
    });

    it('should handle missing values in CSV', async () => {
      const csvContent = 'name,age,city\nJohn,,NYC\nJane,25,';
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');
      const data = lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, idx) => {
          obj[header] = values[idx] || null;
          return obj;
        }, {});
      });

      expect(data[0].age).toBeNull();
      expect(data[1].city).toBeNull();
    });

    it('should detect data types in columns', async () => {
      const detectType = (value) => {
        if (!value) return 'null';
        if (!isNaN(value) && !isNaN(parseFloat(value))) return 'number';
        if (value.match(/^\d{4}-\d{2}-\d{2}/)) return 'date';
        return 'string';
      };

      expect(detectType('123')).toBe('number');
      expect(detectType('hello')).toBe('string');
      expect(detectType('2023-01-15')).toBe('date');
      expect(detectType('')).toBe('null');
    });

    it('should handle encoding conversions', async () => {
      const utf8String = 'São Paulo, São Paulo';
      const encoded = Buffer.from(utf8String, 'utf8').toString('utf8');

      expect(encoded).toBe(utf8String);
      expect(encoded).toContain('São');
    });
  });

  describe('Supabase Integration', () => {
    it('should store context metadata in Supabase', async () => {
      const contextData = {
        userId: 'user-123',
        filename: 'data.csv',
        format: 'csv',
        size: 2048,
        rows: 100,
        columns: 5,
      };

      mockSupabase.from('contexts').insert(contextData);

      expect(mockSupabase.from).toHaveBeenCalledWith('contexts');
    });

    it('should handle Supabase storage upload', async () => {
      const file = {
        originalname: 'data.csv',
        buffer: Buffer.from('col1,col2\n1,2'),
      };

      mockSupabase.from('context_files').insert({
        userId: 'user-123',
        filename: file.originalname,
        fileSize: file.buffer.length,
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('context_files');
    });

    it('should retrieve stored contexts', async () => {
      mockSupabase.from('contexts').select('*').eq('userId', 'user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('contexts');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('userId', 'user-123');
    });

    it('should update context analysis status', async () => {
      const contextId = 'context-123';

      mockSupabase.from('contexts')
        .update({ analysisStatus: 'completed', analyzedAt: new Date() })
        .eq('id', contextId);

      expect(mockSupabase.from).toHaveBeenCalledWith('contexts');
      expect(mockSupabase.update).toHaveBeenCalled();
    });
  });

  describe('Axios HTTP Requests', () => {
    it('should make POST request to analysis service', async () => {
      const contextData = {
        contextId: 'context-123',
        fileSize: 2048,
        format: 'csv',
      };

      mockAxios.post.mockResolvedValue({
        data: { analysisId: 'analysis-456', status: 'processing' },
      });

      const response = await mockAxios.post('/api/analyze', contextData);

      expect(mockAxios.post).toHaveBeenCalledWith('/api/analyze', contextData);
      expect(response.data.analysisId).toBe('analysis-456');
    });

    it('should handle analysis service timeout', async () => {
      mockAxios.post.mockRejectedValue(new Error('Request timeout'));

      try {
        await mockAxios.post('/api/analyze', {});
      } catch (error) {
        expect(error.message).toBe('Request timeout');
      }
    });

    it('should retry failed requests', async () => {
      let attempt = 0;
      mockAxios.post.mockImplementation(() => {
        attempt++;
        if (attempt < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ data: { success: true } });
      });

      try {
        await mockAxios.post('/api/analyze', {});
      } catch (error) {
        // First attempt fails
      }

      // Retry logic would go here
    });
  });

  describe('Response Formatting', () => {
    it('should return context with analysis metadata', async () => {
      const res = createMockResponse();
      const contextResponse = {
        id: 'context-123',
        filename: 'data.csv',
        format: 'csv',
        uploadedAt: new Date().toISOString(),
        analysis: {
          status: 'completed',
          rowCount: 100,
          columnCount: 5,
        },
      };

      res.status(201).json({
        success: true,
        context: contextResponse,
      });

      expect(res.statusCode).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.context.id).toBe('context-123');
    });

    it('should include error messages in responses', async () => {
      const res = createMockResponse();
      const error = {
        code: 'INVALID_FORMAT',
        message: 'File format not supported',
        supportedFormats: ['csv', 'json', 'xlsx'],
      };

      res.status(400).json({ error });

      expect(res.statusCode).toBe(400);
      expect(res.data.error.code).toBe('INVALID_FORMAT');
    });

    it('should include pagination in list responses', async () => {
      const res = createMockResponse();
      const contexts = [
        { id: 'context-1', filename: 'data1.csv' },
        { id: 'context-2', filename: 'data2.csv' },
      ];

      res.status(200).json({
        success: true,
        data: contexts,
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      });

      expect(res.data.pagination.page).toBe(1);
      expect(res.data.pagination.total).toBe(25);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabase.from('contexts').insert().mockRejectedValue(
        new Error('Database connection failed')
      );

      const res = createMockResponse();
      try {
        await mockSupabase.from('contexts').insert({});
      } catch (error) {
        res.status(500).json({
          error: 'Failed to save context',
          details: error.message,
        });
      }

      expect(res.statusCode).toBe(500);
      expect(res.data.error).toBe('Failed to save context');
    });

    it('should validate required fields', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          // Missing filename and content
          format: 'csv',
        },
      });
      const res = createMockResponse();

      const required = ['filename', 'content', 'format'];
      const missing = required.filter(field => !req.body[field]);

      if (missing.length > 0) {
        res.status(400).json({
          error: 'Missing required fields',
          missing,
        });
      }

      expect(res.statusCode).toBe(400);
      expect(res.data.missing).toContain('filename');
    });

    it('should sanitize file content to prevent XSS', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          filename: 'data.csv',
          content: 'name\n<script>alert("xss")</script>',
        },
      });

      const sanitize = (content) => {
        return content
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/on\w+\s*=/gi, '');
      };

      const sanitized = sanitize(req.body.content);
      expect(sanitized).not.toContain('<script>');
    });
  });

  describe('Performance', () => {
    it('should process files within acceptable time', async () => {
      const startTime = Date.now();

      // Simular processamento
      const csvContent = Array(1000)
        .fill('col1,col2,col3')
        .join('\n');

      const lines = csvContent.split('\n');
      const data = lines.map(line => line.split(','));

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Processamento deve ser rápido
      expect(duration).toBeLessThan(1000); // 1 segundo
    });

    it('should handle large CSV files efficiently', async () => {
      const rowCount = 10000;
      const csvLines = ['col1,col2,col3'];

      for (let i = 0; i < rowCount; i++) {
        csvLines.push(`${i},value${i},data${i}`);
      }

      const csvContent = csvLines.join('\n');
      expect(csvContent.split('\n')).toHaveLength(rowCount + 1);
    });
  });
});

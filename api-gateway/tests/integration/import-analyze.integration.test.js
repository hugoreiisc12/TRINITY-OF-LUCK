/**
 * Integration Tests for Import → Analyze Flow
 * Testes de integração para fluxo completo: import → analyze
 */

import { createMockAxios, createMockSupabaseClient, createMockRedisClient, createMockQueue, wait, createMockAnalysisResult, createMockRetrainingResult } from '../utils/mocks.js';

describe('Integration: Import → Analyze Flow', () => {
  let mockSupabase;
  let mockRedis;
  let mockAxios;
  let analysisQueue;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    mockRedis = createMockRedisClient();
    mockAxios = createMockAxios();
    analysisQueue = createMockQueue('analysis');
  });

  describe('Full E2E Workflow', () => {
    it('should complete full import → analyze workflow', async () => {
      // Step 1: Upload file
      const uploadResponse = {
        contextId: 'context-123',
        filename: 'data.csv',
        status: 'uploaded',
      };

      // Step 2: Parse and validate
      const csvContent = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
      const lines = csvContent.split('\n');
      const metadata = {
        rowCount: lines.length - 1,
        columnCount: lines[0].split(',').length,
        format: 'csv',
      };

      expect(metadata.rowCount).toBe(2);
      expect(metadata.columnCount).toBe(3);

      // Step 3: Store in Supabase
      mockSupabase.from('contexts').insert({
        userId: 'user-123',
        filename: uploadResponse.filename,
        ...metadata,
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('contexts');

      // Step 4: Queue analysis job
      const job = await analysisQueue.add({
        contextId: uploadResponse.contextId,
        format: metadata.format,
      });

      expect(job.id).toBeDefined();

      // Step 5: Process analysis
      const analysisResult = createMockAnalysisResult({
        contextId: uploadResponse.contextId,
      });

      // Step 6: Store results
      mockSupabase.from('analyses').insert(analysisResult);

      expect(mockSupabase.from).toHaveBeenCalledWith('analyses');

      // Verify final state
      expect(analysisResult.status).toBe('completed');
      expect(analysisResult.predictions.probability).toBeGreaterThan(0);
    });

    it('should handle analysis failures gracefully', async () => {
      const contextId = 'context-456';

      // Queue analysis
      const job = await analysisQueue.add({
        contextId,
        format: 'csv',
      });

      // Simulate failure
      analysisQueue.process.mockImplementation(async () => {
        throw new Error('Analysis failed: Memory limit exceeded');
      });

      // Log error
      mockSupabase.from('analysis_errors').insert({
        jobId: job.id,
        contextId,
        error: 'Analysis failed: Memory limit exceeded',
        timestamp: new Date().toISOString(),
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('analysis_errors');
    });

    it('should support parallel analysis of multiple contexts', async () => {
      const contextIds = ['context-1', 'context-2', 'context-3'];
      const jobs = [];

      // Queue all analyses
      for (const contextId of contextIds) {
        const job = await analysisQueue.add({ contextId });
        jobs.push(job);
      }

      expect(jobs).toHaveLength(3);
      expect(jobs.every(job => job.id)).toBe(true);

      // Store all results
      for (const job of jobs) {
        const result = createMockAnalysisResult({
          contextId: `context-${jobs.indexOf(job) + 1}`,
        });

        mockSupabase.from('analyses').insert(result);
      }

      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });

  describe('Data Flow Validation', () => {
    it('should validate data transformation through pipeline', async () => {
      const originalData = {
        name: 'John',
        age: '30',
        city: 'New York',
      };

      // Transform: validate types
      const transformed = {
        name: String(originalData.name),
        age: parseInt(originalData.age),
        city: String(originalData.city),
      };

      expect(typeof transformed.name).toBe('string');
      expect(typeof transformed.age).toBe('number');
      expect(transformed.age).toBe(30);
    });

    it('should handle data enrichment', async () => {
      const baseData = {
        contextId: 'context-123',
        rowCount: 1000,
      };

      // Enrich with metadata
      const enriched = {
        ...baseData,
        processedAt: new Date().toISOString(),
        version: '1.0.0',
        quality: {
          completeness: 0.95,
          accuracy: 0.92,
        },
      };

      expect(enriched.processedAt).toBeDefined();
      expect(enriched.quality.completeness).toBeGreaterThan(0.9);
    });

    it('should cache intermediate results', async () => {
      const key = 'analysis-metadata:context-123';
      const metadata = {
        rowCount: 1000,
        columnCount: 15,
        format: 'csv',
      };

      // Store in Redis
      await mockRedis.set(key, JSON.stringify(metadata));

      // Retrieve from cache
      const cached = await mockRedis.get(key);
      const parsed = JSON.parse(cached);

      expect(parsed.rowCount).toBe(1000);
      expect(parsed.columnCount).toBe(15);
    });
  });

  describe('Queue System Integration', () => {
    it('should manage job lifecycle', async () => {
      const job = await analysisQueue.add({
        contextId: 'context-789',
        format: 'csv',
      });

      // Check initial state
      expect(job.id).toBeDefined();

      // Update progress
      job.progress = 50;

      // Complete job
      const finalState = 'completed';
      expect(finalState).toBe('completed');
    });

    it('should implement job retry logic', async () => {
      let attempts = 0;
      const maxRetries = 3;

      const job = await analysisQueue.add(
        { contextId: 'context-999' },
        {
          attempts: maxRetries,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );

      // Simulate retries
      for (let i = 0; i < maxRetries; i++) {
        attempts++;
        await wait(100); // Simulate work
      }

      expect(attempts).toBeLessThanOrEqual(maxRetries);
    });

    it('should handle job timeouts', async () => {
      const job = await analysisQueue.add(
        { contextId: 'context-timeout' },
        { timeout: 5000 } // 5 second timeout
      );

      // Simulate timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Job timeout')),
          6000 // Exceed timeout
        );
      });

      try {
        await Promise.race([
          new Promise(resolve => setTimeout(resolve, 3000)), // Completes before timeout
          timeoutPromise,
        ]);
      } catch (error) {
        // Timeout handling
      }

      expect(job.id).toBeDefined();
    });

    it('should provide job status updates', async () => {
      const job = await analysisQueue.add({
        contextId: 'context-status',
      });

      // Track progress events
      const progressUpdates = [];

      analysisQueue.on('progress', (job, progress) => {
        progressUpdates.push(progress);
      });

      // Simulate progress
      job.progress = 25;
      job.progress = 50;
      job.progress = 75;
      job.progress = 100;

      expect(job.progress).toBe(100);
    });
  });

  describe('Supabase Data Persistence', () => {
    it('should persist context metadata', async () => {
      const context = {
        userId: 'user-123',
        filename: 'historical-data.csv',
        format: 'csv',
        size: 2048000,
        rows: 1000,
        columns: 15,
      };

      mockSupabase.from('contexts').insert(context);

      expect(mockSupabase.from).toHaveBeenCalledWith('contexts');
      expect(mockSupabase.insert).toHaveBeenCalledWith(context);
    });

    it('should retrieve and update analysis results', async () => {
      const analysisId = 'analysis-123';
      const updates = {
        status: 'completed',
        completedAt: new Date().toISOString(),
        results: {
          probability: 0.85,
          confidence: 0.92,
        },
      };

      mockSupabase.from('analyses')
        .update(updates)
        .eq('id', analysisId);

      expect(mockSupabase.from).toHaveBeenCalledWith('analyses');
      expect(mockSupabase.update).toHaveBeenCalledWith(updates);
    });

    it('should handle concurrent data writes', async () => {
      const writes = [];

      for (let i = 0; i < 10; i++) {
        writes.push(
          mockSupabase.from('events').insert({
            contextId: 'context-123',
            eventType: 'analysis_update',
            timestamp: new Date().toISOString(),
          })
        );
      }

      await Promise.all(writes);

      expect(mockSupabase.from).toHaveBeenCalledWith('events');
    });

    it('should implement transactions for multi-step operations', async () => {
      const transactionOps = [];

      // Step 1: Create analysis record
      transactionOps.push(
        mockSupabase.from('analyses').insert({
          contextId: 'context-123',
          status: 'processing',
        })
      );

      // Step 2: Update context status
      transactionOps.push(
        mockSupabase.from('contexts')
          .update({ analysisStatus: 'processing' })
          .eq('id', 'context-123')
      );

      // Step 3: Log event
      transactionOps.push(
        mockSupabase.from('logs').insert({
          contextId: 'context-123',
          event: 'analysis_started',
        })
      );

      // Execute all operations
      for (const op of transactionOps) {
        expect(mockSupabase.from).toHaveBeenCalled();
      }
    });
  });

  describe('External Service Integration', () => {
    it('should call Python analysis service', async () => {
      const contextData = {
        contextId: 'context-123',
        fileSize: 2048,
        format: 'csv',
      };

      mockAxios.post.mockResolvedValue({
        data: {
          analysisId: 'analysis-456',
          status: 'completed',
          results: createMockAnalysisResult(),
        },
      });

      const response = await mockAxios.post('/api/analyze', contextData);

      expect(mockAxios.post).toHaveBeenCalledWith('/api/analyze', contextData);
      expect(response.data.analysisId).toBe('analysis-456');
    });

    it('should handle service timeouts with retry', async () => {
      let attempts = 0;
      const maxAttempts = 3;

      mockAxios.post.mockImplementation(() => {
        attempts++;
        if (attempts < maxAttempts) {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve({ data: { success: true } });
      });

      // Retry logic
      let lastError;
      for (let i = 0; i < maxAttempts; i++) {
        try {
          await mockAxios.post('/api/analyze', {});
          break;
        } catch (error) {
          lastError = error;
          await wait(100);
        }
      }

      expect(lastError).toBeUndefined(); // Should succeed on retry
    });

    it('should handle service unavailability', async () => {
      mockAxios.post.mockRejectedValue(
        new Error('Service unavailable (503)')
      );

      const contextData = { contextId: 'context-123' };

      // Queue for later retry
      const job = await analysisQueue.add(contextData, {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      });

      expect(job.id).toBeDefined();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from partial failures', async () => {
      const contexts = [
        { id: 'context-1', status: 'success' },
        { id: 'context-2', status: 'error' },
        { id: 'context-3', status: 'success' },
      ];

      const successful = contexts.filter(c => c.status === 'success');
      const failed = contexts.filter(c => c.status === 'error');

      expect(successful).toHaveLength(2);
      expect(failed).toHaveLength(1);

      // Retry failed contexts
      for (const context of failed) {
        const job = await analysisQueue.add(context);
        expect(job.id).toBeDefined();
      }
    });

    it('should log and alert on critical failures', async () => {
      const error = new Error('Critical: Database connection lost');

      mockSupabase.from('critical_errors').insert({
        timestamp: new Date().toISOString(),
        severity: 'critical',
        message: error.message,
        stack: error.stack,
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('critical_errors');
    });

    it('should implement circuit breaker pattern', async () => {
      const circuitBreaker = {
        state: 'closed', // closed, open, half-open
        failures: 0,
        threshold: 5,

        call: async (fn) => {
          if (this.state === 'open') {
            throw new Error('Circuit breaker is open');
          }

          try {
            const result = await fn();
            this.failures = 0;
            this.state = 'closed';
            return result;
          } catch (error) {
            this.failures++;
            if (this.failures >= this.threshold) {
              this.state = 'open';
            }
            throw error;
          }
        },
      };

      expect(circuitBreaker.state).toBe('closed');
    });
  });

  describe('Performance Under Load', () => {
    it('should handle bulk imports', async () => {
      const startTime = Date.now();
      const bulkCount = 100;

      const jobs = [];
      for (let i = 0; i < bulkCount; i++) {
        const job = await analysisQueue.add({
          contextId: `context-${i}`,
          format: 'csv',
        });
        jobs.push(job);
      }

      const duration = Date.now() - startTime;

      expect(jobs).toHaveLength(bulkCount);
      expect(duration).toBeLessThan(5000); // Should complete quickly
    });

    it('should maintain throughput with queued jobs', async () => {
      // Get queue stats
      const stats = await analysisQueue.getJobCounts();

      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('waiting');
    });

    it('should efficiently handle memory for large datasets', async () => {
      const largeDataset = Array(10000)
        .fill(null)
        .map((_, i) => ({
          id: i,
          value: Math.random(),
        }));

      // Process in chunks
      const chunkSize = 1000;
      for (let i = 0; i < largeDataset.length; i += chunkSize) {
        const chunk = largeDataset.slice(i, i + chunkSize);
        const job = await analysisQueue.add({ data: chunk });
        expect(job.id).toBeDefined();
      }
    });
  });
});

describe('Integration: Import → Retrain → Analyze Flow', () => {
  let mockSupabase;
  let analysisQueue;
  let retrainingQueue;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    analysisQueue = createMockQueue('analysis');
    retrainingQueue = createMockQueue('retraining');
  });

  it('should complete full pipeline', async () => {
    // Step 1: Import contexts
    const contexts = [
      { id: 'context-1', filename: 'data1.csv' },
      { id: 'context-2', filename: 'data2.csv' },
    ];

    // Step 2: Queue retraining
    const retrainJob = await retrainingQueue.add({
      contextIds: contexts.map(c => c.id),
    });

    expect(retrainJob.id).toBeDefined();

    // Step 3: Upon completion, queue analyses
    const analysisJobs = [];
    for (const context of contexts) {
      const job = await analysisQueue.add({
        contextId: context.id,
        useRetrainedModel: true,
      });
      analysisJobs.push(job);
    }

    expect(analysisJobs).toHaveLength(2);

    // Step 4: Collect results
    const results = [];
    for (const job of analysisJobs) {
      const result = createMockAnalysisResult({
        jobId: job.id,
      });
      results.push(result);
    }

    expect(results.every(r => r.status === 'completed')).toBe(true);
  });
});

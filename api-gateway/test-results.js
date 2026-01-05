#!/usr/bin/env node

/**
 * Test script for GET /api/results/:id endpoint
 * 
 * This script tests the results endpoint implementation
 * Run: node test-results.js
 */

import http from 'http';

const ENDPOINT = 'http://localhost:3001/api/results';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(`${color}${args.join(' ')}${colors.reset}`);
}

// Valid UUID for testing (or use this format for examples)
const VALID_ID = '550e8400-e29b-41d4-a716-446655440000';
const INVALID_ID = 'not-a-uuid';
const NONEXISTENT_ID = '550e8400-e29b-41d4-a716-446655440999';

async function testEndpoint(url, testName, expectedStatus) {
  return new Promise((resolve) => {
    log(colors.cyan, `\n📝 Test: ${testName}`);
    log(colors.cyan, `📍 URL: ${url}`);

    const startTime = Date.now();

    const req = http.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;
        const statusOk = res.statusCode === expectedStatus;
        const statusColor = statusOk ? colors.green : colors.red;

        log(statusColor, `   Status: ${res.statusCode} ${res.statusMessage}`);
        log(colors.yellow, `   Duration: ${duration}ms`);

        try {
          const json = JSON.parse(data);

          if (json.success) {
            log(colors.green, `   ✅ Response Valid`);
            if (json.data) {
              log(colors.green, `   Title: ${json.data.titulo || 'N/A'}`);
              if (json.data.probabilidades) {
                const keys = Object.keys(json.data.probabilidades);
                log(colors.green, `   Probabilities: ${keys.join(', ')}`);
              }
              if (json.data.confianca !== undefined) {
                log(colors.green, `   Confidence: ${(json.data.confianca * 100).toFixed(1)}%`);
              }
            }
          } else {
            log(colors.red, `   ❌ Response Error: ${json.error}`);
            if (json.details) {
              log(colors.red, `   Details: ${json.details}`);
            }
          }

          resolve({
            success: json.success,
            statusCode: res.statusCode,
            expected: expectedStatus,
            match: res.statusCode === expectedStatus,
            duration,
          });
        } catch (err) {
          log(colors.red, `   ❌ JSON Parse Error: ${err.message}`);
          resolve({
            success: false,
            statusCode: res.statusCode,
            expected: expectedStatus,
            match: false,
            error: 'JSON Parse Error',
            duration,
          });
        }
      });
    });

    req.on('error', (err) => {
      const duration = Date.now() - startTime;
      log(colors.red, `   ❌ Connection Error: ${err.message}`);
      log(colors.red, `   Duration: ${duration}ms`);

      resolve({
        success: false,
        error: err.message,
        duration,
        match: false,
      });
    });
  });
}

async function runTests() {
  log(colors.blue, '\n═══════════════════════════════════════════');
  log(colors.blue, '  GET /api/results/:id Endpoint Tests');
  log(colors.blue, '═══════════════════════════════════════════');

  const tests = [
    {
      name: 'Get analysis by valid ID',
      url: `${ENDPOINT}/${VALID_ID}`,
      expectedStatus: 200, // Could be 404 if not found, but endpoint structure is valid
    },
    {
      name: 'Get with invalid UUID format',
      url: `${ENDPOINT}/${INVALID_ID}`,
      expectedStatus: 400,
    },
    {
      name: 'Get non-existent analysis',
      url: `${ENDPOINT}/${NONEXISTENT_ID}`,
      expectedStatus: 404,
    },
    {
      name: 'Get analysis with recalculation',
      url: `${ENDPOINT}/${VALID_ID}?recalculate=true`,
      expectedStatus: 200, // Could be 404 if not found
    },
    {
      name: 'Get analysis with invalid recalculate parameter',
      url: `${ENDPOINT}/${VALID_ID}?recalculate=invalid`,
      expectedStatus: 200, // Should still work, just won't recalculate
    },
  ];

  const results = [];

  for (const test of tests) {
    const result = await testEndpoint(test.url, test.name, test.expectedStatus);
    results.push({
      name: test.name,
      ...result,
    });

    // Wait a bit between tests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Summary
  log(colors.blue, '\n═══════════════════════════════════════════');
  log(colors.blue, '  Test Summary');
  log(colors.blue, '═══════════════════════════════════════════');

  const passed = results.filter((r) => r.match).length;
  const failed = results.filter((r) => !r.match).length;
  const avgDuration = Math.round(results.reduce((a, r) => a + r.duration, 0) / results.length);

  results.forEach((result) => {
    const status = result.match ? '✅' : '❌';
    log(colors.cyan, `${status} ${result.name}`);
    if (!result.match) {
      log(colors.red, `   Expected: ${result.expected}, Got: ${result.statusCode}`);
    }
    log(colors.yellow, `   ${result.duration}ms`);
  });

  log(colors.blue, '\n═══════════════════════════════════════════');
  log(
    passed === results.length ? colors.green : colors.red,
    `  Results: ${passed} Passed, ${failed} Failed`,
  );
  log(colors.yellow, `  Average Response Time: ${avgDuration}ms`);
  log(colors.blue, '═══════════════════════════════════════════\n');

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running
log(colors.yellow, '⏳ Waiting for API Gateway on port 3001...');

setTimeout(() => {
  runTests().catch((err) => {
    log(colors.red, `\n❌ Test Error: ${err.message}`);
    process.exit(1);
  });
}, 1000);

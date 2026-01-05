#!/usr/bin/env node

/**
 * Test script for GET /api/platforms endpoint
 * 
 * This script tests the platforms endpoint implementation
 * Run: node test-platforms.js
 */

import http from 'http';
import https from 'https';

const ENDPOINT = 'http://localhost:3001/api/platforms';

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

async function testEndpoint(url, testName) {
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
        const statusOk = res.statusCode === 200;
        const statusColor = statusOk ? colors.green : colors.red;

        log(statusColor, `   Status: ${res.statusCode} ${res.statusMessage}`);
        log(colors.yellow, `   Duration: ${duration}ms`);

        try {
          const json = JSON.parse(data);

          if (json.success) {
            log(colors.green, `   ✅ Response Valid`);
            log(colors.green, `   Message: ${json.message}`);
            log(colors.green, `   Count: ${json.count} platforms`);

            if (json.data && json.data.length > 0) {
              log(colors.green, `   First Platform: ${json.data[0].nome} (${json.data[0].nicho})`);
            }

            if (json.filters && Object.keys(json.filters).length > 0) {
              log(colors.yellow, `   Filters: ${JSON.stringify(json.filters)}`);
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
            count: json.count,
            duration,
          });
        } catch (err) {
          log(colors.red, `   ❌ JSON Parse Error: ${err.message}`);
          resolve({
            success: false,
            statusCode: res.statusCode,
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
      });
    });
  });
}

async function runTests() {
  log(colors.blue, '\n═══════════════════════════════════════════');
  log(colors.blue, '  GET /api/platforms Endpoint Tests');
  log(colors.blue, '═══════════════════════════════════════════');

  const tests = [
    {
      name: 'Get All Platforms',
      url: `${ENDPOINT}`,
    },
    {
      name: 'Filter by Sports Niche',
      url: `${ENDPOINT}?niche=sports`,
    },
    {
      name: 'Filter by Crypto Niche',
      url: `${ENDPOINT}?niche=crypto`,
    },
    {
      name: 'Filter by Esports Niche',
      url: `${ENDPOINT}?niche=esports`,
    },
    {
      name: 'Filter by Invalid Niche',
      url: `${ENDPOINT}?niche=nonexistent`,
    },
  ];

  const results = [];

  for (const test of tests) {
    const result = await testEndpoint(test.url, test.name);
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

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  results.forEach((result) => {
    const status = result.success ? '✅' : '❌';
    log(colors.cyan, `${status} ${result.name}`);
    if (result.success && result.count !== undefined) {
      log(colors.green, `   → Found ${result.count} items (${result.duration}ms)`);
    } else if (result.error) {
      log(colors.red, `   → ${result.error} (${result.duration}ms)`);
    }
  });

  log(colors.blue, '\n═══════════════════════════════════════════');
  log(
    passed > 0 ? colors.green : colors.red,
    `  Results: ${passed} Passed, ${failed} Failed`,
  );
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

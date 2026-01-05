/**
 * Test Suite for GET /api/plans Endpoint
 * 
 * Tests plans retrieval and data format validation
 * 
 * Run with: node test-plans.js
 */

const http = require('http');
const assert = require('assert');

// Configuration
const API_URL = 'http://localhost:3001';
const PLANS_ENDPOINT = `${API_URL}/api/plans`;

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let testsPassed = 0;
let testsFailed = 0;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Make HTTP GET request
 */
async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers,
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Print test result
 */
function printTestResult(testName, passed, message = '') {
  const status = passed ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
  const output = message ? `${testName}: ${message}` : testName;
  console.log(`${status} - ${output}`);

  if (passed) {
    testsPassed++;
  } else {
    testsFailed++;
  }
}

/**
 * Assert function
 */
function assertEqual(actual, expected, message = '') {
  try {
    assert.strictEqual(actual, expected);
    return true;
  } catch (e) {
    console.log(`  ${colors.yellow}Expected: ${expected}, Got: ${actual}${colors.reset}`);
    if (message) console.log(`  ${colors.yellow}${message}${colors.reset}`);
    return false;
  }
}

// ============================================================
// TEST SUITE
// ============================================================

async function runTests() {
  console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  GET /api/plans - Test Suite                           ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`${colors.yellow}Starting tests...${colors.reset}\n`);

  // Test 1: Basic endpoint response
  console.log(`${colors.blue}TEST 1: Basic Endpoint Response${colors.reset}`);
  try {
    const response = await makeRequest(PLANS_ENDPOINT);

    const passed =
      assertEqual(response.status, 200, 'Should return 200 OK') &&
      assertEqual(response.data.success, true, 'success should be true') &&
      response.data.message !== undefined &&
      Array.isArray(response.data.data);

    printTestResult(
      'Endpoint responds with 200',
      passed,
      `Status: ${response.status}`
    );
  } catch (error) {
    printTestResult('Basic endpoint response', false, error.message);
  }

  // Test 2: Response structure
  console.log(`\n${colors.blue}TEST 2: Response Structure${colors.reset}`);
  try {
    const response = await makeRequest(PLANS_ENDPOINT);

    const hasRequiredFields =
      response.data.success !== undefined &&
      response.data.message !== undefined &&
      response.data.data !== undefined &&
      response.data.count !== undefined &&
      response.data.timestamp !== undefined;

    printTestResult(
      'Response has required fields',
      hasRequiredFields,
      `Fields: success, message, data, count, timestamp`
    );
  } catch (error) {
    printTestResult('Response structure', false, error.message);
  }

  // Test 3: Data array format
  console.log(`\n${colors.blue}TEST 3: Data Array Format${colors.reset}`);
  try {
    const response = await makeRequest(PLANS_ENDPOINT);

    const isArray = Array.isArray(response.data.data);
    const countMatches = response.data.count === response.data.data.length;

    const passed = isArray && countMatches;

    printTestResult(
      'Data is properly formatted array',
      passed,
      `Array length: ${response.data.data.length}, Count field: ${response.data.count}`
    );
  } catch (error) {
    printTestResult('Data array format', false, error.message);
  }

  // Test 4: Plan object structure
  console.log(`\n${colors.blue}TEST 4: Plan Object Structure${colors.reset}`);
  try {
    const response = await makeRequest(PLANS_ENDPOINT);

    if (response.data.data.length === 0) {
      console.log(`  ${colors.yellow}No plans in database, skipping structure validation${colors.reset}`);
      printTestResult('Plan object structure', true, 'No plans to validate (acceptable)');
    } else {
      const plan = response.data.data[0];
      const hasRequiredFields =
        plan.id !== undefined &&
        plan.nome !== undefined &&
        plan.preco !== undefined;

      printTestResult(
        'Plan objects have required fields',
        hasRequiredFields,
        `Fields: id, nome, preco (plan: ${plan.nome})`
      );
    }

  } catch (error) {
    printTestResult('Plan object structure', false, error.message);
  }

  // Test 5: Price field type
  console.log(`\n${colors.blue}TEST 5: Price Field Type${colors.reset}`);
  try {
    const response = await makeRequest(PLANS_ENDPOINT);

    if (response.data.data.length === 0) {
      console.log(`  ${colors.yellow}No plans in database, skipping price validation${colors.reset}`);
      printTestResult('Price field type', true, 'No plans to validate (acceptable)');
    } else {
      const allPricesValid = response.data.data.every(plan => {
        return typeof plan.preco === 'number' && plan.preco >= 0;
      });

      printTestResult(
        'All prices are valid numbers',
        allPricesValid,
        `Validated ${response.data.data.length} plans`
      );
    }

  } catch (error) {
    printTestResult('Price field type', false, error.message);
  }

  // Test 6: Count accuracy
  console.log(`\n${colors.blue}TEST 6: Count Accuracy${colors.reset}`);
  try {
    const response = await makeRequest(PLANS_ENDPOINT);

    const countAccurate = response.data.count === response.data.data.length;

    printTestResult(
      'Count field is accurate',
      countAccurate,
      `Count: ${response.data.count}, Actual: ${response.data.data.length}`
    );
  } catch (error) {
    printTestResult('Count accuracy', false, error.message);
  }

  // Test 7: Timestamp format
  console.log(`\n${colors.blue}TEST 7: Timestamp Format${colors.reset}`);
  try {
    const response = await makeRequest(PLANS_ENDPOINT);

    const timestamp = response.data.timestamp;
    const isValidISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(timestamp);
    const isValidDate = !isNaN(Date.parse(timestamp));

    const passed = isValidISO && isValidDate;

    printTestResult(
      'Timestamp is valid ISO-8601',
      passed,
      `Timestamp: ${timestamp}`
    );
  } catch (error) {
    printTestResult('Timestamp format', false, error.message);
  }

  // Test 8: Response message
  console.log(`\n${colors.blue}TEST 8: Response Message${colors.reset}`);
  try {
    const response = await makeRequest(PLANS_ENDPOINT);

    const messageValid = 
      typeof response.data.message === 'string' &&
      response.data.message.length > 0;

    printTestResult(
      'Response includes message',
      messageValid,
      `Message: "${response.data.message}"`
    );
  } catch (error) {
    printTestResult('Response message', false, error.message);
  }

  // Test 9: Multiple requests
  console.log(`\n${colors.blue}TEST 9: Multiple Requests${colors.reset}`);
  try {
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(makeRequest(PLANS_ENDPOINT));
    }

    const responses = await Promise.all(promises);
    let successCount = 0;

    for (const response of responses) {
      if (response.status === 200 && response.data.success) {
        successCount++;
      }
    }

    const multiplePassed = successCount === 3;
    printTestResult(
      'Multiple requests all succeed',
      multiplePassed,
      `Successful: ${successCount}/3`
    );
  } catch (error) {
    printTestResult('Multiple requests', false, error.message);
  }

  // Test 10: Content-Type header
  console.log(`\n${colors.blue}TEST 10: Content-Type Header${colors.reset}`);
  try {
    const response = await makeRequest(PLANS_ENDPOINT);

    const contentType = response.headers['content-type'];
    const isJSON = contentType && contentType.includes('application/json');

    printTestResult(
      'Response has JSON content-type',
      isJSON,
      `Content-Type: ${contentType}`
    );
  } catch (error) {
    printTestResult('Content-Type header', false, error.message);
  }

  // ============================================================
  // RESULTS SUMMARY
  // ============================================================

  console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  Test Results Summary                                 ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

  const totalTests = testsPassed + testsFailed;
  const passPercentage = totalTests > 0 ? ((testsPassed / totalTests) * 100).toFixed(1) : 0;

  console.log(`Total Tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
  console.log(`Success Rate: ${passPercentage}%\n`);

  if (testsFailed === 0) {
    console.log(`${colors.green}✅ All tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Some tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

// ============================================================
// RUN TESTS
// ============================================================

console.log(`Connecting to ${PLANS_ENDPOINT}...`);

// Run tests
setTimeout(runTests, 500);

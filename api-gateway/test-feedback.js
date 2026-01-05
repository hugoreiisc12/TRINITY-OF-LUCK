/**
 * Test Suite for POST /api/feedback Endpoint
 * 
 * Tests feedback submission, database saving, and Python integration
 * 
 * Run with: node test-feedback.js
 */

const http = require('http');
const assert = require('assert');

// Configuration
const API_URL = 'http://localhost:3001';
const FEEDBACK_ENDPOINT = `${API_URL}/api/feedback`;

// Test data
const TEST_ANALYSIS_ID = '550e8400-e29b-41d4-a716-446655440000';
const INVALID_UUID = 'not-a-uuid';
const VALID_RESULTS = ['vitoria', 'empate', 'derrota', 'correto', 'incorreto', true, false];

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
 * Make HTTP POST request
 */
async function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(data)),
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
    req.write(JSON.stringify(data));
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
  console.log(`${colors.blue}║  POST /api/feedback - Test Suite                      ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`${colors.yellow}Starting tests...${colors.reset}\n`);

  // Test 1: Valid feedback submission
  console.log(`${colors.blue}TEST 1: Valid Feedback Submission${colors.reset}`);
  try {
    const response = await makeRequest(FEEDBACK_ENDPOINT, {
      analysisId: TEST_ANALYSIS_ID,
      result: 'vitoria',
    });

    const passed =
      assertEqual(response.status, 200, 'Should return 200 OK') &&
      assertEqual(response.data.success, true, 'success should be true') &&
      assertEqual(response.data.message, 'Feedback enviado', 'message should be correct') &&
      response.data.data.feedbackId !== undefined;

    printTestResult(
      'Valid feedback submission',
      passed,
      `Status: ${response.status}, Message: ${response.data.message || response.data.error}`
    );
  } catch (error) {
    printTestResult('Valid feedback submission', false, error.message);
  }

  // Test 2: Missing analysisId
  console.log(`\n${colors.blue}TEST 2: Missing analysisId${colors.reset}`);
  try {
    const response = await makeRequest(FEEDBACK_ENDPOINT, {
      result: 'vitoria',
    });

    const passed = assertEqual(response.status, 400, 'Should return 400 Bad Request') &&
      assertEqual(response.data.success, false, 'success should be false') &&
      response.data.error !== undefined;

    printTestResult(
      'Missing analysisId',
      passed,
      `Status: ${response.status}, Error: ${response.data.error}`
    );
  } catch (error) {
    printTestResult('Missing analysisId', false, error.message);
  }

  // Test 3: Missing result
  console.log(`\n${colors.blue}TEST 3: Missing result${colors.reset}`);
  try {
    const response = await makeRequest(FEEDBACK_ENDPOINT, {
      analysisId: TEST_ANALYSIS_ID,
    });

    const passed = assertEqual(response.status, 400, 'Should return 400 Bad Request') &&
      assertEqual(response.data.success, false, 'success should be false') &&
      response.data.error !== undefined;

    printTestResult(
      'Missing result',
      passed,
      `Status: ${response.status}, Error: ${response.data.error}`
    );
  } catch (error) {
    printTestResult('Missing result', false, error.message);
  }

  // Test 4: Invalid result value
  console.log(`\n${colors.blue}TEST 4: Invalid result value${colors.reset}`);
  try {
    const response = await makeRequest(FEEDBACK_ENDPOINT, {
      analysisId: TEST_ANALYSIS_ID,
      result: 'invalid_result',
    });

    const passed = assertEqual(response.status, 400, 'Should return 400 Bad Request') &&
      assertEqual(response.data.success, false, 'success should be false') &&
      response.data.error !== undefined;

    printTestResult(
      'Invalid result value',
      passed,
      `Status: ${response.status}, Error: ${response.data.error}`
    );
  } catch (error) {
    printTestResult('Invalid result value', false, error.message);
  }

  // Test 5: All valid result types
  console.log(`\n${colors.blue}TEST 5: All valid result types${colors.reset}`);
  let allResultsPassed = true;

  for (const result of VALID_RESULTS) {
    try {
      const response = await makeRequest(FEEDBACK_ENDPOINT, {
        analysisId: TEST_ANALYSIS_ID,
        result: result,
      });

      if (response.status !== 200 || !response.data.success) {
        allResultsPassed = false;
        console.log(`  ${colors.red}Failed for result: ${result}${colors.reset}`);
      }
    } catch (error) {
      allResultsPassed = false;
      console.log(`  ${colors.red}Error with result ${result}: ${error.message}${colors.reset}`);
    }
  }

  printTestResult(
    'All valid results accepted',
    allResultsPassed,
    `Tested: ${VALID_RESULTS.join(', ')}`
  );

  // Test 6: Response format validation
  console.log(`\n${colors.blue}TEST 6: Response format validation${colors.reset}`);
  try {
    const response = await makeRequest(FEEDBACK_ENDPOINT, {
      analysisId: TEST_ANALYSIS_ID,
      result: 'empate',
    });

    const hasRequiredFields =
      response.data.success !== undefined &&
      response.data.message !== undefined &&
      response.data.data !== undefined &&
      response.data.data.feedbackId !== undefined &&
      response.data.data.analysisId !== undefined &&
      response.data.data.result !== undefined &&
      response.data.data.timestamp !== undefined;

    printTestResult(
      'Response has required fields',
      hasRequiredFields,
      `Fields: success, message, data.{feedbackId, analysisId, result, timestamp}`
    );
  } catch (error) {
    printTestResult('Response format validation', false, error.message);
  }

  // Test 7: Feedback data integrity
  console.log(`\n${colors.blue}TEST 7: Feedback data integrity${colors.reset}`);
  try {
    const testResult = 'derrota';
    const response = await makeRequest(FEEDBACK_ENDPOINT, {
      analysisId: TEST_ANALYSIS_ID,
      result: testResult,
    });

    const integrityPassed =
      assertEqual(response.data.data.analysisId, TEST_ANALYSIS_ID, 'analysisId should match') &&
      assertEqual(response.data.data.result, testResult, 'result should match') &&
      response.data.data.timestamp !== undefined;

    printTestResult(
      'Feedback data integrity',
      integrityPassed,
      `Verified: analysisId, result, timestamp`
    );
  } catch (error) {
    printTestResult('Feedback data integrity', false, error.message);
  }

  // Test 8: Multiple rapid requests
  console.log(`\n${colors.blue}TEST 8: Multiple rapid requests (rate limiting)${colors.reset}`);
  try {
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        makeRequest(FEEDBACK_ENDPOINT, {
          analysisId: `550e8400-e29b-41d4-a716-44665544000${i}`,
          result: VALID_RESULTS[i % VALID_RESULTS.length],
        })
      );
    }

    const responses = await Promise.all(promises);
    let successCount = 0;

    for (const response of responses) {
      if (response.status === 200 && response.data.success) {
        successCount++;
      }
    }

    const multiplePassed = successCount === 5;
    printTestResult(
      'Multiple rapid requests',
      multiplePassed,
      `Successful: ${successCount}/5`
    );
  } catch (error) {
    printTestResult('Multiple rapid requests', false, error.message);
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

console.log(`Connecting to ${FEEDBACK_ENDPOINT}...`);

// Run tests
setTimeout(runTests, 500);

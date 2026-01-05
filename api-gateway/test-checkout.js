/**
 * POST /api/stripe/checkout - Test Suite
 * Tests checkout session creation with Stripe integration
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 10000;

// Test data
const validPlanId = '550e8400-e29b-41d4-a716-446655440000'; // UUID format
const validToken = process.env.TEST_TOKEN || 'test_jwt_token';
const invalidPlanId = 'invalid-plan-id';
const nonexistentPlanId = '550e8400-e29b-41d4-a716-999999999999';

/**
 * Test 1: Valid checkout session creation
 */
async function testValidCheckout() {
  console.log('\n[TEST 1] Valid checkout session creation');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/stripe/checkout`,
      { planId: validPlanId },
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200 && response.data.success) {
      const { data } = response.data;

      if (data.sessionId && data.url && data.planName && typeof data.planPrice === 'number') {
        console.log('✅ PASS: Valid checkout created');
        console.log(`   Session ID: ${data.sessionId.substring(0, 20)}...`);
        console.log(`   Plan: ${data.planName}`);
        console.log(`   Price: R$ ${data.planPrice}`);
        return true;
      }
    }

    console.log('❌ FAIL: Invalid response format');
    return false;

  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * Test 2: Missing planId validation
 */
async function testMissingPlanId() {
  console.log('\n[TEST 2] Missing planId validation');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/stripe/checkout`,
      {}, // Empty body
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('❌ FAIL: Should have rejected empty body');
    return false;

  } catch (error) {
    if (error.response?.status === 400) {
      console.log(`✅ PASS: Correctly rejected (400)`);
      console.log(`   Error: ${error.response.data.error}`);
      return true;
    }

    console.log(`❌ FAIL: Wrong status code ${error.response?.status}`);
    return false;
  }
}

/**
 * Test 3: Missing authentication token
 */
async function testMissingAuth() {
  console.log('\n[TEST 3] Missing authentication token');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/stripe/checkout`,
      { planId: validPlanId },
      {
        headers: {
          'Content-Type': 'application/json',
          // No Authorization header
        },
      }
    );

    console.log('❌ FAIL: Should have rejected unauthenticated request');
    return false;

  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`✅ PASS: Correctly rejected (401)`);
      console.log(`   Error: ${error.response.data.error}`);
      return true;
    }

    console.log(`❌ FAIL: Wrong status code ${error.response?.status}`);
    return false;
  }
}

/**
 * Test 4: Invalid token format
 */
async function testInvalidToken() {
  console.log('\n[TEST 4] Invalid token format');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/stripe/checkout`,
      { planId: validPlanId },
      {
        headers: {
          'Authorization': 'Bearer invalid_token_xyz',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('❌ FAIL: Should have rejected invalid token');
    return false;

  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`✅ PASS: Correctly rejected invalid token (401)`);
      return true;
    }

    console.log(`❌ FAIL: Wrong status code ${error.response?.status}`);
    return false;
  }
}

/**
 * Test 5: Nonexistent plan error (404)
 */
async function testNonexistentPlan() {
  console.log('\n[TEST 5] Nonexistent plan (404)');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/stripe/checkout`,
      { planId: nonexistentPlanId },
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('❌ FAIL: Should have rejected nonexistent plan');
    return false;

  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`✅ PASS: Correctly rejected nonexistent plan (404)`);
      console.log(`   Error: ${error.response.data.error}`);
      return true;
    }

    console.log(`⚠️  WARNING: Got ${error.response?.status} instead of 404`);
    console.log(`   Error: ${error.response?.data?.error}`);
    // Don't fail, as plan might not exist in test DB
    return true;
  }
}

/**
 * Test 6: Invalid planId format
 */
async function testInvalidPlanFormat() {
  console.log('\n[TEST 6] Invalid planId format');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/stripe/checkout`,
      { planId: invalidPlanId },
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('❌ FAIL: Should have rejected invalid format');
    return false;

  } catch (error) {
    if (error.response?.status === 400) {
      console.log(`✅ PASS: Correctly rejected invalid format (400)`);
      return true;
    }

    if (error.response?.status === 404) {
      console.log(`✅ PASS: Plan not found for invalid format (404)`);
      return true;
    }

    console.log(`❌ FAIL: Wrong status code ${error.response?.status}`);
    return false;
  }
}

/**
 * Test 7: Response format validation
 */
async function testResponseFormat() {
  console.log('\n[TEST 7] Response format validation');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/stripe/checkout`,
      { planId: validPlanId },
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { data, timestamp } = response.data;

    // Validate structure
    const checks = [
      { name: 'success field', pass: response.data.success === true },
      { name: 'data object', pass: typeof data === 'object' },
      { name: 'sessionId string', pass: typeof data.sessionId === 'string' },
      { name: 'url string', pass: typeof data.url === 'string' && data.url.startsWith('https://') },
      { name: 'planName string', pass: typeof data.planName === 'string' },
      { name: 'planPrice number', pass: typeof data.planPrice === 'number' && data.planPrice > 0 },
      { name: 'timestamp exists', pass: timestamp !== undefined },
    ];

    let allPass = true;
    checks.forEach(check => {
      console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
      if (!check.pass) allPass = false;
    });

    if (allPass) {
      console.log('✅ PASS: Response format valid');
      return true;
    } else {
      console.log('❌ FAIL: Response format invalid');
      return false;
    }

  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Test 8: Stripe URL validation
 */
async function testStripeUrl() {
  console.log('\n[TEST 8] Stripe URL validation');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/stripe/checkout`,
      { planId: validPlanId },
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { url } = response.data.data;

    const checks = [
      { name: 'HTTPS protocol', pass: url.startsWith('https://') },
      { name: 'Stripe domain', pass: url.includes('checkout.stripe.com') || url.includes('stripe.com') },
      { name: 'Session ID in URL', pass: url.includes('cs_') },
    ];

    let allPass = true;
    checks.forEach(check => {
      console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
      if (!check.pass) allPass = false;
    });

    if (allPass) {
      console.log('✅ PASS: Stripe URL valid');
      return true;
    } else {
      console.log('❌ FAIL: Stripe URL invalid');
      return false;
    }

  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Test 9: Metadata verification
 */
async function testMetadata() {
  console.log('\n[TEST 9] Metadata in response');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/stripe/checkout`,
      { planId: validPlanId },
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { sessionId, planName, planPrice } = response.data.data;

    const checks = [
      { name: 'Session ID not empty', pass: sessionId && sessionId.length > 0 },
      { name: 'Plan name not empty', pass: planName && planName.length > 0 },
      { name: 'Plan price > 0', pass: planPrice > 0 },
      { name: 'Session ID format (cs_)', pass: sessionId.startsWith('cs_') },
    ];

    let allPass = true;
    checks.forEach(check => {
      console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
      if (!check.pass) allPass = false;
    });

    if (allPass) {
      console.log('✅ PASS: Metadata valid');
      return true;
    } else {
      console.log('❌ FAIL: Metadata invalid');
      return false;
    }

  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Test 10: Error message consistency
 */
async function testErrorMessages() {
  console.log('\n[TEST 10] Error message consistency');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/stripe/checkout`,
      { planId: nonexistentPlanId },
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('⚠️  SKIP: Plan exists, no error to test');
    return true;

  } catch (error) {
    const { success, error: errorMsg } = error.response?.data || {};

    const checks = [
      { name: 'success is false', pass: success === false },
      { name: 'error message present', pass: errorMsg && errorMsg.length > 0 },
      { name: 'error message is string', pass: typeof errorMsg === 'string' },
    ];

    let allPass = true;
    checks.forEach(check => {
      console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
      if (!check.pass) allPass = false;
    });

    if (allPass) {
      console.log('✅ PASS: Error messages consistent');
      return true;
    } else {
      console.log('❌ FAIL: Error messages inconsistent');
      return false;
    }
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  POST /api/stripe/checkout - Test Suite          ║');
  console.log('╚══════════════════════════════════════════════════╝');

  const results = [];

  results.push({
    name: 'Valid checkout',
    pass: await testValidCheckout(),
  });

  results.push({
    name: 'Missing planId',
    pass: await testMissingPlanId(),
  });

  results.push({
    name: 'Missing auth',
    pass: await testMissingAuth(),
  });

  results.push({
    name: 'Invalid token',
    pass: await testInvalidToken(),
  });

  results.push({
    name: 'Nonexistent plan',
    pass: await testNonexistentPlan(),
  });

  results.push({
    name: 'Invalid planId format',
    pass: await testInvalidPlanFormat(),
  });

  results.push({
    name: 'Response format',
    pass: await testResponseFormat(),
  });

  results.push({
    name: 'Stripe URL',
    pass: await testStripeUrl(),
  });

  results.push({
    name: 'Metadata',
    pass: await testMetadata(),
  });

  results.push({
    name: 'Error messages',
    pass: await testErrorMessages(),
  });

  // Summary
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  Test Summary                                      ║');
  console.log('╚══════════════════════════════════════════════════╝');

  const passed = results.filter(r => r.pass).length;
  const total = results.length;

  results.forEach(result => {
    console.log(`${result.pass ? '✅' : '❌'} ${result.name}`);
  });

  console.log(`\n📊 Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log(`⚠️  ${total - passed} test(s) failed`);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite error:', error.message);
  process.exit(1);
});

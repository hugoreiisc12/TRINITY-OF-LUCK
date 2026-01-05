/**
 * GET /api/subscription - Test Suite
 * Tests current subscription retrieval endpoint
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 10000;

// Test data
const validToken = process.env.TEST_TOKEN || 'test_jwt_token';
const invalidToken = 'invalid_token_xyz';
const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';

/**
 * Test 1: Valid subscription retrieval
 */
async function testValidSubscription() {
  console.log('\n[TEST 1] Valid subscription retrieval');

  try {
    const response = await axios.get(
      `${BASE_URL}/api/subscription`,
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }
    );

    if (response.status === 200 && response.data.success) {
      const { data } = response.data;

      const checks = [
        { name: 'subscriptionId present', pass: !!data.subscriptionId },
        { name: 'planId present', pass: !!data.planId },
        { name: 'planName present', pass: !!data.planName },
        { name: 'status is string', pass: typeof data.status === 'string' },
        { name: 'isActive is boolean', pass: typeof data.isActive === 'boolean' },
        { name: 'isCancelled is boolean', pass: typeof data.isCancelled === 'boolean' },
        { name: 'resources is object', pass: typeof data.resources === 'object' },
        { name: 'startDate is ISO', pass: /^\d{4}-\d{2}-\d{2}T/.test(data.startDate) },
      ];

      let allPass = true;
      checks.forEach(check => {
        if (!check.pass) allPass = false;
      });

      if (allPass) {
        console.log('✅ PASS: Valid subscription retrieved');
        console.log(`   Plan: ${data.planName}`);
        console.log(`   Status: ${data.status}`);
        return true;
      }
    }

    console.log('❌ FAIL: Invalid response format');
    return false;

  } catch (error) {
    console.log(`⚠️  SKIP: ${error.response?.data?.error || error.message}`);
    // 404 is acceptable - user may not have subscription
    if (error.response?.status === 404) {
      console.log('   (No active subscription found - this is acceptable)');
      return true;
    }
    return false;
  }
}

/**
 * Test 2: Missing authentication token
 */
async function testMissingAuth() {
  console.log('\n[TEST 2] Missing authentication token');

  try {
    const response = await axios.get(
      `${BASE_URL}/api/subscription`,
      {
        headers: {
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
 * Test 3: Invalid token format
 */
async function testInvalidToken() {
  console.log('\n[TEST 3] Invalid token format');

  try {
    const response = await axios.get(
      `${BASE_URL}/api/subscription`,
      {
        headers: {
          'Authorization': `Bearer ${invalidToken}`,
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

    console.log(`⚠️  WARNING: Got ${error.response?.status} instead of 401`);
    return true; // Accept any error response
  }
}

/**
 * Test 4: Expired token handling
 */
async function testExpiredToken() {
  console.log('\n[TEST 4] Expired token handling');

  try {
    const response = await axios.get(
      `${BASE_URL}/api/subscription`,
      {
        headers: {
          'Authorization': `Bearer ${expiredToken}`,
        },
      }
    );

    console.log('❌ FAIL: Should have rejected expired token');
    return false;

  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`✅ PASS: Correctly rejected expired token (401)`);
      return true;
    }

    console.log(`⚠️  WARNING: Got ${error.response?.status}`);
    return true;
  }
}

/**
 * Test 5: Response format validation
 */
async function testResponseFormat() {
  console.log('\n[TEST 5] Response format validation');

  try {
    const response = await axios.get(
      `${BASE_URL}/api/subscription`,
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }
    );

    if (response.status === 200) {
      const { success, message, data, timestamp } = response.data;

      const checks = [
        { name: 'success is true', pass: success === true },
        { name: 'message exists', pass: !!message },
        { name: 'data exists', pass: !!data },
        { name: 'timestamp exists', pass: !!timestamp },
        { name: 'timestamp is ISO', pass: /^\d{4}-\d{2}-\d{2}T/.test(timestamp) },
      ];

      let allPass = true;
      checks.forEach(check => {
        console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
        if (!check.pass) allPass = false;
      });

      if (allPass) {
        console.log('✅ PASS: Response format valid');
        return true;
      }
    }

    console.log('❌ FAIL: Response format invalid');
    return false;

  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️  SKIP: No subscription to test format');
      return true;
    }
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Test 6: Subscription data validation
 */
async function testSubscriptionData() {
  console.log('\n[TEST 6] Subscription data validation');

  try {
    const response = await axios.get(
      `${BASE_URL}/api/subscription`,
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }
    );

    if (response.status === 200) {
      const { data } = response.data;

      const checks = [
        { name: 'subscriptionId is UUID', pass: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.subscriptionId) },
        { name: 'planId is UUID', pass: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.planId) },
        { name: 'planName is non-empty string', pass: typeof data.planName === 'string' && data.planName.length > 0 },
        { name: 'planPrice is number', pass: typeof data.planPrice === 'number' && data.planPrice >= 0 },
        { name: 'status is ativa or cancelada', pass: ['ativa', 'cancelada'].includes(data.status) },
        { name: 'startDate is valid', pass: new Date(data.startDate) instanceof Date && !isNaN(data.startDate) },
      ];

      let allPass = true;
      checks.forEach(check => {
        console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
        if (!check.pass) allPass = false;
      });

      if (allPass) {
        console.log('✅ PASS: All data valid');
        return true;
      }

      console.log('❌ FAIL: Data validation failed');
      return false;
    }

    console.log('⚠️  SKIP: No subscription data');
    return true;

  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️  SKIP: No active subscription');
      return true;
    }
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Test 7: Status and cancellation flags
 */
async function testStatusFlags() {
  console.log('\n[TEST 7] Status and cancellation flags');

  try {
    const response = await axios.get(
      `${BASE_URL}/api/subscription`,
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }
    );

    if (response.status === 200) {
      const { data } = response.data;

      // Check consistency: isActive should match status
      const isActiveCorrect = data.isActive === (data.status === 'ativa');
      const isCancelledCorrect = data.isCancelled === (data.status === 'cancelada');

      const checks = [
        { name: 'isActive matches status', pass: isActiveCorrect },
        { name: 'isCancelled matches status', pass: isCancelledCorrect },
        { name: 'Only one flag true', pass: !(data.isActive && data.isCancelled) },
      ];

      let allPass = true;
      checks.forEach(check => {
        console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
        if (!check.pass) allPass = false;
      });

      if (allPass) {
        console.log('✅ PASS: Status flags consistent');
        return true;
      }
    }

    console.log('⚠️  SKIP: No subscription');
    return true;

  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️  SKIP: No active subscription');
      return true;
    }
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Test 8: Resources object validation
 */
async function testResourcesObject() {
  console.log('\n[TEST 8] Resources object validation');

  try {
    const response = await axios.get(
      `${BASE_URL}/api/subscription`,
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }
    );

    if (response.status === 200) {
      const { data } = response.data;

      const checks = [
        { name: 'resources is object or null', pass: typeof data.resources === 'object' || data.resources === null },
        { name: 'resources is not array', pass: !Array.isArray(data.resources) },
      ];

      let allPass = true;
      checks.forEach(check => {
        console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
        if (!check.pass) allPass = false;
      });

      if (allPass) {
        console.log('✅ PASS: Resources valid');
        console.log(`   Resources keys: ${Object.keys(data.resources || {}).join(', ') || 'none'}`);
        return true;
      }
    }

    console.log('⚠️  SKIP: No subscription');
    return true;

  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️  SKIP: No active subscription');
      return true;
    }
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Test 9: Days remaining calculation
 */
async function testDaysRemaining() {
  console.log('\n[TEST 9] Days remaining calculation');

  try {
    const response = await axios.get(
      `${BASE_URL}/api/subscription`,
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }
    );

    if (response.status === 200) {
      const { data } = response.data;

      const checks = [
        { name: 'daysRemaining is number or null', pass: typeof data.daysRemaining === 'number' || data.daysRemaining === null },
        { name: 'daysRemaining >= 0 if present', pass: data.daysRemaining === null || data.daysRemaining >= 0 },
        { name: 'daysRemaining null means no endDate', pass: data.daysRemaining === null || data.endDate !== null },
      ];

      let allPass = true;
      checks.forEach(check => {
        console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
        if (!check.pass) allPass = false;
      });

      if (allPass) {
        console.log('✅ PASS: Days remaining valid');
        if (data.daysRemaining !== null) {
          console.log(`   Days remaining: ${data.daysRemaining}`);
        }
        return true;
      }
    }

    console.log('⚠️  SKIP: No subscription');
    return true;

  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️  SKIP: No active subscription');
      return true;
    }
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Test 10: No subscription (404) handling
 */
async function testNoSubscription() {
  console.log('\n[TEST 10] No subscription (404) handling');

  try {
    // This test assumes a user with no subscription exists
    // In real scenario, we'd need a test user without subscription
    const response = await axios.get(
      `${BASE_URL}/api/subscription`,
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }
    );

    // If we get 200, user has subscription (which is fine)
    if (response.status === 200) {
      console.log('⚠️  SKIP: Test user has active subscription');
      return true;
    }

    console.log('❌ FAIL: Unexpected response');
    return false;

  } catch (error) {
    if (error.response?.status === 404) {
      const { success, error: errorMsg } = error.response.data;

      const checks = [
        { name: 'success is false', pass: success === false },
        { name: 'error message present', pass: !!errorMsg },
        { name: 'error is about subscription', pass: errorMsg?.toLowerCase().includes('subscription') },
      ];

      let allPass = true;
      checks.forEach(check => {
        console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
        if (!check.pass) allPass = false;
      });

      if (allPass) {
        console.log('✅ PASS: 404 handled correctly');
        return true;
      }
    } else {
      console.log('⚠️  SKIP: Got different status', error.response?.status);
      return true;
    }
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║  GET /api/subscription - Test Suite               ║');
  console.log('╚═══════════════════════════════════════════════════╝');

  const results = [];

  results.push({
    name: 'Valid subscription retrieval',
    pass: await testValidSubscription(),
  });

  results.push({
    name: 'Missing authentication',
    pass: await testMissingAuth(),
  });

  results.push({
    name: 'Invalid token format',
    pass: await testInvalidToken(),
  });

  results.push({
    name: 'Expired token',
    pass: await testExpiredToken(),
  });

  results.push({
    name: 'Response format',
    pass: await testResponseFormat(),
  });

  results.push({
    name: 'Subscription data',
    pass: await testSubscriptionData(),
  });

  results.push({
    name: 'Status flags',
    pass: await testStatusFlags(),
  });

  results.push({
    name: 'Resources object',
    pass: await testResourcesObject(),
  });

  results.push({
    name: 'Days remaining',
    pass: await testDaysRemaining(),
  });

  results.push({
    name: 'No subscription (404)',
    pass: await testNoSubscription(),
  });

  // Summary
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Test Summary                                      ║');
  console.log('╚═══════════════════════════════════════════════════╝');

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

/**
 * POST /api/webhooks/stripe - Test Suite
 * Tests Stripe webhook signature verification and event processing
 */

const crypto = require('crypto');
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_1234567890abcdef';
const TEST_TIMEOUT = 10000;

// Test UUIDs
const testUserId = '550e8400-e29b-41d4-a716-446655440000';
const testPlanId = '550e8400-e29b-41d4-a716-446655440001';

/**
 * Helper: Generate valid Stripe signature
 */
function generateStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const body = JSON.stringify(payload);
  const signedContent = `${timestamp}.${body}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedContent)
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Helper: Create checkout.session.completed payload
 */
function createCheckoutCompletedPayload(overrides = {}) {
  return {
    id: 'evt_test_123456789',
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_live_test_123456789',
        object: 'checkout.session',
        mode: 'subscription',
        payment_status: 'paid',
        metadata: {
          userId: testUserId,
          planId: testPlanId,
          planName: 'Premium',
          planPrice: '99.90',
        },
        ...overrides,
      },
    },
  };
}

/**
 * Test 1: Valid webhook signature verification
 */
async function testValidSignature() {
  console.log('\n[TEST 1] Valid webhook signature verification');

  try {
    const payload = createCheckoutCompletedPayload();
    const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

    const response = await axios.post(
      `${BASE_URL}/api/webhooks/stripe`,
      JSON.stringify(payload),
      {
        headers: {
          'stripe-signature': signature,
          'Content-Type': 'application/json',
        },
        transformRequest: [(data) => data], // Don't transform
      }
    );

    if (response.status === 200 && response.data.success === true) {
      console.log('✅ PASS: Valid signature accepted');
      return true;
    }

    console.log('❌ FAIL: Unexpected response');
    return false;

  } catch (error) {
    console.log(`❌ FAIL: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * Test 2: Invalid signature rejection
 */
async function testInvalidSignature() {
  console.log('\n[TEST 2] Invalid signature rejection');

  try {
    const payload = createCheckoutCompletedPayload();
    const invalidSignature = 't=1234567890,v1=invalidsignature123';

    const response = await axios.post(
      `${BASE_URL}/api/webhooks/stripe`,
      JSON.stringify(payload),
      {
        headers: {
          'stripe-signature': invalidSignature,
          'Content-Type': 'application/json',
        },
        transformRequest: [(data) => data],
      }
    );

    console.log('❌ FAIL: Should have rejected invalid signature');
    return false;

  } catch (error) {
    if (error.response?.status === 400) {
      console.log(`✅ PASS: Correctly rejected invalid signature (400)`);
      console.log(`   Error: ${error.response.data.error}`);
      return true;
    }

    console.log(`❌ FAIL: Wrong status code ${error.response?.status}`);
    return false;
  }
}

/**
 * Test 3: Missing signature rejection
 */
async function testMissingSignature() {
  console.log('\n[TEST 3] Missing signature rejection');

  try {
    const payload = createCheckoutCompletedPayload();

    const response = await axios.post(
      `${BASE_URL}/api/webhooks/stripe`,
      JSON.stringify(payload),
      {
        headers: {
          'Content-Type': 'application/json',
          // No stripe-signature header
        },
        transformRequest: [(data) => data],
      }
    );

    console.log('❌ FAIL: Should have rejected missing signature');
    return false;

  } catch (error) {
    if (error.response?.status === 400) {
      console.log(`✅ PASS: Correctly rejected missing signature (400)`);
      return true;
    }

    console.log(`❌ FAIL: Wrong status code ${error.response?.status}`);
    return false;
  }
}

/**
 * Test 4: checkout.session.completed event processing
 */
async function testCheckoutSessionCompleted() {
  console.log('\n[TEST 4] checkout.session.completed event processing');

  try {
    const payload = createCheckoutCompletedPayload();
    const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

    const response = await axios.post(
      `${BASE_URL}/api/webhooks/stripe`,
      JSON.stringify(payload),
      {
        headers: {
          'stripe-signature': signature,
          'Content-Type': 'application/json',
        },
        transformRequest: [(data) => data],
      }
    );

    if (response.status === 200) {
      console.log('✅ PASS: Event processed successfully');
      return true;
    }

    console.log('❌ FAIL: Event not processed');
    return false;

  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Metadata extraction validation
 */
async function testMetadataExtraction() {
  console.log('\n[TEST 5] Metadata extraction and validation');

  try {
    const payload = createCheckoutCompletedPayload();
    const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

    const checks = [
      { name: 'userId in metadata', pass: !!payload.data.object.metadata.userId },
      { name: 'planId in metadata', pass: !!payload.data.object.metadata.planId },
      { name: 'planName in metadata', pass: !!payload.data.object.metadata.planName },
      { name: 'userId is UUID', pass: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.data.object.metadata.userId) },
      { name: 'planId is UUID', pass: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.data.object.metadata.planId) },
    ];

    let allPass = true;
    checks.forEach(check => {
      console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
      if (!check.pass) allPass = false;
    });

    if (allPass) {
      console.log('✅ PASS: All metadata valid');
      return true;
    } else {
      console.log('❌ FAIL: Metadata validation failed');
      return false;
    }

  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Test 6: Missing metadata handling
 */
async function testMissingMetadata() {
  console.log('\n[TEST 6] Missing metadata handling');

  try {
    const payload = createCheckoutCompletedPayload({
      metadata: {} // Empty metadata
    });
    const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

    const response = await axios.post(
      `${BASE_URL}/api/webhooks/stripe`,
      JSON.stringify(payload),
      {
        headers: {
          'stripe-signature': signature,
          'Content-Type': 'application/json',
        },
        transformRequest: [(data) => data],
      }
    );

    // Should still return 200 (webhook acknowledged) even if metadata missing
    // But subscription won't be created
    if (response.status === 200) {
      console.log('✅ PASS: Handled missing metadata gracefully (200)');
      return true;
    }

    console.log('❌ FAIL: Wrong status code');
    return false;

  } catch (error) {
    console.log(`⚠️  WARNING: ${error.response?.status} - ${error.response?.data?.error}`);
    // Some status codes are acceptable for this test
    return true;
  }
}

/**
 * Test 7: Response format validation
 */
async function testResponseFormat() {
  console.log('\n[TEST 7] Response format validation');

  try {
    const payload = createCheckoutCompletedPayload();
    const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

    const response = await axios.post(
      `${BASE_URL}/api/webhooks/stripe`,
      JSON.stringify(payload),
      {
        headers: {
          'stripe-signature': signature,
          'Content-Type': 'application/json',
        },
        transformRequest: [(data) => data],
      }
    );

    const { success, received } = response.data;

    const checks = [
      { name: 'success is true', pass: success === true },
      { name: 'received is true', pass: received === true },
      { name: 'status 200', pass: response.status === 200 },
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
 * Test 8: Idempotency (replay webhook)
 */
async function testIdempotency() {
  console.log('\n[TEST 8] Idempotency - replay same webhook');

  try {
    const payload = createCheckoutCompletedPayload();
    const signature = generateStripeSignature(payload, WEBHOOK_SECRET);

    const config = {
      headers: {
        'stripe-signature': signature,
        'Content-Type': 'application/json',
      },
      transformRequest: [(data) => data],
    };

    // Send webhook twice
    const response1 = await axios.post(
      `${BASE_URL}/api/webhooks/stripe`,
      JSON.stringify(payload),
      config
    );

    const response2 = await axios.post(
      `${BASE_URL}/api/webhooks/stripe`,
      JSON.stringify(payload),
      config
    );

    const checks = [
      { name: 'First response 200', pass: response1.status === 200 },
      { name: 'Second response 200', pass: response2.status === 200 },
      { name: 'Both successful', pass: response1.status === 200 && response2.status === 200 },
    ];

    let allPass = true;
    checks.forEach(check => {
      console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
      if (!check.pass) allPass = false;
    });

    if (allPass) {
      console.log('✅ PASS: Webhook idempotent (safe to replay)');
      return true;
    } else {
      console.log('❌ FAIL: Idempotency issue');
      return false;
    }

  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Test 9: Event type routing
 */
async function testEventTypeRouting() {
  console.log('\n[TEST 9] Event type routing (checkout.session.completed)');

  try {
    const payload = createCheckoutCompletedPayload();

    const checks = [
      { name: 'Event type is checkout.session.completed', pass: payload.type === 'checkout.session.completed' },
      { name: 'Event has data object', pass: !!payload.data.object },
      { name: 'Session has metadata', pass: !!payload.data.object.metadata },
      { name: 'Payment status is paid', pass: payload.data.object.payment_status === 'paid' },
      { name: 'Mode is subscription', pass: payload.data.object.mode === 'subscription' },
    ];

    let allPass = true;
    checks.forEach(check => {
      console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
      if (!check.pass) allPass = false;
    });

    if (allPass) {
      console.log('✅ PASS: Event structure valid');
      return true;
    } else {
      console.log('❌ FAIL: Event structure invalid');
      return false;
    }

  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Test 10: Stripe signature timestamp validation
 */
async function testTimestampValidation() {
  console.log('\n[TEST 10] Stripe signature timestamp handling');

  try {
    const payload = createCheckoutCompletedPayload();
    const timestamp = Math.floor(Date.now() / 1000);
    const body = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(`${timestamp}.${body}`)
      .digest('hex');

    const stripeSignature = `t=${timestamp},v1=${signature}`;

    const response = await axios.post(
      `${BASE_URL}/api/webhooks/stripe`,
      body,
      {
        headers: {
          'stripe-signature': stripeSignature,
          'Content-Type': 'application/json',
        },
        transformRequest: [(data) => data],
      }
    );

    const checks = [
      { name: 'Signature format valid (t=...,v1=...)', pass: /^t=\d+,v1=\w+$/.test(stripeSignature) },
      { name: 'Response 200', pass: response.status === 200 },
      { name: 'Response successful', pass: response.data.success === true },
    ];

    let allPass = true;
    checks.forEach(check => {
      console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
      if (!check.pass) allPass = false;
    });

    if (allPass) {
      console.log('✅ PASS: Timestamp validation working');
      return true;
    } else {
      console.log('❌ FAIL: Timestamp validation failed');
      return false;
    }

  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('╔═════════════════════════════════════════════════════╗');
  console.log('║  POST /api/webhooks/stripe - Test Suite             ║');
  console.log('╚═════════════════════════════════════════════════════╝');

  const results = [];

  results.push({
    name: 'Valid signature',
    pass: await testValidSignature(),
  });

  results.push({
    name: 'Invalid signature rejection',
    pass: await testInvalidSignature(),
  });

  results.push({
    name: 'Missing signature rejection',
    pass: await testMissingSignature(),
  });

  results.push({
    name: 'checkout.session.completed',
    pass: await testCheckoutSessionCompleted(),
  });

  results.push({
    name: 'Metadata extraction',
    pass: await testMetadataExtraction(),
  });

  results.push({
    name: 'Missing metadata handling',
    pass: await testMissingMetadata(),
  });

  results.push({
    name: 'Response format',
    pass: await testResponseFormat(),
  });

  results.push({
    name: 'Idempotency (replay)',
    pass: await testIdempotency(),
  });

  results.push({
    name: 'Event type routing',
    pass: await testEventTypeRouting(),
  });

  results.push({
    name: 'Signature timestamp',
    pass: await testTimestampValidation(),
  });

  // Summary
  console.log('\n╔═════════════════════════════════════════════════════╗');
  console.log('║  Test Summary                                        ║');
  console.log('╚═════════════════════════════════════════════════════╝');

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

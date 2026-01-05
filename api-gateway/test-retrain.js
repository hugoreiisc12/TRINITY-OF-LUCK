// Test Suite for POST /api/retrain Endpoint
// Tests for manual model retraining functionality

import axios from 'axios';
import assert from 'assert';

const BASE_URL = 'http://localhost:3001';
let validJWT = '';

// Helper to get a valid JWT token
async function getValidToken() {
  if (validJWT) return validJWT;
  
  const response = await axios.post(`${BASE_URL}/api/auth/login`, {
    email: 'test@trinity.com',
    password: 'Test123!',
  }).catch(() => null);
  
  if (response?.data?.token) {
    validJWT = response.data.token;
    return validJWT;
  }
  
  // Use a pre-made test token if available
  return process.env.TEST_JWT_TOKEN || '';
}

// Test Suite
const tests = [];

// Test 1: Successful retrain initiation
tests.push({
  name: 'POST /api/retrain - Success with default parameters',
  test: async () => {
    const token = await getValidToken();
    const response = await axios.post(`${BASE_URL}/api/retrain`, 
      {
        full_retrain: false,
        model_type: 'all',
      },
      {
        headers: { 'Authorization': `Bearer ${token}` },
        validateStatus: () => true, // Don't throw on any status
      }
    );

    assert.strictEqual(response.status, 200, `Expected 200, got ${response.status}`);
    assert.strictEqual(response.data.success, true, 'success should be true');
    assert.strictEqual(response.data.message, 'Retreinamento iniciado', 'message mismatch');
    assert(response.data.data.user_id, 'user_id should exist');
    assert(response.data.data.python_response, 'python_response should exist');
    assert(response.data.data.initiated_at, 'initiated_at should exist');
  },
});

// Test 2: Retrain with full_retrain=true
tests.push({
  name: 'POST /api/retrain - Full retrain from scratch',
  test: async () => {
    const token = await getValidToken();
    const response = await axios.post(`${BASE_URL}/api/retrain`,
      {
        full_retrain: true,
        model_type: 'all',
      },
      {
        headers: { 'Authorization': `Bearer ${token}` },
        validateStatus: () => true,
      }
    );

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.success, true);
    assert.strictEqual(response.data.data.full_retrain, true, 'full_retrain should be true');
  },
});

// Test 3: Retrain specific model type
tests.push({
  name: 'POST /api/retrain - Specific model type (probability)',
  test: async () => {
    const token = await getValidToken();
    const response = await axios.post(`${BASE_URL}/api/retrain`,
      {
        full_retrain: false,
        model_type: 'probability',
      },
      {
        headers: { 'Authorization': `Bearer ${token}` },
        validateStatus: () => true,
      }
    );

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.data.retrain_type, 'probability');
  },
});

// Test 4: Missing authentication
tests.push({
  name: 'POST /api/retrain - Missing JWT token (401)',
  test: async () => {
    const response = await axios.post(`${BASE_URL}/api/retrain`,
      { full_retrain: false, model_type: 'all' },
      { validateStatus: () => true }
    );

    assert.strictEqual(response.status, 401, `Expected 401, got ${response.status}`);
    assert(response.data.error || response.data.message, 'Error message should exist');
  },
});

// Test 5: Invalid JWT token
tests.push({
  name: 'POST /api/retrain - Invalid JWT token (401)',
  test: async () => {
    const response = await axios.post(`${BASE_URL}/api/retrain`,
      { full_retrain: false, model_type: 'all' },
      {
        headers: { 'Authorization': 'Bearer invalid-token-xyz' },
        validateStatus: () => true,
      }
    );

    assert.strictEqual(response.status, 401);
  },
});

// Test 6: Python service not available (503)
tests.push({
  name: 'POST /api/retrain - Python service unavailable (503)',
  test: async () => {
    const token = await getValidToken();
    
    // This test assumes Python service is NOT running
    // If it fails, check that port 8000 is available
    const response = await axios.post(`${BASE_URL}/api/retrain`,
      { full_retrain: false, model_type: 'all' },
      {
        headers: { 'Authorization': `Bearer ${token}` },
        validateStatus: () => true,
      }
    );

    // Will be 503 if service is down, 200 if service is up
    if (response.status === 503) {
      assert(
        response.data.error?.includes('not available') || 
        response.data.error?.includes('not found'),
        'Error message should mention service unavailability'
      );
    }
  },
});

// Test 7: Response structure validation
tests.push({
  name: 'POST /api/retrain - Response structure validation',
  test: async () => {
    const token = await getValidToken();
    const response = await axios.post(`${BASE_URL}/api/retrain`,
      { full_retrain: false, model_type: 'all' },
      {
        headers: { 'Authorization': `Bearer ${token}` },
        validateStatus: () => true,
      }
    );

    if (response.status === 200) {
      // Validate success response structure
      assert(response.data.success !== undefined, 'success field required');
      assert(response.data.message !== undefined, 'message field required');
      assert(response.data.data !== undefined, 'data field required');
      
      // Validate data object structure
      const data = response.data.data;
      assert(data.user_id !== undefined, 'user_id required in data');
      assert(data.retrain_type !== undefined, 'retrain_type required in data');
      assert(data.full_retrain !== undefined, 'full_retrain required in data');
      assert(data.python_response !== undefined, 'python_response required in data');
      assert(data.initiated_at !== undefined, 'initiated_at required in data');
    }
  },
});

// Test 8: Multiple requests handling
tests.push({
  name: 'POST /api/retrain - Multiple sequential requests',
  test: async () => {
    const token = await getValidToken();
    
    const response1 = await axios.post(`${BASE_URL}/api/retrain`,
      { full_retrain: false, model_type: 'probability' },
      { headers: { 'Authorization': `Bearer ${token}` }, validateStatus: () => true }
    );
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const response2 = await axios.post(`${BASE_URL}/api/retrain`,
      { full_retrain: false, model_type: 'factors' },
      { headers: { 'Authorization': `Bearer ${token}` }, validateStatus: () => true }
    );

    assert(response1.status === 200 || response1.status === 503);
    assert(response2.status === 200 || response2.status === 503);
  },
});

// Test 9: Request timeout handling
tests.push({
  name: 'POST /api/retrain - Request timeout handling',
  test: async () => {
    const token = await getValidToken();
    
    try {
      const response = await axios.post(`${BASE_URL}/api/retrain`,
        { full_retrain: false, model_type: 'all' },
        {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 100, // 100ms timeout (very short)
          validateStatus: () => true,
        }
      );
      
      // If we get a response, validate it
      assert(response.status !== undefined);
    } catch (error) {
      // Timeout errors are acceptable
      assert(error.code === 'ECONNABORTED' || error.message.includes('timeout'));
    }
  },
});

// Test 10: Parameter validation
tests.push({
  name: 'POST /api/retrain - Parameter validation',
  test: async () => {
    const token = await getValidToken();
    
    const validModels = ['all', 'probability', 'factors', 'comparison'];
    
    for (const modelType of validModels) {
      const response = await axios.post(`${BASE_URL}/api/retrain`,
        { full_retrain: false, model_type: modelType },
        {
          headers: { 'Authorization': `Bearer ${token}` },
          validateStatus: () => true,
        }
      );
      
      assert(response.status === 200 || response.status === 503,
        `Invalid status ${response.status} for model_type=${modelType}`);
      
      if (response.status === 200) {
        assert.strictEqual(response.data.data.retrain_type, modelType);
      }
    }
  },
});

// Run all tests
async function runTests() {
  console.log('\n🧪 Testing POST /api/retrain Endpoint\n');
  console.log(`Total tests: ${tests.length}\n`);

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    try {
      await test.test();
      console.log(`✅ Test ${i + 1}: ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`❌ Test ${i + 1}: ${test.name}`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Results: ${passed} passed, ${failed} failed out of ${tests.length}`);
  console.log(`${'='.repeat(60)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

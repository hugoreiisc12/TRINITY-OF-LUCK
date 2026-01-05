// Test Suite for GET /api/dashboard-metrics Endpoint
// Tests for dashboard analytics aggregation

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
  
  return process.env.TEST_JWT_TOKEN || '';
}

// Test Suite
const tests = [];

// Test 1: Successful metrics fetch
tests.push({
  name: 'GET /api/dashboard-metrics - Success',
  test: async () => {
    const token = await getValidToken();
    const response = await axios.get(`${BASE_URL}/api/dashboard-metrics`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
        validateStatus: () => true,
      }
    );

    assert.strictEqual(response.status, 200, `Expected 200, got ${response.status}`);
    assert.strictEqual(response.data.success, true);
    assert(response.data.data, 'data field should exist');
    assert(response.data.data.overview, 'overview should exist');
    assert(response.data.data.trends, 'trends should exist');
    assert(response.data.data.recent, 'recent should exist');
    assert(response.data.data.stats, 'stats should exist');
  },
});

// Test 2: Overview section validation
tests.push({
  name: 'GET /api/dashboard-metrics - Overview section',
  test: async () => {
    const token = await getValidToken();
    const response = await axios.get(`${BASE_URL}/api/dashboard-metrics`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
        validateStatus: () => true,
      }
    );

    assert.strictEqual(response.status, 200);
    const overview = response.data.data.overview;
    
    assert(overview.totalAnalyses !== undefined, 'totalAnalyses required');
    assert(overview.averageAccuracy !== undefined, 'averageAccuracy required');
    assert(overview.currentPlan !== undefined, 'currentPlan required');
    assert(overview.analysesLastWeek !== undefined, 'analysesLastWeek required');
    
    assert.strictEqual(typeof overview.totalAnalyses, 'number');
    assert.strictEqual(typeof overview.averageAccuracy, 'number');
    assert.strictEqual(typeof overview.currentPlan, 'string');
    assert.strictEqual(typeof overview.analysesLastWeek, 'number');
  },
});

// Test 3: Trends section validation
tests.push({
  name: 'GET /api/dashboard-metrics - Trends section',
  test: async () => {
    const token = await getValidToken();
    const response = await axios.get(`${BASE_URL}/api/dashboard-metrics`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
        validateStatus: () => true,
      }
    );

    assert.strictEqual(response.status, 200);
    const trends = response.data.data.trends;
    
    assert(trends.weeklyGrowthPercentage !== undefined);
    assert(trends.mostUsedNiche !== undefined);
    assert(trends.nicheDistribution !== undefined);
    
    assert.strictEqual(typeof trends.weeklyGrowthPercentage, 'number');
    assert.strictEqual(typeof trends.nicheDistribution, 'object');
  },
});

// Test 4: Recent analyses validation
tests.push({
  name: 'GET /api/dashboard-metrics - Recent analyses',
  test: async () => {
    const token = await getValidToken();
    const response = await axios.get(`${BASE_URL}/api/dashboard-metrics`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
        validateStatus: () => true,
      }
    );

    assert.strictEqual(response.status, 200);
    const recent = response.data.data.recent;
    
    assert(Array.isArray(recent.analyses), 'analyses should be array');
    assert(recent.lastAnalysisDate === null || typeof recent.lastAnalysisDate === 'string');
    
    if (recent.analyses.length > 0) {
      const analysis = recent.analyses[0];
      assert(analysis.id !== undefined);
      assert(analysis.nicho !== undefined);
      assert(analysis.data_criacao !== undefined);
      assert(analysis.precisao !== undefined);
    }
  },
});

// Test 5: Stats section validation
tests.push({
  name: 'GET /api/dashboard-metrics - Stats section',
  test: async () => {
    const token = await getValidToken();
    const response = await axios.get(`${BASE_URL}/api/dashboard-metrics`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
        validateStatus: () => true,
      }
    );

    assert.strictEqual(response.status, 200);
    const stats = response.data.data.stats;
    
    assert(stats.totalNiches !== undefined);
    assert(stats.totalFeedback !== undefined);
    assert(stats.averageAccuracyPercentage !== undefined);
    
    assert.strictEqual(typeof stats.totalNiches, 'number');
    assert.strictEqual(typeof stats.totalFeedback, 'number');
    assert.strictEqual(typeof stats.averageAccuracyPercentage, 'number');
  },
});

// Test 6: Missing authentication
tests.push({
  name: 'GET /api/dashboard-metrics - Missing JWT token (401)',
  test: async () => {
    const response = await axios.get(`${BASE_URL}/api/dashboard-metrics`,
      { validateStatus: () => true }
    );

    assert.strictEqual(response.status, 401, `Expected 401, got ${response.status}`);
    assert(response.data.error || response.data.message);
  },
});

// Test 7: Invalid JWT token
tests.push({
  name: 'GET /api/dashboard-metrics - Invalid JWT token (401)',
  test: async () => {
    const response = await axios.get(`${BASE_URL}/api/dashboard-metrics`,
      {
        headers: { 'Authorization': 'Bearer invalid-token-xyz' },
        validateStatus: () => true,
      }
    );

    assert.strictEqual(response.status, 401);
  },
});

// Test 8: Response timestamp
tests.push({
  name: 'GET /api/dashboard-metrics - Response timestamp',
  test: async () => {
    const token = await getValidToken();
    const response = await axios.get(`${BASE_URL}/api/dashboard-metrics`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
        validateStatus: () => true,
      }
    );

    assert.strictEqual(response.status, 200);
    assert(response.data.timestamp, 'timestamp should exist');
    
    // Verify timestamp is valid ISO format
    const date = new Date(response.data.timestamp);
    assert(!isNaN(date.getTime()), 'timestamp should be valid ISO date');
  },
});

// Test 9: Data types validation
tests.push({
  name: 'GET /api/dashboard-metrics - Data types validation',
  test: async () => {
    const token = await getValidToken();
    const response = await axios.get(`${BASE_URL}/api/dashboard-metrics`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
        validateStatus: () => true,
      }
    );

    assert.strictEqual(response.status, 200);
    const data = response.data.data;
    
    // Verify all numeric fields are numbers
    assert.strictEqual(typeof data.overview.totalAnalyses, 'number');
    assert.strictEqual(typeof data.overview.averageAccuracy, 'number');
    assert.strictEqual(typeof data.overview.analysesLastWeek, 'number');
    assert.strictEqual(typeof data.trends.weeklyGrowthPercentage, 'number');
    assert.strictEqual(typeof data.stats.totalNiches, 'number');
    assert.strictEqual(typeof data.stats.totalFeedback, 'number');
    assert.strictEqual(typeof data.stats.averageAccuracyPercentage, 'number');
  },
});

// Test 10: Niche distribution structure
tests.push({
  name: 'GET /api/dashboard-metrics - Niche distribution',
  test: async () => {
    const token = await getValidToken();
    const response = await axios.get(`${BASE_URL}/api/dashboard-metrics`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
        validateStatus: () => true,
      }
    );

    assert.strictEqual(response.status, 200);
    const dist = response.data.data.trends.nicheDistribution;
    
    // Verify it's an object with numeric values
    assert.strictEqual(typeof dist, 'object');
    
    Object.entries(dist).forEach(([niche, count]) => {
      assert.strictEqual(typeof count, 'number');
      assert(count >= 0, `Count for ${niche} should be >= 0`);
    });
  },
});

// Run all tests
async function runTests() {
  console.log('\n🧪 Testing GET /api/dashboard-metrics Endpoint\n');
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

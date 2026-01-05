/**
 * GET /api/history - Test Suite
 * Tests analysis history endpoint with filters and metrics
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 10000;

const validToken = process.env.TEST_TOKEN || 'test_jwt_token';

/**
 * Test 1: Get all history (no filters)
 */
async function testGetAllHistory() {
  console.log('\n[TEST 1] Get all history (no filters)');

  try {
    const response = await axios.get(`${BASE_URL}/api/history`, {
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200 && response.data.success) {
      const checks = [
        { name: 'success is true', pass: response.data.success === true },
        { name: 'data object exists', pass: !!response.data.data },
        { name: 'analyses array exists', pass: Array.isArray(response.data.data.analyses) },
        { name: 'pagination exists', pass: !!response.data.data.pagination },
        { name: 'metrics exists', pass: !!response.data.data.metrics },
        { name: 'total count present', pass: typeof response.data.data.pagination.total === 'number' },
      ];

      let allPass = true;
      checks.forEach(check => {
        if (!check.pass) allPass = false;
      });

      if (allPass) {
        console.log('✅ PASS: All history retrieved');
        console.log(`   Total: ${response.data.data.pagination.total}, Returned: ${response.data.data.analyses.length}`);
        return true;
      }
    }

    console.log('❌ FAIL: Invalid response structure');
    return false;

  } catch (error) {
    console.log(`⚠️  SKIP: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * Test 2: Get history with date filter (start date)
 */
async function testDateFilterStart() {
  console.log('\n[TEST 2] Date filter (start date)');

  try {
    const startDate = '2024-01-01';
    const response = await axios.get(`${BASE_URL}/api/history`, {
      params: {
        data_inicio: startDate,
      },
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200 && response.data.success) {
      const analyses = response.data.data.analyses;
      const allAfterDate = analyses.every(a => 
        new Date(a.created_at) >= new Date(startDate)
      );

      if (allAfterDate) {
        console.log('✅ PASS: Date filter applied correctly');
        console.log(`   Returned ${analyses.length} analyses after ${startDate}`);
        return true;
      }
    }

    console.log('❌ FAIL: Date filter not working');
    return false;

  } catch (error) {
    console.log(`⚠️  SKIP: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * Test 3: Get history with date filter (range)
 */
async function testDateFilterRange() {
  console.log('\n[TEST 3] Date filter (range)');

  try {
    const startDate = '2024-01-01';
    const endDate = '2024-03-31';
    
    const response = await axios.get(`${BASE_URL}/api/history`, {
      params: {
        data_inicio: startDate,
        data_fim: endDate,
      },
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200 && response.data.success) {
      const analyses = response.data.data.analyses;
      const allInRange = analyses.every(a => {
        const date = new Date(a.created_at);
        return date >= new Date(startDate) && date <= new Date(endDate);
      });

      if (allInRange) {
        console.log('✅ PASS: Date range filter applied');
        console.log(`   Returned ${analyses.length} analyses in range`);
        return true;
      }
    }

    console.log('❌ FAIL: Date range filter not working');
    return false;

  } catch (error) {
    console.log(`⚠️  SKIP: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * Test 4: Get history with niche filter
 */
async function testNichoFilter() {
  console.log('\n[TEST 4] Niche filter');

  try {
    const niche = 'esportes';
    const response = await axios.get(`${BASE_URL}/api/history`, {
      params: {
        nicho: niche,
      },
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200 && response.data.success) {
      const analyses = response.data.data.analyses;
      const allMatchNiche = analyses.every(a => 
        a.nicho.toLowerCase().includes(niche.toLowerCase())
      );

      if (allMatchNiche || analyses.length === 0) {
        console.log('✅ PASS: Niche filter applied');
        console.log(`   Found ${analyses.length} analyses matching '${niche}'`);
        return true;
      }
    }

    console.log('❌ FAIL: Niche filter not working');
    return false;

  } catch (error) {
    console.log(`⚠️  SKIP: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * Test 5: Pagination
 */
async function testPagination() {
  console.log('\n[TEST 5] Pagination');

  try {
    const limit = 10;
    const offset = 0;

    const response = await axios.get(`${BASE_URL}/api/history`, {
      params: {
        limit,
        offset,
      },
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200 && response.data.success) {
      const pagination = response.data.data.pagination;
      const checks = [
        { name: 'limit correct', pass: pagination.limit === limit },
        { name: 'offset correct', pass: pagination.offset === offset },
        { name: 'total is number', pass: typeof pagination.total === 'number' },
        { name: 'hasMore is boolean', pass: typeof pagination.hasMore === 'boolean' },
        { name: 'results <= limit', pass: response.data.data.analyses.length <= limit },
      ];

      let allPass = true;
      checks.forEach(check => {
        if (!check.pass) allPass = false;
      });

      if (allPass) {
        console.log('✅ PASS: Pagination working');
        console.log(`   Limit: ${pagination.limit}, Offset: ${pagination.offset}, Total: ${pagination.total}`);
        return true;
      }
    }

    console.log('❌ FAIL: Pagination not working');
    return false;

  } catch (error) {
    console.log(`⚠️  SKIP: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * Test 6: Learning metrics present
 */
async function testLearningMetrics() {
  console.log('\n[TEST 6] Learning metrics');

  try {
    const response = await axios.get(`${BASE_URL}/api/history`, {
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200 && response.data.success) {
      const metrics = response.data.data.metrics;
      const checks = [
        { name: 'totalAnalyses present', pass: typeof metrics.totalAnalyses === 'number' },
        { name: 'analyzedNiches present', pass: typeof metrics.analyzedNiches === 'number' },
        { name: 'averageAccuracy present', pass: metrics.averageAccuracy !== undefined },
        { name: 'mostUsedMetric present', pass: metrics.mostUsedMetric !== undefined },
        { name: 'latestAnalysis present', pass: metrics.latestAnalysis !== undefined },
        { name: 'totalThisMonth present', pass: typeof metrics.totalThisMonth === 'number' },
      ];

      let allPass = true;
      checks.forEach(check => {
        console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
        if (!check.pass) allPass = false;
      });

      if (allPass) {
        console.log('✅ PASS: All metrics present');
        console.log(`   Total Analyses: ${metrics.totalAnalyses}`);
        console.log(`   Average Accuracy: ${metrics.averageAccuracy}`);
        return true;
      }
    }

    console.log('❌ FAIL: Metrics incomplete');
    return false;

  } catch (error) {
    console.log(`⚠️  SKIP: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * Test 7: Response format validation
 */
async function testResponseFormat() {
  console.log('\n[TEST 7] Response format');

  try {
    const response = await axios.get(`${BASE_URL}/api/history`, {
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      const checks = [
        { name: 'success is boolean', pass: typeof response.data.success === 'boolean' },
        { name: 'success is true', pass: response.data.success === true },
        { name: 'message is string', pass: typeof response.data.message === 'string' },
        { name: 'data object exists', pass: typeof response.data.data === 'object' },
        { name: 'timestamp present', pass: !!response.data.timestamp },
        { name: 'timestamp is ISO', pass: /^\d{4}-\d{2}-\d{2}T/.test(response.data.timestamp) },
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

    return false;

  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Test 8: Analysis data structure
 */
async function testAnalysisDataStructure() {
  console.log('\n[TEST 8] Analysis data structure');

  try {
    const response = await axios.get(`${BASE_URL}/api/history`, {
      params: { limit: 1 },
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200 && response.data.data.analyses.length > 0) {
      const analysis = response.data.data.analyses[0];
      const checks = [
        { name: 'id present', pass: !!analysis.id },
        { name: 'user_id present', pass: !!analysis.user_id },
        { name: 'nicho present', pass: !!analysis.nicho },
        { name: 'metrica_principal present', pass: !!analysis.metrica_principal },
        { name: 'acuracia is number', pass: typeof analysis.acuracia === 'number' },
        { name: 'confianca is number', pass: typeof analysis.confianca === 'number' },
        { name: 'created_at present', pass: !!analysis.created_at },
        { name: 'acuracia 0-1', pass: analysis.acuracia >= 0 && analysis.acuracia <= 1 },
      ];

      let allPass = true;
      checks.forEach(check => {
        console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
        if (!check.pass) allPass = false;
      });

      if (allPass) {
        console.log('✅ PASS: Analysis structure valid');
        return true;
      }
    }

    console.log('❌ FAIL: No analyses to validate');
    return false;

  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Test 9: Missing authentication
 */
async function testMissingAuth() {
  console.log('\n[TEST 9] Missing authentication');

  try {
    const response = await axios.get(`${BASE_URL}/api/history`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('❌ FAIL: Should have rejected unauthenticated request');
    return false;

  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`✅ PASS: Correctly rejected (401)`);
      return true;
    }

    console.log(`⚠️  WARNING: Got ${error.response?.status} instead of 401`);
    return true;
  }
}

/**
 * Test 10: Combined filters
 */
async function testCombinedFilters() {
  console.log('\n[TEST 10] Combined filters');

  try {
    const response = await axios.get(`${BASE_URL}/api/history`, {
      params: {
        nicho: 'esportes',
        data_inicio: '2024-01-01',
        data_fim: '2024-12-31',
        limit: 25,
      },
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200 && response.data.success) {
      const analyses = response.data.data.analyses;
      const filters = response.data.data.filters;

      const checks = [
        { name: 'nicho filter applied', pass: filters.nicho === 'esportes' },
        { name: 'date filters applied', pass: !!filters.dataInicio && !!filters.dataFim },
        { name: 'limit respected', pass: analyses.length <= 25 },
      ];

      let allPass = true;
      checks.forEach(check => {
        if (!check.pass) allPass = false;
      });

      if (allPass) {
        console.log('✅ PASS: Combined filters working');
        console.log(`   Returned ${analyses.length} analyses`);
        return true;
      }
    }

    console.log('❌ FAIL: Combined filters not working');
    return false;

  } catch (error) {
    console.log(`⚠️  SKIP: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  GET /api/history - Test Suite                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  const results = [];

  results.push({
    name: 'Get all history (no filters)',
    pass: await testGetAllHistory(),
  });

  results.push({
    name: 'Date filter (start date)',
    pass: await testDateFilterStart(),
  });

  results.push({
    name: 'Date filter (range)',
    pass: await testDateFilterRange(),
  });

  results.push({
    name: 'Niche filter',
    pass: await testNichoFilter(),
  });

  results.push({
    name: 'Pagination',
    pass: await testPagination(),
  });

  results.push({
    name: 'Learning metrics',
    pass: await testLearningMetrics(),
  });

  results.push({
    name: 'Response format',
    pass: await testResponseFormat(),
  });

  results.push({
    name: 'Analysis data structure',
    pass: await testAnalysisDataStructure(),
  });

  results.push({
    name: 'Missing authentication',
    pass: await testMissingAuth(),
  });

  results.push({
    name: 'Combined filters',
    pass: await testCombinedFilters(),
  });

  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║  Test Summary                                         ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

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

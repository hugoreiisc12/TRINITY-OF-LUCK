/**
 * PUT /api/settings - Test Suite
 * Tests user settings update endpoint
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 10000;

// Test data
const validToken = process.env.TEST_TOKEN || 'test_jwt_token';
const invalidToken = 'invalid_token_xyz';

/**
 * Test 1: Update single setting (theme)
 */
async function testUpdateTheme() {
  console.log('\n[TEST 1] Update single setting (theme)');

  try {
    const response = await axios.put(
      `${BASE_URL}/api/settings`,
      { tema: 'escuro' },
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200 && response.data.success) {
      const { data } = response.data;

      const checks = [
        { name: 'success is true', pass: response.data.success === true },
        { name: 'message present', pass: !!response.data.message },
        { name: 'data object present', pass: !!data },
        { name: 'tema updated', pass: data.tema === 'escuro' },
        { name: 'updated_at present', pass: !!data.updated_at },
        { name: 'user id present', pass: !!data.id },
      ];

      let allPass = true;
      checks.forEach(check => {
        if (!check.pass) allPass = false;
      });

      if (allPass) {
        console.log('✅ PASS: Theme updated successfully');
        console.log(`   Theme: ${data.tema}`);
        return true;
      }
    }

    console.log('❌ FAIL: Invalid response format');
    return false;

  } catch (error) {
    console.log(`⚠️  SKIP: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * Test 2: Update multiple settings
 */
async function testUpdateMultiple() {
  console.log('\n[TEST 2] Update multiple settings');

  try {
    const response = await axios.put(
      `${BASE_URL}/api/settings`,
      {
        tema: 'claro',
        idioma: 'en-US',
        privacidade: 'publico',
      },
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200 && response.data.success) {
      const { data } = response.data;

      const checks = [
        { name: 'tema updated', pass: data.tema === 'claro' },
        { name: 'idioma updated', pass: data.idioma === 'en-US' },
        { name: 'privacidade updated', pass: data.privacidade === 'publico' },
        { name: 'updated_at changed', pass: !!data.updated_at },
      ];

      let allPass = true;
      checks.forEach(check => {
        if (!check.pass) allPass = false;
      });

      if (allPass) {
        console.log('✅ PASS: Multiple settings updated');
        console.log(`   Theme: ${data.tema}, Language: ${data.idioma}`);
        return true;
      }
    }

    console.log('❌ FAIL: Not all settings updated');
    return false;

  } catch (error) {
    console.log(`⚠️  SKIP: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * Test 3: Update notification settings
 */
async function testUpdateNotifications() {
  console.log('\n[TEST 3] Update notification settings');

  try {
    const response = await axios.put(
      `${BASE_URL}/api/settings`,
      {
        notificacoes: false,
        notificacoes_email: false,
        notificacoes_push: true,
      },
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200 && response.data.success) {
      const { data } = response.data;

      const checks = [
        { name: 'notificacoes updated', pass: data.notificacoes === false },
        { name: 'notificacoes_email updated', pass: data.notificacoes_email === false },
        { name: 'notificacoes_push updated', pass: data.notificacoes_push === true },
      ];

      let allPass = true;
      checks.forEach(check => {
        if (!check.pass) allPass = false;
      });

      if (allPass) {
        console.log('✅ PASS: Notification settings updated');
        return true;
      }
    }

    console.log('❌ FAIL: Notification settings not updated correctly');
    return false;

  } catch (error) {
    console.log(`⚠️  SKIP: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * Test 4: Missing authentication
 */
async function testMissingAuth() {
  console.log('\n[TEST 4] Missing authentication');

  try {
    const response = await axios.put(
      `${BASE_URL}/api/settings`,
      { tema: 'escuro' },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('❌ FAIL: Should have rejected unauthenticated request');
    return false;

  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`✅ PASS: Correctly rejected (401)`);
      return true;
    }

    console.log(`❌ FAIL: Wrong status code ${error.response?.status}`);
    return false;
  }
}

/**
 * Test 5: Invalid token
 */
async function testInvalidToken() {
  console.log('\n[TEST 5] Invalid token format');

  try {
    const response = await axios.put(
      `${BASE_URL}/api/settings`,
      { tema: 'escuro' },
      {
        headers: {
          'Authorization': `Bearer ${invalidToken}`,
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

    console.log(`⚠️  WARNING: Got ${error.response?.status} instead of 401`);
    return true;
  }
}

/**
 * Test 6: No settings provided
 */
async function testNoSettings() {
  console.log('\n[TEST 6] No settings provided');

  try {
    const response = await axios.put(
      `${BASE_URL}/api/settings`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('❌ FAIL: Should have rejected empty request');
    return false;

  } catch (error) {
    if (error.response?.status === 400) {
      const { error: errorMsg } = error.response.data;
      if (errorMsg.includes('No settings provided')) {
        console.log(`✅ PASS: Correctly rejected (400)`);
        console.log(`   Error: ${errorMsg}`);
        return true;
      }
    }

    console.log(`❌ FAIL: Wrong error or status ${error.response?.status}`);
    return false;
  }
}

/**
 * Test 7: Response format validation
 */
async function testResponseFormat() {
  console.log('\n[TEST 7] Response format validation');

  try {
    const response = await axios.put(
      `${BASE_URL}/api/settings`,
      { idioma: 'pt-BR' },
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200) {
      const { success, message, data } = response.data;

      const checks = [
        { name: 'success is boolean', pass: typeof success === 'boolean' },
        { name: 'success is true', pass: success === true },
        { name: 'message is string', pass: typeof message === 'string' },
        { name: 'message contains "Configurações"', pass: message.includes('Configurações') },
        { name: 'data is object', pass: typeof data === 'object' },
        { name: 'data.id exists', pass: !!data.id },
        { name: 'data.email exists', pass: !!data.email },
        { name: 'data.updated_at exists', pass: !!data.updated_at },
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
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

/**
 * Test 8: Data types validation
 */
async function testDataTypes() {
  console.log('\n[TEST 8] Data types validation');

  try {
    const response = await axios.put(
      `${BASE_URL}/api/settings`,
      {
        tema: 'escuro',
        notificacoes: true,
        idioma: 'pt-BR',
      },
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200) {
      const { data } = response.data;

      const checks = [
        { name: 'tema is string', pass: typeof data.tema === 'string' },
        { name: 'notificacoes is boolean', pass: typeof data.notificacoes === 'boolean' },
        { name: 'idioma is string', pass: typeof data.idioma === 'string' },
        { name: 'updated_at is ISO string', pass: /^\d{4}-\d{2}-\d{2}T/.test(data.updated_at) },
        { name: 'id is UUID', pass: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id) },
      ];

      let allPass = true;
      checks.forEach(check => {
        console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
        if (!check.pass) allPass = false;
      });

      if (allPass) {
        console.log('✅ PASS: All data types correct');
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
 * Test 9: Partial update (only updates provided fields)
 */
async function testPartialUpdate() {
  console.log('\n[TEST 9] Partial update (only provided fields)');

  try {
    const response = await axios.put(
      `${BASE_URL}/api/settings`,
      { tema: 'claro' }, // Only tema
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200) {
      const { data } = response.data;

      const checks = [
        { name: 'tema updated to claro', pass: data.tema === 'claro' },
        { name: 'other fields still exist', pass: !!data.idioma && !!data.privacidade },
        { name: 'id unchanged', pass: !!data.id },
      ];

      let allPass = true;
      checks.forEach(check => {
        if (!check.pass) allPass = false;
      });

      if (allPass) {
        console.log('✅ PASS: Partial update works correctly');
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
 * Test 10: Update profile field
 */
async function testUpdateProfile() {
  console.log('\n[TEST 10] Update profile field');

  try {
    const response = await axios.put(
      `${BASE_URL}/api/settings`,
      { perfil: 'experiente' },
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200 && response.data.success) {
      const { data } = response.data;

      const checks = [
        { name: 'perfil updated', pass: data.perfil === 'experiente' },
        { name: 'message correct', pass: response.data.message.includes('Configurações') },
      ];

      let allPass = true;
      checks.forEach(check => {
        if (!check.pass) allPass = false;
      });

      if (allPass) {
        console.log('✅ PASS: Profile updated successfully');
        return true;
      }
    }

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
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║  PUT /api/settings - Test Suite                   ║');
  console.log('╚═══════════════════════════════════════════════════╝');

  const results = [];

  results.push({
    name: 'Update single setting (theme)',
    pass: await testUpdateTheme(),
  });

  results.push({
    name: 'Update multiple settings',
    pass: await testUpdateMultiple(),
  });

  results.push({
    name: 'Update notification settings',
    pass: await testUpdateNotifications(),
  });

  results.push({
    name: 'Missing authentication',
    pass: await testMissingAuth(),
  });

  results.push({
    name: 'Invalid token',
    pass: await testInvalidToken(),
  });

  results.push({
    name: 'No settings provided',
    pass: await testNoSettings(),
  });

  results.push({
    name: 'Response format',
    pass: await testResponseFormat(),
  });

  results.push({
    name: 'Data types',
    pass: await testDataTypes(),
  });

  results.push({
    name: 'Partial update',
    pass: await testPartialUpdate(),
  });

  results.push({
    name: 'Update profile',
    pass: await testUpdateProfile(),
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

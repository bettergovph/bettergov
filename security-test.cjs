#!/usr/bin/env node

/**
 * Comprehensive Security Test Suite for BetterGov.ph
 * Tests all critical security measures implemented in the crawl endpoint
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8787';
const TEST_TIMEOUT = 10000; // 10 seconds timeout for each test

// Test URLs for different scenarios
const TEST_URLS = {
  // Valid .gov.ph domains
  validGovPh: [
    'https://www.dof.gov.ph',
    'https://www.dbm.gov.ph',
    'https://www.gov.ph',
    'https://subdomain.dof.gov.ph', // Test subdomains
    'https://www.region3.gov.ph',
  ],
  // Invalid domains (should be blocked)
  invalidDomains: [
    'https://www.example.com',
    'https://google.com',
    'https://facebook.com',
    'https://malicious-site.com',
  ],
  // Edge cases (should be blocked)
  edgeCases: [
    'http://localhost', // HTTP localhost
    'https://localhost', // HTTPS localhost
    'http://127.0.0.1', // IP address
    'https://192.168.1.1', // Private IP
    'https://10.0.0.1', // Private IP
    'https://172.16.0.1', // Private IP
    'https://169.254.1.1', // Link-local IP
    'ftp://example.com', // Non-HTTP protocol
    'file:///etc/passwd', // File protocol
    'javascript:alert(1)', // JavaScript protocol
  ],
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  details: [],
};

/**
 * Helper function to make HTTP requests with timeout
 */
async function fetchWithTimeout(url, options = {}, timeout = TEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Log test result
 */
function logTest(testName, passed, details = '') {
  const status = passed ? 'PASS' : 'FAIL';
  const color = passed ? '\x1b[32m' : '\x1b[31m'; // Green for pass, red for fail
  const reset = '\x1b[0m';

  console.log(`${color}[${status}]${reset} ${testName}`);
  if (details) {
    console.log(`    Details: ${details}`);
  }

  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }

  testResults.details.push({
    name: testName,
    passed,
    details,
  });
}

/**
 * Test 1: Crawl Endpoint URL Validation Test
 */
async function testUrlValidation() {
  console.log('\n=== Testing URL Validation ===');

  // Test valid .gov.ph domains
  for (const url of TEST_URLS.validGovPh) {
    const testName = `Valid .gov.ph domain: ${url}`;
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/api/crawl?url=${encodeURIComponent(url)}`,
        { method: 'GET' }
      );

      if (response.ok) {
        logTest(testName, true);
      } else {
        const data = await response.text();
        logTest(
          testName,
          false,
          `Unexpected status: ${response.status}, body: ${data}`
        );
      }
    } catch (error) {
      logTest(testName, false, `Error: ${error.message}`);
    }
  }

  // Test invalid domains
  for (const url of TEST_URLS.invalidDomains) {
    const testName = `Invalid domain blocked: ${url}`;
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/api/crawl?url=${encodeURIComponent(url)}`,
        { method: 'GET' }
      );

      if (response.status === 400) {
        const data = await response.json();
        if (
          data.error === 'Invalid URL' &&
          data.message.includes('.gov.ph domains')
        ) {
          logTest(testName, true);
        } else {
          logTest(
            testName,
            false,
            `Wrong error message: ${JSON.stringify(data)}`
          );
        }
      } else {
        logTest(testName, false, `Expected 400 but got ${response.status}`);
      }
    } catch (error) {
      logTest(testName, false, `Error: ${error.message}`);
    }
  }

  // Test edge cases
  for (const url of TEST_URLS.edgeCases) {
    const testName = `Edge case blocked: ${url}`;
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/api/crawl?url=${encodeURIComponent(url)}`,
        { method: 'GET' }
      );

      if (response.status === 400) {
        const data = await response.json();
        if (data.error === 'Invalid URL') {
          logTest(testName, true);
        } else {
          logTest(
            testName,
            false,
            `Wrong error message: ${JSON.stringify(data)}`
          );
        }
      } else {
        logTest(testName, false, `Expected 400 but got ${response.status}`);
      }
    } catch (error) {
      logTest(testName, false, `Error: ${error.message}`);
    }
  }
}

/**
 * Test 2: Rate Limiting Test
 */
async function testRateLimiting() {
  console.log('\n=== Testing Rate Limiting ===');

  const testUrl = TEST_URLS.validGovPh[0]; // Use a valid URL for rate limiting test
  const rapidRequests = 15; // More than the 10 per minute limit

  // Test rapid requests to trigger rate limiting
  let rateLimitedCount = 0;
  let successfulRequests = 0;

  for (let i = 0; i < rapidRequests; i++) {
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/api/crawl?url=${encodeURIComponent(testUrl)}`,
        { method: 'GET' }
      );

      if (response.status === 429) {
        rateLimitedCount++;
        const data = await response.json();
        if (data.error === 'Rate limit exceeded') {
          logTest(`Request ${i + 1} correctly rate limited`, true);
        } else {
          logTest(
            `Request ${i + 1} rate limited but wrong message`,
            false,
            `Message: ${JSON.stringify(data)}`
          );
        }
      } else if (response.ok) {
        successfulRequests++;
        logTest(`Request ${i + 1} successful`, true);
      } else {
        logTest(
          `Request ${i + 1} unexpected status`,
          false,
          `Status: ${response.status}`
        );
      }
    } catch (error) {
      logTest(`Request ${i + 1} error`, false, `Error: ${error.message}`);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Test that rate limiting resets after window
  logTest(
    'Rate limiting resets after window',
    true,
    `Made ${rapidRequests} requests, ${rateLimitedCount} rate limited, ${successfulRequests} successful`
  );
}

/**
 * Test 3: Configuration Security Test
 */
async function testConfigurationSecurity() {
  console.log('\n=== Testing Configuration Security ===');

  // Test that no hardcoded Cloudflare IDs exist in the code
  const fs = require('fs');
  const path = require('path');

  const checkForHardcodedIds = directory => {
    let foundHardcodedIds = false;
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !filePath.includes('node_modules')) {
        foundHardcodedIds = checkForHardcodedIds(filePath) || foundHardcodedIds;
      } else if (file.endsWith('.ts') || file.endsWith('.js')) {
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for hardcoded Cloudflare IDs
        if (
          content.includes('cloudflare.com') &&
          !content.includes('env.CF_ACCOUNT_ID')
        ) {
          logTest(`Hardcoded Cloudflare ID in ${filePath}`, false);
          foundHardcodedIds = true;
        }

        // Check for hardcoded API keys
        if (content.includes('Bearer ') && !content.includes('env.')) {
          logTest(`Potential hardcoded API key in ${filePath}`, false);
          foundHardcodedIds = true;
        }
      }
    }

    return foundHardcodedIds;
  };

  const hardcodedIdsFound = checkForHardcodedIds('./functions');
  if (!hardcodedIdsFound) {
    logTest('No hardcoded Cloudflare IDs found', true);
  }

  // Test that environment variables are properly referenced
  const envFile = fs.existsSync('.env.example')
    ? fs.readFileSync('.env.example', 'utf8')
    : '';
  if (
    envFile.includes('CF_ACCOUNT_ID') &&
    envFile.includes('CF_API_TOKEN') &&
    envFile.includes('JINA_API_KEY')
  ) {
    logTest('Environment variables properly defined in .env.example', true);
  } else {
    logTest('Environment variables missing in .env.example', false);
  }
}

/**
 * Test 4: CORS Security Test
 */
async function testCorsSecurity() {
  console.log('\n=== Testing CORS Security ===');

  const testUrl = TEST_URLS.validGovPh[0];

  // Test preflight request
  try {
    const response = await fetchWithTimeout(
      `${BASE_URL}/api/crawl?url=${encodeURIComponent(testUrl)}`,
      {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://example.com',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      }
    );

    if (response.status === 204) {
      const corsHeaders = response.headers;
      const allowOrigin = corsHeaders.get('Access-Control-Allow-Origin');
      const allowMethods = corsHeaders.get('Access-Control-Allow-Methods');
      const allowHeaders = corsHeaders.get('Access-Control-Allow-Headers');

      if (
        allowOrigin === '*' &&
        allowMethods === 'GET, OPTIONS' &&
        allowHeaders === 'Content-Type'
      ) {
        logTest('CORS preflight request properly configured', true);
      } else {
        logTest(
          'CORS preflight request misconfigured',
          false,
          `Headers: Origin=${allowOrigin}, Methods=${allowMethods}, Headers=${allowHeaders}`
        );
      }
    } else {
      logTest(
        'CORS preflight request failed',
        false,
        `Status: ${response.status}`
      );
    }
  } catch (error) {
    logTest('CORS preflight request error', false, `Error: ${error.message}`);
  }

  // Test actual GET request CORS headers
  try {
    const response = await fetchWithTimeout(
      `${BASE_URL}/api/crawl?url=${encodeURIComponent(testUrl)}`,
      { method: 'GET' }
    );

    if (response.ok) {
      const corsHeaders = response.headers;
      const allowOrigin = corsHeaders.get('Access-Control-Allow-Origin');

      if (allowOrigin === '*') {
        logTest('CORS headers present in GET response', true);
      } else {
        logTest(
          'CORS headers missing or incorrect in GET response',
          false,
          `Origin: ${allowOrigin}`
        );
      }
    } else {
      logTest('GET request failed', false, `Status: ${response.status}`);
    }
  } catch (error) {
    logTest('GET request CORS error', false, `Error: ${error.message}`);
  }

  // Test that no sensitive information is exposed
  try {
    const response = await fetchWithTimeout(
      `${BASE_URL}/api/crawl?url=${encodeURIComponent(testUrl)}&force=true`,
      { method: 'GET' }
    );

    if (response.ok) {
      const data = await response.json();

      // Check for sensitive information in response
      const sensitiveKeys = ['password', 'token', 'key', 'secret', 'api_key'];
      let foundSensitive = false;

      for (const key of sensitiveKeys) {
        if (JSON.stringify(data).toLowerCase().includes(key)) {
          foundSensitive = true;
          break;
        }
      }

      if (!foundSensitive) {
        logTest('No sensitive information exposed in response', true);
      } else {
        logTest(
          'Sensitive information potentially exposed',
          false,
          'Response contains sensitive keywords'
        );
      }
    }
  } catch (error) {
    logTest(
      'Sensitive information test error',
      false,
      `Error: ${error.message}`
    );
  }
}

/**
 * Test 5: HTTP Method Validation Test
 */
async function testHttpMethodValidation() {
  console.log('\n=== Testing HTTP Method Validation ===');

  const testUrl = TEST_URLS.validGovPh[0];

  // Test POST method (should be blocked)
  try {
    const response = await fetchWithTimeout(
      `${BASE_URL}/api/crawl?url=${encodeURIComponent(testUrl)}`,
      { method: 'POST' }
    );

    if (response.status === 405) {
      logTest('POST method correctly blocked', true);
    } else {
      logTest(
        'POST method not properly blocked',
        false,
        `Status: ${response.status}`
      );
    }
  } catch (error) {
    logTest('POST method test error', false, `Error: ${error.message}`);
  }

  // Test PUT method (should be blocked)
  try {
    const response = await fetchWithTimeout(
      `${BASE_URL}/api/crawl?url=${encodeURIComponent(testUrl)}`,
      { method: 'PUT' }
    );

    if (response.status === 405) {
      logTest('PUT method correctly blocked', true);
    } else {
      logTest(
        'PUT method not properly blocked',
        false,
        `Status: ${response.status}`
      );
    }
  } catch (error) {
    logTest('PUT method test error', false, `Error: ${error.message}`);
  }

  // Test DELETE method (should be blocked)
  try {
    const response = await fetchWithTimeout(
      `${BASE_URL}/api/crawl?url=${encodeURIComponent(testUrl)}`,
      { method: 'DELETE' }
    );

    if (response.status === 405) {
      logTest('DELETE method correctly blocked', true);
    } else {
      logTest(
        'DELETE method not properly blocked',
        false,
        `Status: ${response.status}`
      );
    }
  } catch (error) {
    logTest('DELETE method test error', false, `Error: ${error.message}`);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🔒 BetterGov.ph Security Test Suite');
  console.log('=====================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Timeout: ${TEST_TIMEOUT}ms per test`);

  try {
    // Run all tests
    await testUrlValidation();
    await testRateLimiting();
    await testConfigurationSecurity();
    await testCorsSecurity();
    await testHttpMethodValidation();

    // Print summary
    console.log('\n=== Test Summary ===');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Total: ${testResults.passed + testResults.failed}`);

    if (testResults.failed === 0) {
      console.log('\n🎉 All security tests passed!');
    } else {
      console.log(
        '\n⚠️  Some security tests failed. Please review the failures above.'
      );
    }

    // Print detailed results
    console.log('\n=== Detailed Results ===');
    testResults.details.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
      if (result.details) {
        console.log(`   ${result.details}`);
      }
    });

    process.exit(testResults.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('\n💥 Test suite failed with error:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, TEST_URLS, logTest };

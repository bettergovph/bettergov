#!/usr/bin/env node

/**
 * Simple manual security test for BetterGov.ph crawl endpoint
 * This tests individual scenarios manually without overwhelming the server
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8787';

async function testUrlValidation() {
  console.log('=== Manual URL Validation Test ===');

  const testCases = [
    {
      name: 'Valid .gov.ph domain',
      url: 'https://www.dof.gov.ph',
      expectedStatus: 200,
    },
    {
      name: 'Invalid domain',
      url: 'https://www.example.com',
      expectedStatus: 400,
    },
    {
      name: 'Localhost (should be blocked)',
      url: 'http://localhost',
      expectedStatus: 400,
    },
    {
      name: 'IP address (should be blocked)',
      url: 'https://127.0.0.1',
      expectedStatus: 400,
    },
  ];

  for (const testCase of testCases) {
    console.log(`\nTesting: ${testCase.name}`);
    try {
      const response = await fetch(
        `${BASE_URL}/api/crawl?url=${encodeURIComponent(testCase.url)}`
      );
      console.log(`Status: ${response.status}`);

      if (response.status === testCase.expectedStatus) {
        console.log('✅ PASS');
      } else {
        const data = await response.text();
        console.log(
          `❌ FAIL - Expected ${testCase.expectedStatus}, got ${response.status}`
        );
        console.log(`Response: ${data.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`❌ ERROR - ${error.message}`);
    }

    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function testCORS() {
  console.log('\n=== Manual CORS Test ===');

  try {
    const response = await fetch(
      `${BASE_URL}/api/crawl?url=https://www.dof.gov.ph`,
      {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://example.com',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      }
    );

    console.log(`OPTIONS Status: ${response.status}`);
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get(
        'Access-Control-Allow-Origin'
      ),
      'Access-Control-Allow-Methods': response.headers.get(
        'Access-Control-Allow-Methods'
      ),
      'Access-Control-Allow-Headers': response.headers.get(
        'Access-Control-Allow-Headers'
      ),
    };

    console.log('CORS Headers:', corsHeaders);

    if (
      response.status === 204 &&
      corsHeaders['Access-Control-Allow-Origin'] === '*'
    ) {
      console.log('✅ CORS properly configured');
    } else {
      console.log('❌ CORS misconfigured');
    }
  } catch (error) {
    console.log(`❌ CORS test error - ${error.message}`);
  }
}

async function testMethodValidation() {
  console.log('\n=== Manual HTTP Method Validation Test ===');

  const methods = ['POST', 'PUT', 'DELETE'];

  for (const method of methods) {
    console.log(`\nTesting ${method} method`);
    try {
      const response = await fetch(
        `${BASE_URL}/api/crawl?url=https://www.dof.gov.ph`,
        {
          method: method,
        }
      );

      console.log(`${method} Status: ${response.status}`);

      if (response.status === 405) {
        console.log('✅ PASS - Method correctly blocked');
      } else {
        console.log(`❌ FAIL - Expected 405, got ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ERROR - ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function main() {
  console.log('🔒 BetterGov.ph Manual Security Test');
  console.log('=====================================');
  console.log(`Base URL: ${BASE_URL}\n`);

  try {
    await testUrlValidation();
    await testCORS();
    await testMethodValidation();

    console.log('\n✅ Manual testing completed!');
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, testUrlValidation, testCORS, testMethodValidation };

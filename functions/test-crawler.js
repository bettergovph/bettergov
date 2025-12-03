// Simple test script for web crawler functionality
// Run this script with: node test-crawler.js <url> [crawler_type]

// Example:
// - Test with Jina crawler: node test-crawler.js https://www.dof.gov.ph jina
// - Test with Cloudflare Browser crawler: node test-crawler.js https://www.dof.gov.ph cfbrowser

const url = process.argv[2] || 'https://www.dof.gov.ph';
const crawlerType = process.argv[3] || 'jina'; // Default to jina if not specified

console.log(
  `Testing web crawler with URL: ${url} using ${crawlerType} crawler`
);

// Test the local API endpoint with default cache behavior
console.log('\nTesting local API endpoint with specified crawler...');
const fetchUrl = `http://localhost:8787/api/crawl?url=${encodeURIComponent(url)}&crawler=${crawlerType}`;

console.log(`\nFetching URL: ${fetchUrl}`);

// Test 1: Basic fetch with specified crawler
fetch(fetchUrl)
  .then(response => response.json())
  .then(data => {
    console.log('\n===== BASIC FETCH RESPONSE =====');
    console.log('Title:', data.title || data.data?.title);
    console.log(
      'Content length:',
      data.content?.length || data.data?.content?.length || 0
    );
    console.log('Crawler:', data.crawler);
    console.log('Cached:', data.cached ? 'Yes' : 'No');

    // Test 2: Force update
    console.log('\nTesting force update...');
    return fetch(
      `http://localhost:8787/api/crawl?url=${encodeURIComponent(url)}&force=true&crawler=${crawlerType}`
    );
  })
  .then(response => response.json())
  .then(data => {
    console.log('\n===== FORCE UPDATE RESPONSE =====');
    console.log('Title:', data.title || data.data?.title);
    console.log(
      'Content length:',
      data.content?.length || data.data?.content?.length || 0
    );
    console.log('Crawler:', data.crawler);
    console.log('Cached:', data.cached ? 'Yes' : 'No');

    // Test 3: Alternative crawler if we're not already using it
    const altCrawler = crawlerType === 'jina' ? 'cfbrowser' : 'jina';
    console.log(`\nTesting with alternative crawler (${altCrawler})...`);
    return fetch(
      `http://localhost:8787/api/crawl?url=${encodeURIComponent(url)}&force=true&crawler=${altCrawler}`
    );
  })
  .then(response => response.json())
  .catch(error => {
    console.error('\nError during test:', error);
  });

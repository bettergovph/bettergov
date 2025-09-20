// scripts/create_search_key.cjs
require('dotenv').config();
const { MeiliSearch } = require('meilisearch');

const MEILISEARCH_HOST =
  process.env.VITE_MEILISEARCH_HOST || 'http://localhost';
const MEILISEARCH_PORT = process.env.VITE_MEILISEARCH_PORT || '7700';
// IMPORTANT: This script MUST use the Meilisearch Master Key for authentication
const MEILISEARCH_MASTER_KEY = process.env.MEILISEARCH_MASTER_KEY;

if (!MEILISEARCH_MASTER_KEY) {
  console.error(
    'Error: MEILISEARCH_MASTER_KEY is not defined in your .env file.'
  );
  console.error(
    'Please ensure your .env file contains the Meilisearch master key.'
  );
  process.exit(1);
}

const client = new MeiliSearch({
  host: `${MEILISEARCH_HOST}:${MEILISEARCH_PORT}`,
  apiKey: MEILISEARCH_MASTER_KEY,
});

async function createSearchKey() {
  console.log('Attempting to create a new search-only API key...');
  try {
    const newKey = await client.createKey({
      description: 'Public search-only key for BetterGov frontend',
      actions: ['search'], // Only allows search action
      indexes: ['bettergov', 'bettergov_flood_control', 'contractors'], // Restricted to the 'bettergov' indices only.
      expiresAt: null, // Key does not expire
    });

    console.log('\nSuccessfully created new search API key:');
    console.log('------------------------------------------');
    console.log('Key UID:', newKey.uid);
    console.log('Description:', newKey.description);
    console.log('Actions:', newKey.actions);
    console.log('Indexes:', newKey.indexes);
    console.log('Expires At:', newKey.expiresAt);
    console.log('Created At:', newKey.createdAt);
    console.log('Updated At:', newKey.updatedAt);
    console.log(
      '\nIMPORTANT: API Key Value (use this in your .env for VITE_MEILISEARCH_SEARCH_API_KEY):'
    );
    console.log('******************************************');
    console.log(newKey.key);
    console.log('******************************************');
    console.log(
      '\nRemember to store this key securely if needed elsewhere, but primarily update your .env file.'
    );
  } catch (error) {
    console.error('\nError creating search API key:');
    if (error.response && error.response.data) {
      console.error('Meilisearch API Error:', error.response.data);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

createSearchKey();

// scripts/index_flood_control.cjs
require('dotenv').config(); // To load .env file

const { MeiliSearch } = require('meilisearch');
const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const { createReadStream } = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const RESET_INDEX = args.includes('--reset') || args.includes('-r');

// MeiliSearch configuration
const MEILISEARCH_HOST =
  process.env.VITE_MEILISEARCH_HOST || 'http://localhost';
const MEILISEARCH_PORT = process.env.VITE_MEILISEARCH_PORT || '7700';
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_MASTER_KEY || ''; // Use MASTER KEY for admin operations

const client = new MeiliSearch({
  host: `${MEILISEARCH_HOST}:${MEILISEARCH_PORT}`,
  apiKey: MEILISEARCH_API_KEY,
});

const INDEX_NAME = 'bettergov_flood_control';

// Path to the CSV file
const csvFilePath = path.join(
  __dirname,
  '..',
  'src',
  'data',
  'flood_control',
  'flood_control.csv'
);

// Define settings for the flood control index
const FLOOD_CONTROL_INDEX_SETTINGS = {
  filterableAttributes: [
    'region',
    'contractor',
    'start_date',
    'completion_date',
    'contract_cost_numeric',
  ],
  sortableAttributes: [
    'region',
    'contractor',
    'start_date',
    'completion_date',
    'contract_cost_numeric',
  ],
  searchableAttributes: [
    'project_title',
    'location',
    'contractor',
    'region',
    'contract_id',
    'data_contractor',
    'data_location',
  ],
  displayedAttributes: ['*'],
};

console.log(
  RESET_INDEX
    ? 'Running with --reset flag: Will recreate the index from scratch.'
    : 'Running in update mode: Will add/update documents in the existing index.'
);

// Function to parse CSV data
async function parseCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];

    createReadStream(filePath)
      .pipe(csv())
      .on('data', data => results.push(data))
      .on('end', () => {
        console.log(
          `Successfully parsed ${results.length} records from CSV file`
        );
        resolve(results);
      })
      .on('error', error => {
        reject(error);
      });
  });
}

// Function to generate a slug for each record
function generateSlug(record) {
  // Generate a slug based on project_title and contract_id
  const baseSlug = record.project_title
    ? record.project_title
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '')
    : '';

  // Append contract_id to make it more unique if available
  return record.contract_id ? `${baseSlug}-${record.contract_id}` : baseSlug;
}

// Process numeric fields to ensure they are stored as numbers
function processNumericFields(record) {
  // Convert contract_cost_numeric to a number if it's a string
  if (record.contract_cost_numeric) {
    const numericValue = parseFloat(record.contract_cost_numeric);
    if (!isNaN(numericValue)) {
      record.contract_cost_numeric = numericValue;
    }
  }
  return record;
}

async function main() {
  console.log(
    `Starting Meilisearch indexing script for the flood control index: ${INDEX_NAME}`
  );

  try {
    const health = await client.health();
    console.log('Meilisearch server is healthy:', health);
  } catch (e) {
    console.error('Could not connect to Meilisearch.', e);
    return;
  }

  // Check if the index exists, create it if it doesn't, or reset if requested
  try {
    let indexExists = false;

    try {
      await client.getIndex(INDEX_NAME);
      indexExists = true;
    } catch (e) {
      if (e.code === 'index_not_found') {
        indexExists = false;
      } else {
        throw e; // Re-throw if it's a different error
      }
    }

    if (indexExists) {
      if (RESET_INDEX) {
        console.log(
          `Index '${INDEX_NAME}' exists and --reset flag was provided. Deleting index...`
        );
        await client.deleteIndex(INDEX_NAME);
        console.log(`Index '${INDEX_NAME}' deleted successfully.`);

        // Create a new index
        const task = await client.createIndex(INDEX_NAME, {
          primaryKey: 'slug',
        });
        console.log(`Index '${INDEX_NAME}' recreated successfully.`);
        const settingsTask = await client
          .index(INDEX_NAME)
          .updateSettings(FLOOD_CONTROL_INDEX_SETTINGS);
        console.log(`Settings updated for new index '${INDEX_NAME}'.`);
      } else {
        console.log(`Index '${INDEX_NAME}' already exists. Updating settings.`);
        const task = await client
          .index(INDEX_NAME)
          .updateSettings(FLOOD_CONTROL_INDEX_SETTINGS);
        console.log(`Settings updated for index '${INDEX_NAME}'.`);
      }
    } else {
      console.log(`Index '${INDEX_NAME}' not found. Creating...`);
      try {
        const task = await client.createIndex(INDEX_NAME, {
          primaryKey: 'slug',
        });
        console.log(`Index '${INDEX_NAME}' created successfully.`);
        const settingsTask = await client
          .index(INDEX_NAME)
          .updateSettings(FLOOD_CONTROL_INDEX_SETTINGS);
        console.log(`Settings updated for index '${INDEX_NAME}'.`);
      } catch (createError) {
        console.error(`Error creating index '${INDEX_NAME}':`, createError);
        return;
      }
    }
  } catch (error) {
    console.error(`Error managing index '${INDEX_NAME}':`, error);
    return;
  }

  // Parse CSV data and prepare documents
  try {
    console.log(`Processing CSV data from ${csvFilePath}`);
    const csvData = await parseCSVFile(csvFilePath);

    if (!csvData || csvData.length === 0) {
      console.log('No data found in CSV file or file is empty.');
      return;
    }

    console.log(`Preparing ${csvData.length} documents for indexing...`);

    const documentsToIndex = csvData.map((record, index) => {
      // Process the record to ensure numeric fields are proper numbers
      const processedRecord = processNumericFields(record);

      // Generate a slug for the record
      const itemSlug =
        generateSlug(processedRecord) || `flood-control-${index}`;

      return {
        ...processedRecord,
        id: processedRecord.contract_id || itemSlug,
        slug: itemSlug,
        type: 'flood_control',
      };
    });

    if (documentsToIndex.length > 0) {
      console.log(
        `Indexing ${documentsToIndex.length} flood control documents...`
      );

      // Get a reference to the index and add documents
      const index = client.index(INDEX_NAME);
      const task = await index.addDocuments(documentsToIndex, {
        primaryKey: 'slug',
      });

      console.log(
        `${documentsToIndex.length} documents successfully processed for index '${INDEX_NAME}'. Task ID: ${task.taskUid}`
      );
    } else {
      console.log(`No documents to index for '${INDEX_NAME}'.`);
    }
  } catch (error) {
    console.error('Error processing CSV data:', error);
  }

  console.log(`Meilisearch indexing script for '${INDEX_NAME}' finished.`);
}

main().catch(error => {
  console.error(
    'An unexpected error occurred during Meilisearch indexing:',
    error
  );
});

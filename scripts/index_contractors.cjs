// scripts/index_contractors.cjs
require('dotenv').config(); // To load .env file

const { MeiliSearch } = require('meilisearch');
const fs = require('fs').promises;
const path = require('path');

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

const INDEX_NAME = 'contractors';

// Path to the contractors directory
const contractorsDir = path.join(
  __dirname,
  '..',
  'src',
  'data',
  'flood_control',
  'lookups',
  'contractors'
);

// Define settings for the contractors index
const CONTRACTORS_INDEX_SETTINGS = {
  filterableAttributes: [
    'slug',
    'company_name',
    'ceo',
    'employees',
    'employee_count',
    'locations',
    'incorporation_date',
    'license',
    'sec_registration',
    'type',
  ],
  sortableAttributes: [
    'company_name',
    'employees',
    'employee_count',
    'incorporation_date',
    'created_at',
  ],
  searchableAttributes: [
    'company_name',
    'description',
    'ceo',
    'address',
    'license',
    'sec_registration',
    'key_personnel.name',
    'key_personnel.role',
    'locations',
    'related_companies.title',
  ],
  displayedAttributes: ['*'],
};

console.log(
  RESET_INDEX
    ? 'Running with --reset flag: Will recreate the index from scratch.'
    : 'Running in update mode: Will add/update documents in the existing index.'
);

// Function to read all contractor JSON files
async function readContractorFiles(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    console.log(`Found ${jsonFiles.length} contractor JSON files`);

    const contractors = [];

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(dirPath, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const contractorData = JSON.parse(fileContent);

        // Ensure the contractor has a slug (should already be in the file)
        if (!contractorData.slug) {
          contractorData.slug = path.basename(file, '.json');
        }

        contractors.push(contractorData);
      } catch (fileError) {
        console.warn(
          `Warning: Could not read file ${file}:`,
          fileError.message
        );
      }
    }

    console.log(`Successfully parsed ${contractors.length} contractor records`);
    return contractors;
  } catch (error) {
    console.error('Error reading contractor directory:', error);
    return [];
  }
}

// Process contractor data for indexing
function processContractorData(contractor) {
  // Ensure numeric fields are properly typed
  if (contractor.employees && typeof contractor.employees === 'string') {
    const numEmployees = parseInt(contractor.employees);
    if (!isNaN(numEmployees)) {
      contractor.employees = numEmployees;
    }
  }

  if (
    contractor.employee_count &&
    typeof contractor.employee_count === 'string'
  ) {
    const numEmployeeCount = parseInt(contractor.employee_count);
    if (!isNaN(numEmployeeCount)) {
      contractor.employee_count = numEmployeeCount;
    }
  }

  // Add type field for filtering
  contractor.type = 'contractor';

  // Ensure locations is an array
  if (contractor.locations && !Array.isArray(contractor.locations)) {
    contractor.locations = [contractor.locations];
  }

  // Ensure key_personnel is an array
  if (contractor.key_personnel && !Array.isArray(contractor.key_personnel)) {
    contractor.key_personnel = [];
  }

  // Ensure related_companies is an array
  if (
    contractor.related_companies &&
    !Array.isArray(contractor.related_companies)
  ) {
    contractor.related_companies = [];
  }

  // Ensure sources is an array
  if (contractor.sources && !Array.isArray(contractor.sources)) {
    contractor.sources = [];
  }

  // Ensure articles is an array
  if (contractor.articles && !Array.isArray(contractor.articles)) {
    contractor.articles = [];
  }

  return contractor;
}

async function main() {
  console.log(
    `Starting Meilisearch indexing script for the contractors index: ${INDEX_NAME}`
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
        // throw e; // Re-throw if it's a different error
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
          .updateSettings(CONTRACTORS_INDEX_SETTINGS);
        console.log(`Settings updated for new index '${INDEX_NAME}'.`);
      } else {
        console.log(`Index '${INDEX_NAME}' already exists. Updating settings.`);
        const task = await client
          .index(INDEX_NAME)
          .updateSettings(CONTRACTORS_INDEX_SETTINGS);
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
          .updateSettings(CONTRACTORS_INDEX_SETTINGS);
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

  // Read contractor data and prepare documents
  try {
    console.log(`Processing contractor data from ${contractorsDir}`);
    const contractorData = await readContractorFiles(contractorsDir);

    if (!contractorData || contractorData.length === 0) {
      console.log('No contractor data found or directory is empty.');
      return;
    }

    console.log(
      `Preparing ${contractorData.length} contractor documents for indexing...`
    );

    const documentsToIndex = contractorData.map((contractor, index) => {
      // Process the contractor data to ensure proper typing
      const processedContractor = processContractorData(contractor);

      // Ensure we have a valid slug
      if (!processedContractor.slug) {
        processedContractor.slug = `contractor-${index}`;
      }

      return processedContractor;
    });

    if (documentsToIndex.length > 0) {
      console.log(
        `Indexing ${documentsToIndex.length} contractor documents...`
      );

      // Get a reference to the index and add documents
      const index = client.index(INDEX_NAME);
      const task = await index.addDocuments(documentsToIndex, {
        primaryKey: 'slug',
      });

      console.log(
        `${documentsToIndex.length} contractor documents successfully processed for index '${INDEX_NAME}'. Task ID: ${task.taskUid}`
      );

      // Log some sample data for verification
      console.log('Sample contractor data:');
      console.log(JSON.stringify(documentsToIndex.slice(0, 2), null, 2));
    } else {
      console.log(`No contractor documents to index for '${INDEX_NAME}'.`);
    }
  } catch (error) {
    console.error('Error processing contractor data:', error);
  }

  console.log(`Meilisearch indexing script for '${INDEX_NAME}' finished.`);
}

main().catch(error => {
  console.error(
    'An unexpected error occurred during Meilisearch indexing:',
    error
  );
});

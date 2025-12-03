// scripts/index_flood_control_arcgis.js
import { MeiliSearch } from 'meilisearch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Constants
const MEILISEARCH_HOST =
  process.env.VITE_MEILISEARCH_HOST || 'http://localhost';
const MEILISEARCH_PORT = process.env.VITE_MEILISEARCH_PORT || '7700';
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_MASTER_KEY || ''; // Use MASTER KEY for admin operations
const INDEX_NAME = 'bettergov_flood_control';

// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JSON_FILE_PATH = path.join(
  __dirname,
  '../src/data/flood_control/flood_control.json'
);

// Check for the reset flag
const RESET_INDEX = process.argv.includes('--reset');

// Initialize MeiliSearch client
const client = new MeiliSearch({
  host: `${MEILISEARCH_HOST}:${MEILISEARCH_PORT}`,
  apiKey: MEILISEARCH_API_KEY,
});

console.log(
  RESET_INDEX
    ? 'Running with --reset flag: Will recreate the index from scratch.'
    : 'Running in update mode: Will add/update documents in the existing index.'
);

// Function to read and parse JSON data
async function readJSONFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading JSON file: ${error.message}`);
    throw error;
  }
}

// Function to extract features from ArcGIS REST format
function extractFeatures(arcgisData) {
  if (!arcgisData.features || !Array.isArray(arcgisData.features)) {
    console.error('Invalid ArcGIS data format: features array not found');
    return [];
  }

  // Extract just the attributes from each feature and add type field
  return arcgisData.features.map(feature => {
    const attributes = feature.attributes || {};

    // Add type field for filtering
    attributes.type = 'flood_control';

    // Add a slug field for SEO-friendly URLs
    if (attributes.ProjectDescription) {
      const baseSlug = attributes.ProjectDescription.toString()
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/^-+/, '') // Remove leading hyphens
        .replace(/-+$/, ''); // Remove trailing hyphens

      // Append ContractID to make it more unique if available
      attributes.slug = attributes.ContractID
        ? `${baseSlug}-${attributes.ContractID.toLowerCase()}`
        : baseSlug;
    }

    // Create _geo field from Latitude and Longitude for Meilisearch geo search
    if (attributes.Latitude && attributes.Longitude) {
      const lat = parseFloat(attributes.Latitude);
      const lng = parseFloat(attributes.Longitude);

      // Only add _geo if we have valid coordinates
      if (!isNaN(lat) && !isNaN(lng)) {
        attributes._geo = {
          lat: lat,
          lng: lng,
        };
      }
    }

    return attributes;
  });
}

// Main function to run the indexing process
async function main() {
  console.log(
    `Starting Meilisearch indexing script for the flood control index: ${INDEX_NAME}`
  );

  try {
    // Check if MeiliSearch is running
    const health = await client.health();
    console.log('Meilisearch server is healthy:', health);

    // Manage the index
    console.log(`Managing index: ${INDEX_NAME}`);

    // Check if index exists
    const indexes = await client.getIndexes();
    const indexExists = indexes.results.some(index => index.uid === INDEX_NAME);

    if (indexExists && RESET_INDEX) {
      console.log(
        `Index '${INDEX_NAME}' exists and reset flag was provided. Deleting index...`
      );
      await client.deleteIndex(INDEX_NAME);
      console.log(`Index '${INDEX_NAME}' deleted successfully.`);
    }

    // Create index if it doesn't exist or was deleted
    if (!indexExists || RESET_INDEX) {
      await client.createIndex(INDEX_NAME, { primaryKey: 'GlobalID' });
      console.log(`Index '${INDEX_NAME}' recreated successfully.`);

      // Configure index settings
      const index = client.index(INDEX_NAME);
      await index.updateSettings({
        searchableAttributes: [
          'ProjectDescription',
          'Municipality',
          'Contractor',
          'Region',
          'ContractID',
          'ProjectID',
          'Province',
          'LegislativeDistrict',
          'DistrictEngineeringOffice',
        ],
        filterableAttributes: [
          'slug',
          'Municipality',
          'Region',
          'Province',
          'StartDate',
          'CompletionDateActual',
          'Contractor',
          'type',
          'FundingYear',
          'Latitude',
          'Longitude',
          'TypeofWork',
          'LegislativeDistrict',
          'DistrictEngineeringOffice',
          'GlobalID',
          '_geo',
        ],
        sortableAttributes: [
          'ContractCost',
          'ABC',
          'StartDate',
          'CompletionDateActual',
          'FundingYear',
        ],
        typoTolerance: {
          enabled: true,
          minWordSizeForTypos: {
            oneTypo: 4,
            twoTypos: 8,
          },
        },
      });
      console.log(`Settings updated for new index '${INDEX_NAME}'.`);
    }

    // Process JSON data
    console.log(`Processing JSON data from ${JSON_FILE_PATH}`);
    const arcgisData = await readJSONFile(JSON_FILE_PATH);

    if (!arcgisData || !arcgisData.features) {
      console.log('No features found in JSON file or file is empty.');
      return;
    }

    // Extract features from ArcGIS format
    const documents = extractFeatures(arcgisData);

    if (documents.length === 0) {
      console.log('No documents extracted from the ArcGIS data.');
      return;
    }

    console.log(`Preparing ${documents.length} documents for indexing...`);

    // Get batch size from command line or use default
    const batchSize = process.argv.find(arg => arg.startsWith('--batch='))
      ? parseInt(
          process.argv.find(arg => arg.startsWith('--batch=')).split('=')[1]
        )
      : 500;

    console.log(`Using batch size of ${batchSize} documents`);

    // Process in batches to avoid memory issues
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      console.log(
        `Indexing batch ${Math.floor(i / batchSize) + 1} with ${batch.length} documents (${i + 1}-${Math.min(i + batchSize, documents.length)} of ${documents.length})...`
      );

      // Get a reference to the index and add documents
      const index = client.index(INDEX_NAME);
      const task = await index.addDocuments(batch, {
        primaryKey: 'GlobalID',
      });

      console.log(
        `Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} documents processed for index '${INDEX_NAME}'. Task ID: ${task.taskUid}. Task status: ${task.status}. Task: ${task.enqueuedAt}`
      );
    }
  } catch (error) {
    console.error('Error processing JSON data:', error);
  }

  console.log(`Meilisearch indexing script for '${INDEX_NAME}' finished.`);
}

// Run the main function
main();

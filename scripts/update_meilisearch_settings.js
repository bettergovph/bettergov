#!/usr/bin/env node
import { MeiliSearch } from 'meilisearch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Constants
const MEILISEARCH_HOST =
  process.env.VITE_MEILISEARCH_HOST || 'http://localhost';
const MEILISEARCH_PORT = process.env.VITE_MEILISEARCH_PORT || '7700';
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_MASTER_KEY || ''; // Use MASTER KEY for admin operations
const INDEX_NAME = 'bettergov_flood_control';

console.log('Updating Meilisearch settings for', INDEX_NAME);

// Initialize MeiliSearch client
const client = new MeiliSearch({
  host: `${MEILISEARCH_HOST}:${MEILISEARCH_PORT}`,
  apiKey: MEILISEARCH_API_KEY,
});

async function updateSettings() {
  try {
    console.log(`Setting maxTotalHits to 10000 for index ${INDEX_NAME}...`);

    // update only the pagination setting to ensure it gets applied
    const paginationResult = await client.index(INDEX_NAME).updatePagination({
      maxTotalHits: 10000,
    });
    console.log('Pagination update result:', paginationResult);

    // wait bit for the task to process
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Pagination settings applied successfully');

    // Update the other settings
    await client.index(INDEX_NAME).updateSettings({
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
    });

    const contractorIndex = client.index('contractors');
    await contractorIndex.updateSettings({
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
    });

    console.log('Settings updated successfully!');

    // Verify the settings were updated
    const settings = await client.index(INDEX_NAME).getSettings();
    console.log('Current settings:', JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error(`Error updating settings: ${error.message}`);
    process.exit(1);
  }
}

// Run the update function
updateSettings();

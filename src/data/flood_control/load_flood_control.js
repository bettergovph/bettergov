#!/usr/bin/env node

/**
 * Local JSON to Cloudflare D1 Database Loader
 * Run with: node load_flood_control.js
 *
 * Requirements:
 * - Node.js
 * - wrangler CLI installed and authenticated
 * - D1 database configured in wrangler.toml
 */

import { readFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration - update these values for your setup
const CONFIG = {
  databaseName: 'bettergov', // Replace with your D1 database name
  jsonFilePath: './flood_control.json',
  batchSize: 100, // Number of records to process in each batch
};

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting JSON import process...');

    // Validate input
    if (!CONFIG.jsonFilePath) {
      console.error('❌ Please provide a JSON file path as an argument');
      console.log('Usage: node load_flood_control.js');
      process.exit(1);
    }

    // Check if file exists
    try {
      readFileSync(CONFIG.jsonFilePath, 'utf8');
    } catch (error) {
      console.error(`❌ Cannot read file: ${CONFIG.jsonFilePath}`);
      console.error(error.message);
      process.exit(1);
    }

    // Parse JSON
    console.log(`📄 Reading JSON file: ${CONFIG.jsonFilePath}`);
    const jsonText = readFileSync(CONFIG.jsonFilePath, 'utf8');
    const contracts = JSON.parse(jsonText);

    console.log(`✅ Parsed ${contracts.length} contract records`);

    // Process contracts to ensure they have the right format
    const processedContracts = contracts.map(contract =>
      processContract(contract)
    );

    // Validate contracts
    const validContracts = processedContracts.filter(contract => {
      if (!contract.contract_id) {
        console.warn(
          `⚠️  Skipping record without contract_id: ${JSON.stringify(contract)}`
        );
        return false;
      }
      return true;
    });

    console.log(`✅ ${validContracts.length} valid contracts ready for import`);

    // Insert contracts in batches
    await insertContractsInBatches(validContracts);

    console.log('🎉 Import completed successfully!');
  } catch (error) {
    console.error('❌ Error during import:', error.message);
    process.exit(1);
  }
}

// No CSV parsing functions needed for JSON processing

/**
 * Process and validate contract data from JSON
 */
function processContract(contract) {
  return {
    contract_id:
      contract.contract_id?.toString().trim() ||
      contract.id?.toString().trim() ||
      null,
    project_title: contract.project_title?.toString().trim() || null,
    location: contract.location?.toString().trim() || null,
    contractor: contract.contractor?.toString().trim() || null,
    contract_cost_raw: contract.contract_cost_raw?.toString().trim() || null,
    contract_cost_numeric:
      typeof contract.contract_cost_numeric === 'number'
        ? contract.contract_cost_numeric
        : parseNumericCost(contract.contract_cost_numeric) || null,
    start_date: formatDate(contract.start_date) || null,
    completion_date: formatDate(contract.completion_date) || null,
    region: contract.region?.toString().trim() || null,
  };
}

/**
 * Parse numeric cost, handling currency symbols and formatting
 */
function parseNumericCost(costStr) {
  if (!costStr) return null;

  // Remove currency symbols, commas, and spaces
  const cleaned = costStr.toString().replace(/[$£€¥,\s]/g, '');
  const numeric = parseFloat(cleaned);

  return isNaN(numeric) ? null : numeric;
}

/**
 * Format date string to YYYY-MM-DD format
 */
function formatDate(dateStr) {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

/**
 * Insert contracts into D1 database using wrangler CLI
 */
async function insertContractsInBatches(contracts) {
  const totalBatches = Math.ceil(contracts.length / CONFIG.batchSize);
  let processedCount = 0;

  for (let i = 0; i < contracts.length; i += CONFIG.batchSize) {
    const batch = contracts.slice(i, i + CONFIG.batchSize);
    const batchNumber = Math.floor(i / CONFIG.batchSize) + 1;

    console.log(
      `📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)...`
    );

    try {
      await insertBatch(batch);
      processedCount += batch.length;
      console.log(
        `✅ Batch ${batchNumber} completed. Total processed: ${processedCount}/${contracts.length}`
      );
    } catch (error) {
      console.error(`❌ Error in batch ${batchNumber}:`, error.message);
      // Continue with next batch instead of failing completely
    }
  }
}

/**
 * Insert a batch of contracts using wrangler d1 execute
 */
async function insertBatch(contracts) {
  const sql = generateBatchInsertSQL(contracts);

  // Write SQL to temporary file or execute directly
  const tempSqlFile = `temp_batch_${Date.now()}.sql`;

  try {
    // Write SQL to file
    const fs = await import('fs');
    fs.writeFileSync(tempSqlFile, sql);

    // Execute using wrangler CLI
    const command = `wrangler d1 execute ${CONFIG.databaseName} --remote --file=${tempSqlFile} --config=../../../functions/wrangler.toml`;
    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes('Executed')) {
      throw new Error(`Wrangler error: ${stderr}`);
    }

    // Clean up temp file
    fs.unlinkSync(tempSqlFile);
  } catch (error) {
    // Clean up temp file if it exists
    try {
      const fs = await import('fs');
      if (fs.existsSync(tempSqlFile)) {
        fs.unlinkSync(tempSqlFile);
      }
    } catch {} // Ignore cleanup errors

    throw error;
  }
}

/**
 * Generate SQL for batch insert with UPSERT logic
 */
function generateBatchInsertSQL(contracts) {
  let sql = '';

  for (const contract of contracts) {
    const values = [
      escapeSQL(contract.contract_id),
      escapeSQL(contract.project_title),
      escapeSQL(contract.location),
      escapeSQL(contract.contractor),
      escapeSQL(contract.contract_cost_raw),
      contract.contract_cost_numeric,
      escapeSQL(contract.start_date),
      escapeSQL(contract.completion_date),
      escapeSQL(contract.region),
    ];

    sql += `
INSERT INTO flood_control_contracts (
  contract_id, project_title, location, contractor, 
  contract_cost_raw, contract_cost_numeric, start_date, 
  completion_date, region, updated_at
) VALUES (${values.join(', ')}, CURRENT_TIMESTAMP)
ON CONFLICT(contract_id) DO UPDATE SET
  project_title = excluded.project_title,
  location = excluded.location,
  contractor = excluded.contractor,
  contract_cost_raw = excluded.contract_cost_raw,
  contract_cost_numeric = excluded.contract_cost_numeric,
  start_date = excluded.start_date,
  completion_date = excluded.completion_date,
  region = excluded.region,
  updated_at = CURRENT_TIMESTAMP;
`;
  }

  return sql;
}

/**
 * Escape SQL values to prevent injection and handle nulls
 */
function escapeSQL(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  return `'${value.toString().replace(/'/g, "''")}'`;
}

main();

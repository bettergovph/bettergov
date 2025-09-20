#!/usr/bin/env node

/**
 * ArcGIS REST JSON to Cloudflare D1 Database Loader
 * Run with: node load_flood_control_arcgis.js
 *
 * Requirements:
 * - Node.js
 * - wrangler CLI installed and authenticated
 * - D1 database configured in wrangler.toml
 */

import { readFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - update these values for your setup
const CONFIG = {
  databaseName: 'bettergov', // Replace with your D1 database name
  jsonFilePath: path.join(__dirname, 'flood_control.json'),
  batchSize: 50, // Smaller batch size due to more fields
};

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting ArcGIS JSON import process...');

    // Check if file exists
    try {
      readFileSync(CONFIG.jsonFilePath, 'utf8');
    } catch (error) {
      console.error(`❌ Cannot read file: ${CONFIG.jsonFilePath}`);
      console.error(error.message);
      process.exit(1);
    }

    // Parse JSON
    console.log(`📄 Reading ArcGIS JSON file: ${CONFIG.jsonFilePath}`);
    const jsonText = readFileSync(CONFIG.jsonFilePath, 'utf8');
    const arcgisData = JSON.parse(jsonText);

    if (!arcgisData.features || !Array.isArray(arcgisData.features)) {
      console.error('❌ Invalid ArcGIS data format: features array not found');
      process.exit(1);
    }

    console.log(
      `✅ Found ${arcgisData.features.length} features in ArcGIS data`
    );

    // Process features to extract attributes
    const processedProjects = arcgisData.features.map(feature =>
      processArcGISFeature(feature)
    );

    // Validate projects
    const validProjects = processedProjects.filter(project => {
      if (!project.global_id) {
        console.warn(
          `⚠️  Skipping record without global_id: ${JSON.stringify(project).substring(0, 100)}...`
        );
        return false;
      }
      return true;
    });

    console.log(`✅ ${validProjects.length} valid projects ready for import`);

    // Insert projects in batches
    await insertProjectsInBatches(validProjects);

    console.log('🎉 Import completed successfully!');
  } catch (error) {
    console.error('❌ Error during import:', error.message);
    process.exit(1);
  }
}

/**
 * Process and validate ArcGIS feature data
 */
function processArcGISFeature(feature) {
  if (!feature.attributes) {
    return null;
  }

  const attr = feature.attributes;

  // Generate slug for SEO-friendly URLs
  let slug = null;
  if (attr.ProjectDescription) {
    const baseSlug = attr.ProjectDescription.toString()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/^-+/, '') // Remove leading hyphens
      .replace(/-+$/, ''); // Remove trailing hyphens

    // Append ContractID to make it more unique if available
    slug = attr.ContractID
      ? `${baseSlug}-${attr.ContractID.toLowerCase()}`
      : baseSlug;
  }

  return {
    // Primary keys
    global_id: attr.GlobalID || null,
    object_id: attr.ObjectId || null,

    // Project identification
    project_id: attr.ProjectID || null,
    project_description: attr.ProjectDescription || null,
    project_component_id: attr.ProjectComponentID || null,
    project_component_description: attr.ProjectComponentDescription || null,
    contract_id: attr.ContractID || null,

    // Location information
    region: attr.Region || null,
    province: attr.Province || null,
    municipality: attr.Municipality || null,
    legislative_district: attr.LegislativeDistrict || null,
    district_engineering_office: attr.DistrictEngineeringOffice || null,
    latitude: attr.Latitude || null,
    longitude: attr.Longitude || null,

    // Project details
    implementing_office: attr.ImplementingOffice || null,
    type_of_work: attr.TypeofWork || null,
    infra_type: attr.infra_type || null,
    program: attr.Program || null,

    // Financial information
    abc: attr.ABC || parseNumericCost(attr.ABC_String) || null,
    abc_string: attr.ABC_String || null,
    contract_cost:
      attr.ContractCost || parseNumericCost(attr.ContractCost_String) || null,
    contract_cost_string: attr.ContractCost_String || null,

    // Temporal information
    infra_year: attr.InfraYear || null,
    funding_year: attr.FundingYear || null,
    start_date: formatDate(attr.StartDate) || null,
    completion_date_actual: formatDate(attr.CompletionDateActual) || null,
    completion_date_original: attr.CompletionDateOriginal || null,
    completion_year: attr.CompletionYear || null,

    // Contractor information
    contractor: attr.Contractor || null,

    // Metadata
    creation_date: attr.CreationDate || null,
    creator: attr.Creator || null,
    edit_date: attr.EditDate || null,
    editor: attr.Editor || null,

    // Additional fields
    slug: slug,
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
    // Handle different date formats
    let date;

    // Check if it's already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Check if it's in MM/DD/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [month, day, year] = dateStr.split('/');
      date = new Date(`${year}-${month}-${day}`);
    } else {
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) return null;

    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

/**
 * Insert projects into D1 database using wrangler CLI
 */
async function insertProjectsInBatches(projects) {
  const totalBatches = Math.ceil(projects.length / CONFIG.batchSize);
  let processedCount = 0;

  for (let i = 0; i < projects.length; i += CONFIG.batchSize) {
    const batch = projects.slice(i, i + CONFIG.batchSize);
    const batchNumber = Math.floor(i / CONFIG.batchSize) + 1;

    console.log(
      `📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)...`
    );

    try {
      await insertBatch(batch);
      processedCount += batch.length;
      console.log(
        `✅ Batch ${batchNumber} completed. Total processed: ${processedCount}/${projects.length}`
      );
    } catch (error) {
      console.error(`❌ Error in batch ${batchNumber}:`, error.message);
      // Continue with next batch instead of failing completely
    }
  }
}

/**
 * Insert a batch of projects using wrangler d1 execute
 */
async function insertBatch(projects) {
  const sql = generateBatchInsertSQL(projects);

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
function generateBatchInsertSQL(projects) {
  let sql = '';

  for (const project of projects) {
    const values = [
      escapeSQL(project.global_id),
      project.object_id,
      escapeSQL(project.project_id),
      escapeSQL(project.project_description),
      escapeSQL(project.project_component_id),
      escapeSQL(project.project_component_description),
      escapeSQL(project.contract_id),
      escapeSQL(project.region),
      escapeSQL(project.province),
      escapeSQL(project.municipality),
      escapeSQL(project.legislative_district),
      escapeSQL(project.district_engineering_office),
      project.latitude,
      project.longitude,
      escapeSQL(project.implementing_office),
      escapeSQL(project.type_of_work),
      escapeSQL(project.infra_type),
      escapeSQL(project.program),
      project.abc,
      escapeSQL(project.abc_string),
      project.contract_cost,
      escapeSQL(project.contract_cost_string),
      project.infra_year,
      escapeSQL(project.funding_year),
      escapeSQL(project.start_date),
      escapeSQL(project.completion_date_actual),
      project.completion_date_original,
      project.completion_year,
      escapeSQL(project.contractor),
      project.creation_date,
      escapeSQL(project.creator),
      project.edit_date,
      escapeSQL(project.editor),
      escapeSQL(project.slug),
    ];

    sql += `
INSERT INTO flood_control_projects (
  global_id, object_id, project_id, project_description, project_component_id,
  project_component_description, contract_id, region, province, municipality,
  legislative_district, district_engineering_office, latitude, longitude,
  implementing_office, type_of_work, infra_type, program, abc, abc_string,
  contract_cost, contract_cost_string, infra_year, funding_year, start_date,
  completion_date_actual, completion_date_original, completion_year, contractor,
  creation_date, creator, edit_date, editor, slug, created_at, updated_at
) VALUES (${values.join(', ')}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(global_id) DO UPDATE SET
  object_id = excluded.object_id,
  project_id = excluded.project_id,
  project_description = excluded.project_description,
  project_component_id = excluded.project_component_id,
  project_component_description = excluded.project_component_description,
  contract_id = excluded.contract_id,
  region = excluded.region,
  province = excluded.province,
  municipality = excluded.municipality,
  legislative_district = excluded.legislative_district,
  district_engineering_office = excluded.district_engineering_office,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  implementing_office = excluded.implementing_office,
  type_of_work = excluded.type_of_work,
  infra_type = excluded.infra_type,
  program = excluded.program,
  abc = excluded.abc,
  abc_string = excluded.abc_string,
  contract_cost = excluded.contract_cost,
  contract_cost_string = excluded.contract_cost_string,
  infra_year = excluded.infra_year,
  funding_year = excluded.funding_year,
  start_date = excluded.start_date,
  completion_date_actual = excluded.completion_date_actual,
  completion_date_original = excluded.completion_date_original,
  completion_year = excluded.completion_year,
  contractor = excluded.contractor,
  creation_date = excluded.creation_date,
  creator = excluded.creator,
  edit_date = excluded.edit_date,
  editor = excluded.editor,
  slug = excluded.slug,
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

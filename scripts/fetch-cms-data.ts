/**
 * fetch-cms-data.ts
 * Build-time CMS data fetch script.
 *
 * Fetches all CMS-managed JSON data from the Payload CMS REST API and writes
 * it atomically to public/data/. If CMS_URL is unset or the fetch fails, the
 * script exits 0 so the build continues with existing committed JSON files.
 *
 * Usage:
 *   tsx ./scripts/fetch-cms-data.ts              # all domains
 *   tsx ./scripts/fetch-cms-data.ts --domain=websites
 */

import 'dotenv/config';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PayloadClient } from './cms-export/payload-client.js';
import {
  exportWebsites,
  exportHotlines,
  exportServiceCategories,
  exportServices,
  exportDepartments,
  exportExecutiveOffices,
  exportConstitutionalBodies,
  exportLegislative,
  exportHouseMembers,
  exportPartyListReps,
  exportDiplomaticMissions,
  exportLGU,
  exportVisaTypes,
  exportVisaPolicies,
} from './cms-export/export/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'public', 'data');
const BACKUP_DIR = path.join(DATA_DIR, '.backup');

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

function parseDomain(): string | undefined {
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith('--domain=')) return arg.split('=')[1];
    if (arg === '--domain') return process.argv[i + 1];
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeJSON(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`   wrote: ${path.relative(PROJECT_ROOT, filePath)}`);
}

function cleanupTemp(tmpDir: string): void {
  try {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  } catch {
    // non-fatal
  }
}

// ---------------------------------------------------------------------------
// Backup / apply helpers
// CMS-managed paths relative to public/data/ that are replaced on each export.
// ---------------------------------------------------------------------------

const CMS_MANAGED_PATHS = [
  'websites.json',
  'philippines_hotlines.json',
  'service_categories.json',
  'services',
  'directory/departments.json',
  'directory/executive.json',
  'directory/constitutional.json',
  'directory/legislative.json',
  'directory/house_members.json',
  'directory/party_list_representatives.json',
  'directory/diplomatic.json',
  'directory/lgu',
  'visa/philippines_visa_types.json',
  'visa/philippines_visa_policy.json',
];

function backupCurrentData(): void {
  ensureDir(BACKUP_DIR);
  for (const relPath of CMS_MANAGED_PATHS) {
    const src = path.join(DATA_DIR, relPath);
    const dst = path.join(BACKUP_DIR, relPath);
    if (!fs.existsSync(src)) continue;
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.cpSync(src, dst, { recursive: true, force: true });
    } else {
      ensureDir(path.dirname(dst));
      fs.copyFileSync(src, dst);
    }
  }
  console.log(`   backup saved to: public/data/.backup/`);
}

function applyNewData(tmpDir: string): void {
  for (const relPath of CMS_MANAGED_PATHS) {
    const src = path.join(tmpDir, relPath);
    const dst = path.join(DATA_DIR, relPath);
    if (!fs.existsSync(src)) continue;
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.cpSync(src, dst, { recursive: true, force: true });
    } else {
      ensureDir(path.dirname(dst));
      fs.copyFileSync(src, dst);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const CMS_URL = process.env.CMS_URL;
  const CMS_API_KEY = process.env.CMS_API_KEY || '';

  if (!CMS_URL) {
    console.log(
      'ℹ️  CMS_URL not set — skipping CMS data fetch, using existing JSON files.'
    );
    process.exit(0);
  }

  console.log('='.repeat(60));
  console.log('CMS Data Fetch');
  console.log('='.repeat(60));
  console.log(`CMS URL: ${CMS_URL}`);

  const domain = parseDomain();
  if (domain) {
    console.log(`Domain filter: ${domain}`);
  }
  console.log();

  const client = new PayloadClient(CMS_URL, CMS_API_KEY);
  const tmpDir = path.join(os.tmpdir(), `cms-export-${Date.now()}`);
  ensureDir(tmpDir);

  try {
    // Export websites
    if (!domain || domain === 'websites') {
      console.log('\n--- websites ---');
      const websites = await exportWebsites(client);
      writeJSON(path.join(tmpDir, 'websites.json'), websites);
    }

    // Export hotlines
    if (!domain || domain === 'hotlines') {
      console.log('\n--- hotlines ---');
      const hotlines = await exportHotlines(client);
      writeJSON(path.join(tmpDir, 'philippines_hotlines.json'), hotlines);
    }

    // Export services
    if (!domain || domain === 'services') {
      console.log('\n--- services ---');
      const categories = await exportServiceCategories(client);
      writeJSON(path.join(tmpDir, 'service_categories.json'), categories);

      const services = await exportServices(client);
      for (const [slug, categoryServices] of Object.entries(services)) {
        writeJSON(
          path.join(tmpDir, 'services', `${slug}.json`),
          categoryServices
        );
      }
    }

    // Export directory
    if (!domain || domain === 'directory') {
      console.log('\n--- directory ---');

      const departments = await exportDepartments(client);
      writeJSON(
        path.join(tmpDir, 'directory', 'departments.json'),
        departments
      );

      const executiveOffices = await exportExecutiveOffices(client);
      writeJSON(
        path.join(tmpDir, 'directory', 'executive.json'),
        executiveOffices
      );

      const constitutionalBodies = await exportConstitutionalBodies(client);
      writeJSON(
        path.join(tmpDir, 'directory', 'constitutional.json'),
        constitutionalBodies
      );

      const legislative = await exportLegislative(client);
      writeJSON(
        path.join(tmpDir, 'directory', 'legislative.json'),
        legislative
      );

      const houseMembers = await exportHouseMembers(client);
      writeJSON(
        path.join(tmpDir, 'directory', 'house_members.json'),
        houseMembers
      );

      const partyListReps = await exportPartyListReps(client);
      writeJSON(
        path.join(tmpDir, 'directory', 'party_list_representatives.json'),
        partyListReps
      );

      const diplomaticMissions = await exportDiplomaticMissions(client);
      writeJSON(
        path.join(tmpDir, 'directory', 'diplomatic.json'),
        diplomaticMissions
      );
    }

    // Export LGU
    if (!domain || domain === 'lgu') {
      console.log('\n--- lgu ---');
      const lguData = await exportLGU(client);
      for (const [regionSlug, regionData] of Object.entries(lguData)) {
        writeJSON(
          path.join(tmpDir, 'directory', 'lgu', `${regionSlug}.json`),
          regionData
        );
      }
    }

    // Export visa
    if (!domain || domain === 'visa') {
      console.log('\n--- visa ---');
      const visaTypes = await exportVisaTypes(client);
      writeJSON(
        path.join(tmpDir, 'visa', 'philippines_visa_types.json'),
        visaTypes
      );

      const visaPolicies = await exportVisaPolicies(client);
      writeJSON(
        path.join(tmpDir, 'visa', 'philippines_visa_policy.json'),
        visaPolicies
      );
    }

    // All exports succeeded — apply atomically to public/data/
    console.log('\n📋 All exports succeeded. Applying to public/data/...');
    backupCurrentData();
    applyNewData(tmpDir);
    console.log('✅ CMS data updated successfully.');
  } catch (err) {
    console.error('\n❌ CMS export failed:', err);
    console.warn('⚠️  Using existing JSON data as fallback.');
  } finally {
    cleanupTemp(tmpDir);
  }

  // Always exit 0 — build continues regardless of CMS outcome
  process.exit(0);
}

main();

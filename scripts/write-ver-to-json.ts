import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the src directory for version file
const versionPath = path.join(__dirname, '..', 'src', 'version.json');

// Get current commit hash
const hash =
  process.env.HEAD_COMMIT_HASH ||
  execSync('git rev-parse HEAD').toString().trim() ||
  'unknown';

// Prepare version object
const versionData = { head_commit: hash };
fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));

console.log(`✅ Added commit hash ${hash} to version.json in ${versionPath}`);

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

// Define the build output directory directly
const buildOutDir = 'dist';
const manifestPath = path.join(
  __dirname,
  '..',
  buildOutDir,
  '.vite',
  'manifest.json'
);

const manifest = fs.readFileSync(manifestPath, 'utf-8');

const manifestJson = JSON.parse(manifest);

// Get current commit hash
const hash =
  process.env.HEAD_COMMIT_HASH ||
  execSync('git rev-parse HEAD').toString().trim() ||
  'unknown';

// Prepare manifest object
const headCommitHash = { head_commit: hash };
const updatedManifest = { ...manifestJson, ...headCommitHash };
fs.writeFileSync(manifestPath, JSON.stringify(updatedManifest, null, 2));

console.log(`✅ Manifest written to ${manifestPath}`);

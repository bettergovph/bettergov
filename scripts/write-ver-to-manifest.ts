import fs from 'fs';
import { execSync } from 'child_process';
import viteConfig from '../vite.config';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { build } = viteConfig;

if (!build || !build.outDir) {
  throw new Error('Build output directory is not defined in vite.config.ts');
}
const manifestPath = `./${build?.outDir}/.vite/manifest.json`;

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

#!/usr/bin/env node
/*
  Split monolith src/data/directory/lgu.json into per-region files in src/data/directory/lgu/.
  - Input: src/data/directory/lgu.json (array of regions)
  - Output filenames: <slug>.json (e.g., national-capital-region.json)
  - Preserves region object shape
*/

const fs = require('fs');
const path = require('path');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const inputPath = path.join(repoRoot, 'src', 'data', 'directory', 'lgu.json');
  const outDir = path.join(repoRoot, 'src', 'data', 'directory', 'lgu');

  if (!fs.existsSync(inputPath)) {
    console.error('Input not found:', inputPath);
    process.exit(1);
  }

  ensureDir(outDir);

  const raw = fs.readFileSync(inputPath, 'utf8');
  let regions;
  try {
    regions = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse JSON:', e.message);
    process.exit(1);
  }

  if (!Array.isArray(regions)) {
    console.error('Expected an array of regions');
    process.exit(1);
  }

  let written = 0;
  for (const region of regions) {
    if (!region || typeof region !== 'object') continue;
    const slug = region.slug;
    if (!slug || typeof slug !== 'string') {
      console.warn(
        'Skipping region without slug:',
        region.region || '(unknown)'
      );
      continue;
    }
    const filename = slug + '.json';
    const outPath = path.join(outDir, filename);
    writeJson(outPath, region);
    written++;
  }

  console.log(`Wrote ${written} region file(s) to ${outDir}`);
}

if (require.main === module) main();

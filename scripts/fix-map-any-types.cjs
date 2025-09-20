#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix the map file's any types
function fixMapFile() {
  const filePath = path.join(
    __dirname,
    '..',
    'src/pages/philippines/map/index.tsx'
  );
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  Map file not found');
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Replace wikipedia cache any type
  const cachePattern = /const wikipediaCache = new Map<string, any>\(\);/;
  if (cachePattern.test(content)) {
    content = content.replace(
      cachePattern,
      'const wikipediaCache = new Map<string, unknown>();'
    );
    modified = true;
    console.log('✓ Fixed wikipedia cache type');
  }

  // Replace GeoJSON.FeatureCollection<any, RegionProperties>
  const featureCollectionPattern =
    /GeoJSON\.FeatureCollection<any, RegionProperties>/g;
  if (featureCollectionPattern.test(content)) {
    content = content.replace(
      featureCollectionPattern,
      'GeoJSON.FeatureCollection<GeoJSON.Geometry, RegionProperties>'
    );
    modified = true;
    console.log('✓ Fixed FeatureCollection types');
  }

  // Replace GeoJSON.Feature<any, RegionProperties>
  const featurePattern = /GeoJSON\.Feature<any, RegionProperties>/g;
  if (featurePattern.test(content)) {
    content = content.replace(
      featurePattern,
      'GeoJSON.Feature<GeoJSON.Geometry, RegionProperties>'
    );
    modified = true;
    console.log('✓ Fixed Feature types');
  }

  // Replace onEachFeature any parameter
  const onEachFeaturePattern = /\(feature: any, layer: Layer\)/;
  if (onEachFeaturePattern.test(content)) {
    content = content.replace(
      onEachFeaturePattern,
      '(feature: GeoJSON.Feature<GeoJSON.Geometry, RegionProperties>, layer: Layer)'
    );
    modified = true;
    console.log('✓ Fixed onEachFeature parameter type');
  }

  // Replace parseExtract any parameter
  const parseExtractPattern = /const parseExtract = \(extract: any\)/;
  if (parseExtractPattern.test(content)) {
    content = content.replace(
      parseExtractPattern,
      'const parseExtract = (extract: unknown)'
    );
    modified = true;
    console.log('✓ Fixed parseExtract parameter type');
  }

  // Replace data: any in try-catch
  const dataAnyPattern = /const data: any = await response\.json\(\);/;
  if (dataAnyPattern.test(content)) {
    content = content.replace(
      dataAnyPattern,
      'const data: unknown = await response.json();'
    );
    modified = true;
    console.log('✓ Fixed data type in fetchWikipediaData');
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log('✅ Map file fixed successfully\n');
  } else {
    console.log('ℹ️  No changes needed in map file\n');
  }
}

// Fix weather.ts
function fixWeatherFile() {
  const filePath = path.join(__dirname, '..', 'functions/weather.ts');
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  Weather file not found');
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Fix line 21
  if (lines[20] && lines[20].includes(': any')) {
    lines[20] = lines[20].replace(': any', ': unknown');
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log('✅ Fixed weather.ts any type\n');
  }
}

// Fix MeilisearchInstantSearch
function fixMeilisearchFile() {
  const filePath = path.join(
    __dirname,
    '..',
    'src/components/search/MeilisearchInstantSearch.tsx'
  );
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  MeilisearchInstantSearch file not found');
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;

  // Fix specific lines
  const fixes = [
    { line: 110, replacement: ': Record<string, unknown>' },
    { line: 118, replacement: ': unknown' },
    { line: 129, replacement: ': unknown' },
    { line: 135, replacement: ': Record<string, unknown>' },
  ];

  fixes.forEach(fix => {
    if (lines[fix.line] && lines[fix.line].includes(': any')) {
      lines[fix.line] = lines[fix.line].replace(': any', fix.replacement);
      modified = true;
      console.log(`✓ Fixed line ${fix.line + 1}`);
    } else if (
      lines[fix.line] &&
      lines[fix.line].includes(': Record<string, unknown>')
    ) {
      // Already fixed
    } else if (lines[fix.line] && lines[fix.line].includes(': unknown')) {
      // Already fixed
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log('✅ Fixed MeilisearchInstantSearch.tsx\n');
  }
}

// Main function
function main() {
  console.log('🔧 Fixing remaining any types in map and other files...\n');

  console.log('Processing map file...');
  fixMapFile();

  console.log('Processing weather file...');
  fixWeatherFile();

  console.log('Processing MeilisearchInstantSearch file...');
  fixMeilisearchFile();

  console.log('✅ Done! Run npx eslint to check remaining errors.');
}

main();

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Map of files and their any type replacements
const typeReplacements = [
  // Jina and cf-browser
  {
    file: 'functions/lib/jina.ts',
    replacements: [
      { line: 208, from: 'any', to: 'unknown' },
      { line: 220, from: 'any', to: 'unknown' },
    ]
  },
  // Weather
  {
    file: 'functions/weather.ts',
    replacements: [
      { line: 21, from: 'any', to: 'unknown' },
    ]
  },
  // API lib
  {
    file: 'src/lib/api.ts',
    replacements: [
      { line: 4, from: 'any', to: 'unknown' },
    ]
  },
  {
    file: 'src/lib/forex.ts',
    replacements: [
      { line: 15, from: 'any', to: 'unknown' },
    ]
  },
  // MeilisearchInstantSearch
  {
    file: 'src/components/search/MeilisearchInstantSearch.tsx',
    replacements: [
      { line: 111, from: 'any', to: 'Record<string, unknown>' },
      { line: 119, from: 'any', to: 'unknown' },
      { line: 130, from: 'any', to: 'unknown' },
      { line: 136, from: 'any', to: 'Record<string, unknown>' },
    ]
  },
  // Government pages
  {
    file: 'src/pages/government/constitutional/components/ConstitutionalSidebar.tsx',
    replacements: [
      { line: 17, from: 'any', to: 'unknown' },
      { line: 35, from: 'any', to: 'unknown' },
    ]
  },
  {
    file: 'src/pages/government/constitutional/goccs.tsx',
    replacements: [
      { line: 23, from: 'any', to: 'unknown' },
      { line: 24, from: 'any', to: 'unknown' },
      { line: 32, from: 'any', to: 'unknown' },
    ]
  },
  {
    file: 'src/pages/government/constitutional/sucs.tsx',
    replacements: [
      { line: 24, from: 'any', to: 'unknown' },
      { line: 32, from: 'any', to: 'unknown' },
    ]
  },
  {
    file: 'src/pages/government/departments/[department].tsx',
    replacements: [
      { line: 12, from: 'any', to: 'unknown' },
      { line: 20, from: 'any', to: 'unknown' },
    ]
  },
  {
    file: 'src/pages/government/departments/components/DepartmentsSidebar.tsx',
    replacements: [
      { line: 14, from: 'any', to: 'unknown' },
    ]
  },
  {
    file: 'src/pages/government/departments/index.tsx',
    replacements: [
      { line: 22, from: 'any', to: 'unknown' },
      { line: 135, from: 'any', to: 'unknown' },
    ]
  },
  {
    file: 'src/pages/government/executive/other-executive-offices.tsx',
    replacements: [
      { line: 40, from: 'any', to: 'unknown' },
      { line: 41, from: 'any', to: 'unknown' },
    ]
  },
  {
    file: 'src/pages/government/legislative/[chamber].tsx',
    replacements: [
      { line: 11, from: 'any', to: 'unknown' },
      { line: 123, from: 'any', to: 'unknown' },
    ]
  },
  {
    file: 'src/pages/government/legislative/house-members.tsx',
    replacements: [
      { line: 18, from: 'any', to: 'unknown' },
    ]
  },
  {
    file: 'src/pages/government/legislative/party-list-members.tsx',
    replacements: [
      { line: 19, from: 'any', to: 'unknown' },
    ]
  },
  {
    file: 'src/pages/government/legislative/senate-committees.tsx',
    replacements: [
      { line: 15, from: 'any', to: 'unknown' },
    ]
  },
  {
    file: 'src/pages/government/local/[region].tsx',
    replacements: [
      { line: 29, from: 'any[]', to: 'Array<LocalGovUnit>' },
    ]
  },
  {
    file: 'src/pages/government/local/components/LocalSidebar.tsx',
    replacements: [
      { line: 26, from: 'any', to: 'unknown' },
    ]
  },
  {
    file: 'src/pages/government/local/index.tsx',
    replacements: [
      { line: 36, from: 'any', to: 'unknown' },
    ]
  },
  // Map page
  {
    file: 'src/pages/philippines/map/index.tsx',
    replacements: [
      { line: 41, from: 'any', to: 'GeoJSON.Feature' },
      { line: 50, from: 'any', to: 'GeoJSON.Feature' },
      { line: 51, from: 'any', to: 'GeoJSON.Feature' },
      { line: 86, from: 'any', to: 'unknown' },
      { line: 113, from: 'any', to: 'unknown' },
      { line: 120, from: 'any', to: 'GeoJSON.Feature' },
      { line: 146, from: 'any', to: 'unknown' },
    ]
  },
  // Flood control
  {
    file: 'src/pages/flood-control-projects/contractors.tsx',
    replacements: [
      { line: 198, from: 'any', to: 'FloodControlProject' },
    ]
  },
  {
    file: 'src/pages/flood-control-projects/table.tsx',
    replacements: [
      { line: 360, from: 'any', to: 'FloodControlProject' },
    ]
  },
  // Visa types
  {
    file: 'src/pages/travel/visa-types/[type].tsx',
    replacements: [
      { line: 22, from: 'any[]', to: 'VisaType[]' },
    ]
  },
  {
    file: 'src/pages/travel/visa-types/index.tsx',
    replacements: [
      { line: 20, from: 'any[]', to: 'VisaType[]' },
    ]
  }
];

function fixFile(filePath, replacements) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`  ⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  let modified = false;

  // Sort replacements by line number in reverse
  replacements.sort((a, b) => b.line - a.line);

  replacements.forEach(replacement => {
    const lineIndex = replacement.line - 1;
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const line = lines[lineIndex];

      // More targeted replacement
      let newLine = line;

      if (replacement.from === 'any[]') {
        newLine = line.replace(/\bany\[\]/g, replacement.to);
      } else if (replacement.from === 'any') {
        // Replace only standalone 'any' types, not part of other words
        newLine = line.replace(/: any\b/g, `: ${replacement.to}`);
        newLine = newLine.replace(/<any>/g, `<${replacement.to}>`);
        newLine = newLine.replace(/\(any\)/g, `(${replacement.to})`);
      }

      if (newLine !== line) {
        lines[lineIndex] = newLine;
        modified = true;
        console.log(`  ✓ Line ${replacement.line}: ${replacement.from} → ${replacement.to}`);
      }
    }
  });

  if (modified) {
    fs.writeFileSync(fullPath, lines.join('\n'));
    console.log(`  ✅ Saved ${path.basename(filePath)}\n`);
  } else {
    console.log(`  ℹ️  No changes needed\n`);
  }
}

// Add interface for LocalGovUnit
function addLocalGovUnitInterface() {
  const filePath = 'src/pages/government/local/[region].tsx';
  const fullPath = path.join(__dirname, '..', filePath);

  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');

    // Check if interface already exists
    if (!content.includes('interface LocalGovUnit')) {
      // Add after imports
      const importEnd = content.lastIndexOf('import ');
      const lineEnd = content.indexOf('\n', importEnd);

      const interfaceCode = `

interface LocalGovUnit {
  city: string;
  mayor?: { name: string; contact?: string };
  vice_mayor?: { name: string; contact?: string };
  type: string;
  province: string | null;
}`;

      content = content.slice(0, lineEnd + 1) + interfaceCode + content.slice(lineEnd + 1);
      fs.writeFileSync(fullPath, content);
      console.log('Added LocalGovUnit interface to [region].tsx\n');
    }
  }
}

// Main function
function main() {
  console.log('🔧 Fixing final TypeScript any types...\n');

  // Add interface first
  addLocalGovUnitInterface();

  typeReplacements.forEach(({ file, replacements }) => {
    console.log(`Processing ${file}...`);
    fixFile(file, replacements);
  });

  console.log('✅ Done! Most any types have been replaced with more specific types.');
}

main();
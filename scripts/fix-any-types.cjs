#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Map of files and the types to use instead of any
const typeReplacements = [
  // Weather API types
  {
    file: 'functions/api/weather.ts',
    replacements: [
      { line: 38, from: 'any', to: 'unknown' },
      { line: 48, from: 'any', to: 'unknown' },
      { line: 60, from: 'any', to: 'Record<string, unknown>' },
      { line: 62, from: 'any', to: 'Record<string, unknown>' },
    ],
  },
  // Forex types
  {
    file: 'functions/forex.ts',
    replacements: [
      { line: 10, from: 'any', to: 'unknown' },
      { line: 14, from: 'any', to: 'unknown' },
    ],
  },
  // Browser types
  {
    file: 'functions/lib/cf-browser.ts',
    replacements: [
      { line: 260, from: 'any', to: 'unknown' },
      { line: 272, from: 'any', to: 'unknown' },
    ],
  },
  // Search component types
  {
    file: 'src/pages/Search.tsx',
    replacements: [
      { line: 97, from: 'any', to: 'Record<string, unknown>' },
      { line: 105, from: 'any', to: 'unknown' },
      { line: 116, from: 'any', to: 'unknown' },
      { line: 122, from: 'any', to: 'Record<string, unknown>' },
    ],
  },
  // Government pages - use proper types for data structures
  {
    file: 'src/pages/government/local/[region].tsx',
    replacements: [
      {
        line: 29,
        from: 'any[]',
        to: 'Array<{ city: string; mayor?: { name: string; contact?: string }; vice_mayor?: { name: string; contact?: string }; type: string; province: string | null }>',
      },
      {
        line: 33,
        from: 'any',
        to: '{ city: string; mayor?: { name: string; contact?: string }; vice_mayor?: { name: string; contact?: string }; type: string; province?: string }',
      },
      {
        line: 44,
        from: 'any',
        to: '{ municipality: string; mayor?: { name: string; contact?: string }; vice_mayor?: { name: string; contact?: string }}',
      },
      {
        line: 57,
        from: 'any',
        to: '{ province: string; cities?: Array<unknown>; municipalities?: Array<unknown> }',
      },
      {
        line: 60,
        from: 'any',
        to: '{ city: string; mayor?: { name: string; contact?: string }; vice_mayor?: { name: string; contact?: string }}',
      },
      {
        line: 70,
        from: 'any',
        to: '{ municipality: string; mayor?: { name: string; contact?: string }; vice_mayor?: { name: string; contact?: string }}',
      },
      {
        line: 91,
        from: 'any',
        to: '{ city: string; mayor?: { name: string; contact?: string }; vice_mayor?: { name: string; contact?: string }; type: string; province: string | null }',
      },
    ],
  },
  // Visa types
  {
    file: 'src/pages/travel/visa-types/[type].tsx',
    replacements: [
      { line: 22, from: 'any[]', to: 'Array<VisaType>' },
      { line: 210, from: 'any', to: 'VisaType' },
    ],
  },
  {
    file: 'src/pages/travel/visa-types/index.tsx',
    replacements: [
      { line: 20, from: 'any[]', to: 'Array<VisaType>' },
      { line: 116, from: 'any', to: 'VisaType' },
      { line: 186, from: 'any', to: 'VisaType' },
    ],
  },
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

      // Create regex to match the exact 'any' type
      const regex = new RegExp(`\\b${replacement.from}\\b`, 'g');
      const newLine = line.replace(regex, replacement.to);

      if (newLine !== line) {
        lines[lineIndex] = newLine;
        modified = true;
        console.log(
          `  ✓ Line ${replacement.line}: ${replacement.from} → ${replacement.to}`
        );
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

// Main function
function main() {
  console.log('🔧 Fixing TypeScript any types...\n');

  typeReplacements.forEach(({ file, replacements }) => {
    console.log(`Processing ${file}...`);
    fixFile(file, replacements);
  });

  console.log(
    '✅ Done! Note: Some any types may require more specific types based on actual data structures.'
  );
}

main();

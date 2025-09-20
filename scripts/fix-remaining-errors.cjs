#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Map of files and their fixes
const fixes = [
  // Fix unused LocalGovUnit interface
  {
    file: 'src/pages/government/local/[region].tsx',
    replacements: [
      {
        line: 37,
        pattern: /: any\[\]/g,
        replacement: ': LocalGovUnit[]',
      },
    ],
  },
  // Fix unused variables in LocalSidebar
  {
    file: 'src/pages/government/local/components/LocalSidebar.tsx',
    replacements: [
      {
        line: 10,
        pattern: /_props/g,
        replacement: '',
      },
    ],
  },
  // Fix unused Office interface in ExecutiveSidebar
  {
    file: 'src/pages/government/executive/components/ExecutiveSidebar.tsx',
    replacements: [
      {
        line: 7,
        pattern: /^interface Office \{[^}]+\}\n\n/m,
        replacement: '',
      },
    ],
  },
  // Fix unused FloodControlProject in index.tsx
  {
    file: 'src/pages/flood-control-projects/index.tsx',
    replacements: [
      {
        line: 39,
        pattern: /^interface FloodControlProject \{[^}]+\}\n\n/m,
        replacement: '',
      },
    ],
  },
  // Fix remaining any types in constitutional/index.tsx
  {
    file: 'src/pages/government/constitutional/index.tsx',
    replacements: [
      { line: 18, pattern: /: any/g, replacement: ': unknown' },
      { line: 26, pattern: /: any/g, replacement: ': unknown' },
    ],
  },
  // Fix remaining any in constitutional/sucs.tsx
  {
    file: 'src/pages/government/constitutional/sucs.tsx',
    replacements: [{ line: 23, pattern: /: any/g, replacement: ': unknown' }],
  },
  // Fix weather.ts any type
  {
    file: 'functions/weather.ts',
    replacements: [{ line: 21, pattern: /: any/g, replacement: ': unknown' }],
  },
  // Fix MeilisearchInstantSearch any types
  {
    file: 'src/components/search/MeilisearchInstantSearch.tsx',
    replacements: [
      {
        line: 111,
        pattern: /: any/g,
        replacement: ': Record<string, unknown>',
      },
      { line: 119, pattern: /: any/g, replacement: ': unknown' },
      { line: 130, pattern: /: any/g, replacement: ': unknown' },
      {
        line: 136,
        pattern: /: any/g,
        replacement: ': Record<string, unknown>',
      },
    ],
  },
  // Fix map/index.tsx any types
  {
    file: 'src/pages/philippines/map/index.tsx',
    replacements: [
      { line: 41, pattern: /: any/g, replacement: ': GeoJSON.Feature' },
      { line: 50, pattern: /: any/g, replacement: ': GeoJSON.Feature' },
      { line: 51, pattern: /: any/g, replacement: ': GeoJSON.Feature' },
      { line: 86, pattern: /: any/g, replacement: ': unknown' },
      { line: 113, pattern: /: any/g, replacement: ': unknown' },
      { line: 120, pattern: /: any/g, replacement: ': GeoJSON.Feature' },
      { line: 146, pattern: /: any/g, replacement: ': unknown' },
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
  replacements.sort((a, b) => (b.line || 0) - (a.line || 0));

  replacements.forEach(replacement => {
    if (replacement.pattern && replacement.replacement !== undefined) {
      // Use pattern-based replacement
      const newContent = content.replace(
        replacement.pattern,
        replacement.replacement
      );
      if (newContent !== content) {
        content = newContent;
        modified = true;
        console.log(
          `  ✓ Applied pattern fix: ${replacement.pattern} → ${replacement.replacement}`
        );
      }
    } else if (replacement.line) {
      // Use line-based replacement
      const lineIndex = replacement.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const line = lines[lineIndex];
        const newLine = line.replace(
          replacement.pattern,
          replacement.replacement
        );

        if (newLine !== line) {
          lines[lineIndex] = newLine;
          modified = true;
          console.log(`  ✓ Line ${replacement.line}: fixed`);
        }
      }
    }
  });

  if (modified) {
    // Reconstruct content if we modified lines
    if (replacements.some(r => r.line)) {
      content = lines.join('\n');
    }
    fs.writeFileSync(fullPath, content);
    console.log(`  ✅ Saved ${path.basename(filePath)}\n`);
  } else {
    console.log(`  ℹ️  No changes needed\n`);
  }
}

// Main function
function main() {
  console.log('🔧 Fixing remaining ESLint errors...\n');

  fixes.forEach(({ file, replacements }) => {
    console.log(`Processing ${file}...`);
    fixFile(file, replacements);
  });

  console.log('✅ Done! Run npx eslint to check remaining errors.');
}

main();

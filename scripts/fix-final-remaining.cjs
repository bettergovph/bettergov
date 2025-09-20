#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse lint.txt to get specific errors
function parseLintErrors() {
  const lintPath = path.join(__dirname, '..', 'lint.txt');
  const lintContent = fs.readFileSync(lintPath, 'utf8');
  const lines = lintContent.split('\n');

  const fixes = [];
  let currentFile = null;

  lines.forEach(line => {
    if (line.startsWith('/')) {
      currentFile = line.trim();
    } else if (line.includes('error') && currentFile) {
      const match = line.match(/^\s*(\d+):(\d+)\s+error\s+(.+)/);
      if (match) {
        fixes.push({
          file: currentFile,
          line: parseInt(match[1]),
          column: parseInt(match[2]),
          error: match[3],
        });
      }
    }
  });

  return fixes;
}

// Fix specific files
function fixFiles() {
  const fixes = [
    // Fix weather.ts
    {
      file: 'functions/weather.ts',
      line: 21,
      search: ': any',
      replace: ': unknown',
    },
    // Fix MeilisearchInstantSearch
    {
      file: 'src/components/search/MeilisearchInstantSearch.tsx',
      lines: [
        { line: 111, search: ': any', replace: ': Record<string, unknown>' },
        { line: 119, search: ': any', replace: ': unknown' },
        { line: 130, search: ': any', replace: ': unknown' },
        { line: 136, search: ': any', replace: ': Record<string, unknown>' },
      ],
    },
    // Fix constitutional index
    {
      file: 'src/pages/government/constitutional/index.tsx',
      lines: [
        { line: 18, search: ': any', replace: ': unknown' },
        { line: 26, search: ': any', replace: ': unknown' },
      ],
    },
    // Fix constitutional sucs
    {
      file: 'src/pages/government/constitutional/sucs.tsx',
      line: 23,
      search: ': any',
      replace: ': unknown',
    },
  ];

  fixes.forEach(fix => {
    const filePath = path.join(__dirname, '..', fix.file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${fix.file}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let modified = false;

    if (fix.lines) {
      // Multiple line fixes
      fix.lines.forEach(lineFix => {
        const lineIndex = lineFix.line - 1;
        if (lines[lineIndex] && lines[lineIndex].includes(lineFix.search)) {
          lines[lineIndex] = lines[lineIndex].replace(
            lineFix.search,
            lineFix.replace
          );
          modified = true;
          console.log(`✓ Fixed ${fix.file}:${lineFix.line}`);
        }
      });
    } else if (fix.line) {
      // Single line fix
      const lineIndex = fix.line - 1;
      if (lines[lineIndex] && lines[lineIndex].includes(fix.search)) {
        lines[lineIndex] = lines[lineIndex].replace(fix.search, fix.replace);
        modified = true;
        console.log(`✓ Fixed ${fix.file}:${fix.line}`);
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, lines.join('\n'));
    }
  });

  // Remove unused Office interface from ExecutiveSidebar
  const execSidebarPath = path.join(
    __dirname,
    '..',
    'src/pages/government/executive/components/ExecutiveSidebar.tsx'
  );
  if (fs.existsSync(execSidebarPath)) {
    let content = fs.readFileSync(execSidebarPath, 'utf8');
    // Remove the interface Office definition
    content = content.replace(/interface Office \{[^}]+\}\n\n/, '');
    fs.writeFileSync(execSidebarPath, content);
    console.log('✓ Removed unused Office interface from ExecutiveSidebar.tsx');
  }

  // Remove unused FloodControlProject from index.tsx
  const floodIndexPath = path.join(
    __dirname,
    '..',
    'src/pages/flood-control-projects/index.tsx'
  );
  if (fs.existsSync(floodIndexPath)) {
    let content = fs.readFileSync(floodIndexPath, 'utf8');
    const lines = content.split('\n');

    // Find and remove the interface
    let startIndex = -1;
    let endIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('interface FloodControlProject')) {
        startIndex = i;
      }
      if (startIndex !== -1 && lines[i].trim() === '}') {
        endIndex = i;
        break;
      }
    }

    if (startIndex !== -1 && endIndex !== -1) {
      // Remove the interface and extra blank line
      lines.splice(startIndex, endIndex - startIndex + 2);
      fs.writeFileSync(floodIndexPath, lines.join('\n'));
      console.log(
        '✓ Removed unused FloodControlProject interface from flood-control-projects/index.tsx'
      );
    }
  }
}

// Main function
function main() {
  console.log('🔧 Fixing final remaining ESLint errors...\n');

  fixFiles();

  console.log('\n✅ Done! Run npx eslint to check remaining errors.');
}

main();

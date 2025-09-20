#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read lint.txt to find files with React import errors
const lintContent = fs.readFileSync('lint.txt', 'utf8');
const lines = lintContent.split('\n');

// Extract unique files that have React import errors
const filesWithReactErrors = new Set();

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("'React' must be in scope when using JSX")) {
    // Look backwards to find the file path
    for (let j = i - 1; j >= 0 && j >= i - 5; j--) {
      if (lines[j].startsWith('/Users/arke/Projects/bettergov/')) {
        const filePath = lines[j].split(':')[0];
        if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
          // Convert absolute path to relative
          const relativePath = filePath.replace('/Users/arke/Projects/bettergov/', '');
          filesWithReactErrors.add(relativePath);
        }
        break;
      }
    }
  }
}

console.log(`Found ${filesWithReactErrors.size} files with React import errors\n`);

let filesFixed = 0;
let filesSkipped = 0;
let filesNotFound = 0;

// Process each file
filesWithReactErrors.forEach(file => {
  const filePath = path.join(process.cwd(), file);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    filesNotFound++;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Check if file already imports React
  if (content.includes("import React from") || content.includes("import * as React from")) {
    console.log(`⏭️  Skipped (already has React): ${file}`);
    filesSkipped++;
    return;
  }

  // Add React import at the beginning
  let newContent;

  // Check if there are other imports
  const importMatch = content.match(/^import\s+/m);
  if (importMatch) {
    // Add React import as the first import
    const firstImportIndex = content.indexOf(importMatch[0]);
    newContent = content.slice(0, firstImportIndex) +
                 "import React from 'react';\n" +
                 content.slice(firstImportIndex);
  } else {
    // No imports found, add at the beginning
    newContent = "import React from 'react';\n" + content;
  }

  fs.writeFileSync(filePath, newContent, 'utf8');
  filesFixed++;
  console.log(`✅ Fixed: ${file}`);
});

console.log(`\n📊 Summary:`);
console.log(`   Files fixed: ${filesFixed}`);
console.log(`   Files skipped: ${filesSkipped}`);
console.log(`   Files not found: ${filesNotFound}`);
console.log(`   Total files processed: ${filesWithReactErrors.size}`);

if (filesFixed > 0) {
  console.log(`\n✨ Successfully added React imports to ${filesFixed} files!`);
  console.log(`\n💡 Run 'npm run lint' again to verify the fixes.`);
}
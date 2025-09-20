#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TSX and JSX files
const files = glob.sync('src/**/*.{tsx,jsx}', { cwd: process.cwd() });

let filesFixed = 0;
let filesSkipped = 0;

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Check if file already imports React
  if (
    content.includes('import React') ||
    content.includes('import * as React')
  ) {
    filesSkipped++;
    return;
  }

  // Check if file contains JSX (has < followed by uppercase letter or contains JSX.Element or React.FC)
  const hasJSX =
    /<[A-Z]/.test(content) ||
    /JSX\.Element/.test(content) ||
    /React\.FC/.test(content) ||
    /React\.ReactNode/.test(content);

  if (!hasJSX) {
    filesSkipped++;
    return;
  }

  // Add React import at the beginning
  const newContent = `import React from 'react';\n${content}`;

  fs.writeFileSync(filePath, newContent, 'utf8');
  filesFixed++;
  console.log(`✓ Fixed: ${file}`);
});

console.log(`\n📊 Summary:`);
console.log(`   Files fixed: ${filesFixed}`);
console.log(`   Files skipped: ${filesSkipped}`);
console.log(`   Total files processed: ${files.length}`);

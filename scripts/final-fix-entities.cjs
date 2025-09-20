#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all source files
const files = [
  ...glob.sync('src/**/*.{tsx,jsx,ts,js}', { cwd: process.cwd() }),
  ...glob.sync('functions/**/*.{tsx,jsx,ts,js}', { cwd: process.cwd() }),
];

let filesFixed = 0;
let totalReplacements = 0;

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Count replacements
  const count = (content.match(/&rsquo;/g) || []).length;

  // Replace all &rsquo; with '
  // This is safe because &rsquo; should never appear in actual JavaScript/TypeScript code
  content = content.replace(/&rsquo;/g, "'");

  // Also fix &ldquo; and &rdquo; that shouldn't be in code
  content = content.replace(/&ldquo;/g, '"');
  content = content.replace(/&rdquo;/g, '"');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesFixed++;
    totalReplacements += count;
    console.log(`✓ Fixed: ${file} (${count} &rsquo; replacements)`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Files fixed: ${filesFixed}`);
console.log(`   Total &rsquo; replacements: ${totalReplacements}`);
console.log(`   Total files processed: ${files.length}`);

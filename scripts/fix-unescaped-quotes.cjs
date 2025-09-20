#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TSX and JSX files
const files = glob.sync('src/**/*.{tsx,jsx}', { cwd: process.cwd() });

let filesFixed = 0;
let totalReplacements = 0;

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Regular expression to match JSX text content (between > and <)
  // This regex looks for text between JSX tags
  const jsxTextRegex = /(?<=>)[^<>]*(?=<)/g;

  let replacements = 0;

  content = content.replace(jsxTextRegex, match => {
    // Skip if it's just whitespace or already contains HTML entities
    if (/^\s*$/.test(match) || /&[a-z]+;|&#\d+;/.test(match)) {
      return match;
    }

    let modified = match;

    // Replace quotes and apostrophes with HTML entities
    // But avoid replacing quotes inside attributes or template literals
    if (!match.includes('{') && !match.includes('}')) {
      const originalModified = modified;

      // Replace straight quotes with curly quotes
      modified = modified.replace(/(?<![\\=])"(?![\\>])/g, '&ldquo;'); // Opening double quote
      modified = modified.replace(/"(?![\\>])/g, '&rdquo;'); // Closing double quote
      modified = modified.replace(/(?<![\\=])'(?![\\>])/g, '&rsquo;'); // Apostrophe/single quote

      if (modified !== originalModified) {
        replacements++;
      }
    }

    return modified;
  });

  // Also handle cases where quotes appear in JSX text that's on the same line as tags
  // Pattern: >text with "quotes" or 'apostrophes'<
  const inlineTextRegex = />([^<{]*['"]+[^<{]*)</g;

  content = content.replace(inlineTextRegex, (match, text) => {
    // Skip if already has entities
    if (/&[a-z]+;|&#\d+;/.test(text)) {
      return match;
    }

    let modifiedText = text;
    modifiedText = modifiedText.replace(/"/g, '&rdquo;');
    modifiedText = modifiedText.replace(/'/g, '&rsquo;');

    if (modifiedText !== text) {
      replacements++;
    }

    return '>' + modifiedText + '<';
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesFixed++;
    totalReplacements += replacements;
    console.log(`✓ Fixed: ${file} (${replacements} replacements)`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Files fixed: ${filesFixed}`);
console.log(`   Total replacements: ${totalReplacements}`);
console.log(`   Total files processed: ${files.length}`);

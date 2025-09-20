#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TSX and JSX files
const files = glob.sync('src/**/*.{tsx,jsx,ts,js}', { cwd: process.cwd() });

let filesFixed = 0;
let totalReplacements = 0;

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  let replacements = 0;

  // Fix &rsquo; that appears in JavaScript code (not in JSX text)
  // This includes object keys, string literals, template literals, etc.

  // Fix in string literals like 'some&rsquo;thing' or "some&rsquo;thing"
  content = content.replace(
    /(['"`])([^'"`]*?)&rsquo;([^'"`]*?)(['"`])/g,
    (match, quote1, before, after, quote2) => {
      if (quote1 === quote2) {
        replacements++;
        return `${quote1}${before}'${after}${quote2}`;
      }
      return match;
    }
  );

  // Fix in property names and object keys: property: &rsquo;value&rsquo;
  content = content.replace(
    /(\w+):\s*&rsquo;([^&]*?)&rsquo;/g,
    (match, prop, value) => {
      replacements++;
      return `${prop}: '${value}'`;
    }
  );

  // Fix in case statements: case &rsquo;value&rsquo;:
  content = content.replace(
    /case\s+&rsquo;([^&]*?)&rsquo;:/g,
    (match, value) => {
      replacements++;
      return `case '${value}':`;
    }
  );

  // Fix in array elements and function arguments: [&rsquo;value&rsquo;]
  content = content.replace(
    /([[(,])\s*&rsquo;([^&]*?)&rsquo;/g,
    (match, prefix, value) => {
      replacements++;
      return `${prefix} '${value}'`;
    }
  );

  // Fix in JSX attributes: className={`...&rsquo;...&rsquo;...`}
  content = content.replace(
    /className=\{[`"]([^`"]*?)&rsquo;([^`"]*?)[`"]\}/g,
    (match, before, after) => {
      replacements++;
      return match.replace(/&rsquo;/g, "'");
    }
  );

  // Fix any remaining &rsquo; that should be ' in code context
  // Be careful not to replace legitimate HTML entities in JSX text
  const lines = content.split('\n');
  const fixedLines = lines.map(line => {
    // Skip lines that look like JSX text content (between > and <)
    if (/>([^<]*)</g.test(line)) {
      // This might be JSX text, skip it
      return line;
    }

    // Fix &rsquo; in code lines
    if (
      line.includes('&rsquo;') &&
      !line.includes('>') &&
      !line.includes('<')
    ) {
      replacements += (line.match(/&rsquo;/g) || []).length;
      return line.replace(/&rsquo;/g, "'");
    }

    return line;
  });

  content = fixedLines.join('\n');

  // Fix &ldquo; and &rdquo; that should be quotes in code
  content = content.replace(/&ldquo;([^&]*)&rdquo;/g, (match, inner) => {
    // Only replace if it's not in JSX text content
    if (!match.includes('>') && !match.includes('<')) {
      replacements++;
      return `"${inner}"`;
    }
    return match;
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

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TS and TSX files
const files = glob.sync('src/**/*.{ts,tsx,jsx,js}', { cwd: process.cwd() });
const functionFiles = glob.sync('functions/**/*.{ts,tsx,js}', {
  cwd: process.cwd(),
});

const allFiles = [...files, ...functionFiles];

let filesFixed = 0;
let importsRemoved = 0;

allFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Find all imports
  const importRegex =
    /^import\s+(?:{[^}]+}|[^{]+)\s+from\s+['"][^'"]+['"];?\s*$/gm;
  const imports = content.match(importRegex) || [];

  let removedCount = 0;

  imports.forEach(importLine => {
    // Extract imported items
    let importedItems = [];

    // Handle named imports: import { X, Y } from 'module'
    const namedMatch = importLine.match(/import\s+{([^}]+)}/);
    if (namedMatch) {
      importedItems = namedMatch[1].split(',').map(item => {
        // Handle aliased imports like "X as Y"
        const parts = item.trim().split(/\s+as\s+/);
        return parts[parts.length - 1].trim();
      });
    }

    // Handle default imports: import X from 'module'
    const defaultMatch = importLine.match(
      /import\s+([A-Za-z_][A-Za-z0-9_]*)\s+from/
    );
    if (defaultMatch && !namedMatch) {
      importedItems.push(defaultMatch[1]);
    }

    // Handle namespace imports: import * as X from 'module'
    const namespaceMatch = importLine.match(
      /import\s+\*\s+as\s+([A-Za-z_][A-Za-z0-9_]*)\s+from/
    );
    if (namespaceMatch) {
      importedItems = [namespaceMatch[1]];
    }

    // Check if each imported item is used in the code
    let unusedItems = [];
    importedItems.forEach(item => {
      // Create a regex to check if the item is used
      // Exclude the import line itself and comments
      const usageRegex = new RegExp(`\\b${item}\\b`, 'g');
      const contentWithoutImport = content.replace(importLine, '');
      const contentWithoutComments = contentWithoutImport.replace(
        /\/\*[\s\S]*?\*\/|\/\/.*/g,
        ''
      );

      const matches = contentWithoutComments.match(usageRegex);
      if (!matches || matches.length === 0) {
        unusedItems.push(item);
      }
    });

    // If all items from this import are unused, remove the entire import
    if (unusedItems.length > 0 && unusedItems.length === importedItems.length) {
      content = content.replace(importLine + '\n', '');
      removedCount++;
    }
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesFixed++;
    importsRemoved += removedCount;
    console.log(`✓ Fixed: ${file} (${removedCount} imports removed)`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Files fixed: ${filesFixed}`);
console.log(`   Imports removed: ${importsRemoved}`);
console.log(`   Total files processed: ${allFiles.length}`);

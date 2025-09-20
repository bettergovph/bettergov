#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse lint.txt to get specific errors
function parseLintErrors() {
  const lintContent = fs.readFileSync(
    path.join(__dirname, '..', 'lint.txt'),
    'utf8'
  );
  const lines = lintContent.split('\n');
  const errors = {
    reactImports: [],
    unescapedEntities: [],
    unusedImports: [],
    anyTypes: [],
  };

  lines.forEach(line => {
    // Parse React import errors
    if (line.includes("'React' must be in scope when using JSX")) {
      const match = line.match(/^(.+?):(\d+):(\d+)/);
      if (match) {
        const filePath = match[1];
        if (!errors.reactImports.some(e => e.file === filePath)) {
          errors.reactImports.push({ file: filePath });
        }
      }
    }

    // Parse unescaped entity errors
    if (line.includes('react/no-unescaped-entities')) {
      const match = line.match(/^(.+?):(\d+):(\d+)/);
      if (match) {
        errors.unescapedEntities.push({
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
        });
      }
    }

    // Parse unused import errors
    if (
      line.includes('no-unused-vars') &&
      line.includes('is defined but never used')
    ) {
      const match = line.match(/^(.+?):(\d+):(\d+)\s+error\s+'([^']+)'/);
      if (match) {
        errors.unusedImports.push({
          file: match[1],
          line: parseInt(match[2]),
          variable: match[4],
        });
      }
    }
  });

  return errors;
}

// Fix React imports
function fixReactImports(errors) {
  console.log(
    `\n📦 Fixing React imports in ${errors.reactImports.length} files...`
  );

  errors.reactImports.forEach(error => {
    const filePath = path.join(__dirname, '..', error.file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if React is already imported
    if (content.includes('import React')) {
      console.log(`  ✓ ${error.file} - React already imported`);
      return;
    }

    // Find existing React imports and add React
    const importRegex = /^import\s+{([^}]+)}\s+from\s+['"]react['"];?/m;
    const match = content.match(importRegex);

    if (match) {
      // Add React to existing import
      const newImport = `import React, {${match[1]}} from 'react';`;
      content = content.replace(match[0], newImport);
      console.log(`  ✓ ${error.file} - Added React to existing import`);
    } else {
      // Add new React import at the top
      const firstImport = content.match(/^import\s+/m);
      if (firstImport) {
        content = content.replace(
          firstImport[0],
          `import React from 'react';\n${firstImport[0]}`
        );
      } else {
        content = `import React from 'react';\n\n${content}`;
      }
      console.log(`  ✓ ${error.file} - Added new React import`);
    }

    fs.writeFileSync(filePath, content);
  });
}

// Fix unescaped entities ONLY in JSX text content
function fixUnescapedEntities(errors) {
  console.log(
    `\n✨ Fixing unescaped entities in ${new Set(errors.unescapedEntities.map(e => e.file)).size} files...`
  );

  // Group errors by file
  const errorsByFile = {};
  errors.unescapedEntities.forEach(error => {
    if (!errorsByFile[error.file]) {
      errorsByFile[error.file] = [];
    }
    errorsByFile[error.file].push(error);
  });

  Object.entries(errorsByFile).forEach(([file, fileErrors]) => {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Sort errors by line number in reverse to avoid offset issues
    fileErrors.sort((a, b) => b.line - a.line);

    fileErrors.forEach(error => {
      const lineIndex = error.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const line = lines[lineIndex];

        // Only fix if it's in JSX text content (between > and <)
        // Use a more targeted approach
        let fixedLine = line;

        // Find JSX text content patterns
        // Pattern 1: >text</
        fixedLine = fixedLine.replace(/>([^<]+)</g, (match, text) => {
          // Don't replace if it looks like it's inside an attribute
          if (text.includes('=') || text.includes('{')) return match;

          let fixedText = text.replace(/'/g, '&apos;').replace(/"/g, '&quot;');
          return `>${fixedText}<`;
        });

        // Pattern 2: Text at start of line followed by JSX
        if (fixedLine.trim().match(/^[^<>]+</)) {
          fixedLine = fixedLine.replace(
            /^(\s*)([^<]+)/,
            (match, indent, text) => {
              // Don't replace if it looks like JavaScript
              if (
                text.includes('=') ||
                text.includes('{') ||
                text.includes(';')
              )
                return match;

              let fixedText = text
                .replace(/'/g, '&apos;')
                .replace(/"/g, '&quot;');
              return indent + fixedText;
            }
          );
        }

        if (fixedLine !== line) {
          lines[lineIndex] = fixedLine;
          console.log(`  ✓ ${file}:${error.line} - Fixed unescaped entities`);
        }
      }
    });

    fs.writeFileSync(filePath, lines.join('\n'));
  });
}

// Remove unused imports
function removeUnusedImports(errors) {
  console.log(`\n🧹 Removing ${errors.unusedImports.length} unused imports...`);

  // Group by file
  const errorsByFile = {};
  errors.unusedImports.forEach(error => {
    if (!errorsByFile[error.file]) {
      errorsByFile[error.file] = [];
    }
    errorsByFile[error.file].push(error.variable);
  });

  Object.entries(errorsByFile).forEach(([file, unusedVars]) => {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    unusedVars.forEach(varName => {
      // Remove from import statements
      const importRegex = new RegExp(
        `import\\s*{([^}]*\\b${varName}\\b[^}]*)}`,
        'g'
      );
      content = content.replace(importRegex, (match, imports) => {
        const importList = imports.split(',').map(i => i.trim());
        const filtered = importList.filter(i => !i.includes(varName));

        if (filtered.length === 0) {
          // Remove the entire import line if no imports left
          return '';
        }
        return `import { ${filtered.join(', ')} }`;
      });

      // Clean up empty lines from removed imports
      content = content.replace(/^\n+/gm, '\n');
    });

    fs.writeFileSync(filePath, content);
    console.log(
      `  ✓ ${file} - Removed unused imports: ${unusedVars.join(', ')}`
    );
  });
}

// Main function
function main() {
  console.log('🔧 Smart ESLint Fixer');
  console.log('====================\n');

  try {
    const errors = parseLintErrors();

    console.log('📊 Error Summary:');
    console.log(
      `  • React imports needed: ${errors.reactImports.length} files`
    );
    console.log(
      `  • Unescaped entities: ${errors.unescapedEntities.length} occurrences`
    );
    console.log(`  • Unused imports: ${errors.unusedImports.length} variables`);

    // Fix errors in order
    fixReactImports(errors);
    fixUnescapedEntities(errors);
    removeUnusedImports(errors);

    console.log('\n✅ Done! Run npx eslint to check remaining errors.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

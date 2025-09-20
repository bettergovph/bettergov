#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse lint.txt to get unused import errors
function parseUnusedImports() {
  const lintContent = fs.readFileSync(path.join(__dirname, '..', 'lint.txt'), 'utf8');
  const lines = lintContent.split('\n');
  const errors = [];
  let currentFile = null;

  lines.forEach(line => {
    // Check for file path
    if (line.startsWith('/')) {
      currentFile = line.trim();
    }
    // Check for unused variable error
    else if (line.includes('is defined but never used') && currentFile) {
      const match = line.match(/^\s*(\d+):(\d+)\s+error\s+'([^']+)'\s+is defined but never used/);
      if (match) {
        errors.push({
          file: currentFile,
          line: parseInt(match[1]),
          column: parseInt(match[2]),
          variable: match[3]
        });
      }
    }
  });

  return errors;
}

// Fix unused imports
function fixUnusedImports(errors) {
  // Group errors by file
  const errorsByFile = {};
  errors.forEach(error => {
    if (!errorsByFile[error.file]) {
      errorsByFile[error.file] = [];
    }
    errorsByFile[error.file].push(error);
  });

  console.log(`\n🧹 Removing unused imports from ${Object.keys(errorsByFile).length} files...\n`);

  Object.entries(errorsByFile).forEach(([filePath, fileErrors]) => {
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Get unique variable names
    const unusedVars = [...new Set(fileErrors.map(e => e.variable))];

    unusedVars.forEach(varName => {
      // Match import patterns
      const patterns = [
        // Named imports: import { Foo, Bar } from 'module'
        new RegExp(`import\\s*{([^}]*\\b${varName}\\b[^}]*)}\\s*from`, 'g'),
        // Default import: import Foo from 'module'
        new RegExp(`import\\s+${varName}\\s+from\\s+['"][^'"]+['"];?\\s*$`, 'gm'),
        // Type import: import type { Foo } from 'module'
        new RegExp(`import\\s+type\\s*{([^}]*\\b${varName}\\b[^}]*)}\\s*from`, 'g'),
      ];

      patterns.forEach(pattern => {
        if (pattern.source.includes('{')) {
          // Handle named imports
          content = content.replace(pattern, (match, imports) => {
            const importList = imports.split(',').map(i => i.trim());
            const filtered = importList.filter(i => {
              // Remove the specific unused import
              const cleanImport = i.replace(/\s+as\s+\w+/, '').trim();
              return cleanImport !== varName;
            });

            if (filtered.length === 0) {
              // Remove entire import statement if no imports left
              return '';
            }

            // Rebuild import statement
            const importType = match.includes('import type') ? 'import type' : 'import';
            return match.replace(imports, ` ${filtered.join(', ')} `);
          });
        } else {
          // Handle default imports - remove the entire line
          const prevContent = content;
          content = content.replace(pattern, '');
          if (content !== prevContent) {
            modified = true;
          }
        }
      });

      // Also check for destructured variables that might not be imports
      // const { unused } = something;
      const destructurePattern = new RegExp(`const\\s*{([^}]*\\b${varName}\\b[^}]*)}`, 'g');
      content = content.replace(destructurePattern, (match, vars) => {
        const varList = vars.split(',').map(v => v.trim());
        const filtered = varList.filter(v => {
          const cleanVar = v.split(':')[0].trim();
          return cleanVar !== varName;
        });

        if (filtered.length === 0) {
          return ''; // Remove entire statement if no vars left
        }
        return `const { ${filtered.join(', ')} }`;
      });
    });

    // Clean up multiple empty lines
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    // Remove empty import lines
    content = content.replace(/^import\s*{\s*}\s*from\s*['"][^'"]+['"];?\s*$/gm, '');

    // Check if content was modified
    const originalContent = fs.readFileSync(filePath, 'utf8');
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ ${path.basename(filePath)} - Removed: ${unusedVars.join(', ')}`);
      modified = true;
    } else {
      console.log(`  ℹ️  ${path.basename(filePath)} - No changes needed`);
    }
  });
}

// Main function
function main() {
  console.log('🔍 Parsing ESLint errors from lint.txt...');

  try {
    const errors = parseUnusedImports();

    if (errors.length === 0) {
      console.log('✨ No unused import errors found!');
      return;
    }

    console.log(`Found ${errors.length} unused import errors`);
    fixUnusedImports(errors);

    console.log('\n✅ Done! Run npx eslint to check remaining errors.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse lint.txt to get unescaped entity errors
function parseUnescapedEntityErrors() {
  const lintContent = fs.readFileSync(
    path.join(__dirname, '..', 'lint.txt'),
    'utf8'
  );
  const lines = lintContent.split('\n');
  const errors = [];
  let currentFile = null;

  lines.forEach(line => {
    // Check for file path
    if (line.startsWith('/')) {
      currentFile = line.trim();
    }
    // Check for unescaped entity error
    else if (line.includes('react/no-unescaped-entities') && currentFile) {
      const match = line.match(/^\s*(\d+):(\d+)\s+error\s+`([^`]+)`/);
      if (match) {
        errors.push({
          file: currentFile,
          line: parseInt(match[1]),
          column: parseInt(match[2]),
          character: match[3],
        });
      }
    }
  });

  return errors;
}

// Fix unescaped entities at specific locations
function fixUnescapedEntities(errors) {
  // Group errors by file
  const errorsByFile = {};
  errors.forEach(error => {
    if (!errorsByFile[error.file]) {
      errorsByFile[error.file] = [];
    }
    errorsByFile[error.file].push(error);
  });

  console.log(
    `\n🔧 Fixing unescaped entities in ${Object.keys(errorsByFile).length} files...\n`
  );

  Object.entries(errorsByFile).forEach(([filePath, fileErrors]) => {
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  File not found: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let modified = false;

    // Sort errors by line and column in reverse order to avoid offset issues
    fileErrors.sort((a, b) => {
      if (b.line === a.line) {
        return b.column - a.column;
      }
      return b.line - a.line;
    });

    fileErrors.forEach(error => {
      const lineIndex = error.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const line = lines[lineIndex];
        const char = error.character;
        let newLine = line;

        // Find the character at the specific column
        // Column is 1-indexed
        const colIndex = error.column - 1;

        if (colIndex >= 0 && colIndex < line.length) {
          // Check if this is inside JSX text (not an attribute)
          // Look for patterns that indicate we're in JSX text content

          // Get context around the character
          const before = line.substring(Math.max(0, colIndex - 20), colIndex);
          const after = line.substring(
            colIndex + 1,
            Math.min(line.length, colIndex + 20)
          );

          // Check if we're inside an attribute value (has = before and no > between)
          const isInAttribute = before.includes('=') && !before.includes('>');

          // Check if we're in a JSX text node (has > before or < after without =)
          const isInJSXText =
            before.lastIndexOf('>') > before.lastIndexOf('=') ||
            (after.indexOf('<') !== -1 &&
              after.indexOf('<') < after.indexOf('='));

          if (!isInAttribute || isInJSXText) {
            // Replace the character at the specific position
            if (char === "'") {
              newLine =
                line.substring(0, colIndex) +
                '&apos;' +
                line.substring(colIndex + 1);
            } else if (char === '"') {
              newLine =
                line.substring(0, colIndex) +
                '&quot;' +
                line.substring(colIndex + 1);
            } else if (char === '>') {
              newLine =
                line.substring(0, colIndex) +
                '&gt;' +
                line.substring(colIndex + 1);
            } else if (char === '<') {
              newLine =
                line.substring(0, colIndex) +
                '&lt;' +
                line.substring(colIndex + 1);
            }

            if (newLine !== line) {
              lines[lineIndex] = newLine;
              modified = true;
              console.log(
                `  ✓ Fixed '${char}' at ${path.basename(filePath)}:${error.line}:${error.column}`
              );
            }
          } else {
            console.log(
              `  ⏭️  Skipped '${char}' in attribute at ${path.basename(filePath)}:${error.line}:${error.column}`
            );
          }
        }
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, lines.join('\n'));
      console.log(`  ✅ Saved ${path.basename(filePath)}\n`);
    }
  });
}

// Main function
function main() {
  console.log('🔍 Parsing ESLint errors from lint.txt...');

  try {
    const errors = parseUnescapedEntityErrors();

    if (errors.length === 0) {
      console.log('✨ No unescaped entity errors found!');
      return;
    }

    console.log(`Found ${errors.length} unescaped entity errors`);
    fixUnescapedEntities(errors);

    console.log('\n✅ Done! Run npx eslint to check remaining errors.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

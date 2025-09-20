const fs = require('fs');
const path = require('path');

// Files with unescaped entities that need fixing
const filesWithUnescapedEntities = [
  'src/pages/DesignGuide.tsx',
  'src/pages/Ideas.tsx',
  'src/pages/JoinUs.tsx',
];

// Fix unescaped entities in JSX
function fixUnescapedEntities(content) {
  // Only fix apostrophes and quotes that are likely in JSX text content
  // Look for patterns like >{text}'s or >{text}"

  // Fix apostrophes in common patterns
  content = content.replace(/>([^<]*)'s/g, '>$1&apos;s');
  content = content.replace(/>([^<]*)'t/g, '>$1&apos;t');
  content = content.replace(/>([^<]*)'ll/g, '>$1&apos;ll');
  content = content.replace(/>([^<]*)'ve/g, '>$1&apos;ve');
  content = content.replace(/>([^<]*)'re/g, '>$1&apos;re');
  content = content.replace(/>([^<]*)'d/g, '>$1&apos;d');
  content = content.replace(/>([^<]*)'m/g, '>$1&apos;m');

  // Fix quotes in text content (be more conservative)
  // This is tricky because we don't want to break actual string literals

  return content;
}

// Remove unused imports
function removeUnusedImports(content, unusedVars) {
  for (const varName of unusedVars) {
    // Remove from import statements
    // Pattern 1: import { A, B, C } from 'module' - remove specific import
    const importRegex = new RegExp(
      `(import\\s*{[^}]*?)\\s*,?\\s*${varName}\\s*,?\\s*([^}]*}\\s*from)`,
      'g'
    );
    content = content.replace(importRegex, (match, before, after) => {
      // Clean up extra commas
      let result = before + after;
      result = result.replace(/,\s*,/g, ',');
      result = result.replace(/{,/g, '{');
      result = result.replace(/,}/g, '}');
      return result;
    });

    // Pattern 2: If it's the only import, remove the entire line
    const soleImportRegex = new RegExp(
      `^import\\s*{\\s*${varName}\\s*}\\s*from\\s*['"][^'"]+['"];?\\s*$`,
      'gm'
    );
    content = content.replace(soleImportRegex, '');
  }

  // Clean up any resulting empty imports
  content = content.replace(/import\s*{\s*}\s*from\s*['"][^'"]+['"];?\s*/g, '');

  return content;
}

// Process files with unescaped entities
console.log('Fixing unescaped entities...');
for (const file of filesWithUnescapedEntities) {
  const filePath = path.join('/Users/arke/Projects/bettergov', file);
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Manual fixes for specific files based on the errors
    if (file === 'src/pages/DesignGuide.tsx') {
      // Line 344: 's
      content = content.replace("The component's", 'The component&apos;s');
      // Line 588: quotes
      content = content.replace('"max-width"', '&quot;max-width&quot;');
      // Line 590: 's
      content = content.replace("that's", 'that&apos;s');
    } else if (file === 'src/pages/Ideas.tsx') {
      // Line 326: 's
      content = content.replace("Let's work", 'Let&apos;s work');
    } else if (file === 'src/pages/JoinUs.tsx') {
      // Multiple apostrophes and quotes need escaping
      content = content.replace("We're building", 'We&apos;re building');
      content = content.replace("that's truly", 'that&apos;s truly');
      content = content.replace("citizen's needs", 'citizen&apos;s needs');
      content = content.replace("you're passionate", 'you&apos;re passionate');
      content = content.replace("Let's build", 'Let&apos;s build');
      content = content.replace(
        '"If you\'re not embarrassed',
        '&quot;If you&apos;re not embarrassed'
      );
      content = content.replace(
        'you\'re too late."',
        'you&apos;re too late.&quot;'
      );
      content = content.replace(
        "Philippines' future",
        'Philippines&apos; future'
      );
      content = content.replace("We're looking", 'We&apos;re looking');
      content = content.replace("don't just", 'don&apos;t just');
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Fixed unescaped entities in ${file}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message);
  }
}

// Files with unused imports to clean
const unusedImports = {
  'src/pages/Ideas.tsx': ['ChevronUp', 'ChevronDown'],
  'src/pages/flood-control-projects/contractors.tsx': [
    'BarChart3',
    'Table',
    'Map',
  ],
  'src/pages/flood-control-projects/index.tsx': ['SearchBox', 'Hits'],
  'src/pages/flood-control-projects/shared-components.tsx': [
    'ChevronDown',
    'Filter',
  ],
};

console.log('\nRemoving unused imports...');
for (const [file, vars] of Object.entries(unusedImports)) {
  const filePath = path.join('/Users/arke/Projects/bettergov', file);
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    content = removeUnusedImports(content, vars);

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Removed unused imports from ${file}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message);
  }
}

console.log('\nDone! Run "npx eslint" to see remaining errors.');

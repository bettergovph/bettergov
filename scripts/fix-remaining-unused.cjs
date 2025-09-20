#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files and their unused variables from lint.txt
const fixes = [
  {
    file: 'functions/api/crawl.ts',
    line: 41,
    variable: 'error',
    fix: 'comment-out'
  },
  {
    file: 'functions/api/forex.ts',
    line: 47,
    variable: 'env',
    fix: 'remove-param'
  },
  {
    file: 'functions/api/forex.ts',
    line: 246,
    variable: 'ctx',
    fix: 'remove-param'
  },
  {
    file: 'functions/api/weather.ts',
    line: 316,
    variable: 'ctx',
    fix: 'remove-param'
  },
  {
    file: 'src/pages/Ideas.tsx',
    line: 96,
    variable: 'setProjectIdeas',
    fix: 'comment-out'
  },
  {
    file: 'src/pages/flood-control-projects/index.tsx',
    line: 94,
    variable: 'Hit',
    fix: 'remove-destructure'
  },
  {
    file: 'src/pages/government/executive/components/ExecutiveSidebar.tsx',
    line: 23,
    variable: 'officeGroups',
    fix: 'comment-out'
  },
  {
    file: 'src/pages/government/legislative/components/LegislativeSidebar.tsx',
    line: 18,
    variable: 'filteredChambers',
    fix: 'comment-out'
  },
  {
    file: 'src/pages/government/legislative/components/LegislativeSidebar.tsx',
    line: 22,
    variable: 'handleChamberSelect',
    fix: 'comment-out'
  },
  {
    file: 'src/pages/government/local/components/LocalSidebar.tsx',
    line: 10,
    variable: 'currentRegion',
    fix: 'remove-destructure'
  },
  {
    file: 'src/pages/philippines/map/index.tsx',
    line: 167,
    variable: 'filteredMapData',
    fix: 'comment-out'
  },
  {
    file: 'src/pages/services/index.tsx',
    line: 43,
    variable: 'Service',
    fix: 'remove-type'
  }
];

function fixFile(filePath, fileFixtures) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`  ⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  let modified = false;

  // Sort fixes by line number in reverse to avoid offset issues
  fileFixtures.sort((a, b) => b.line - a.line);

  fileFixtures.forEach(fix => {
    const lineIndex = fix.line - 1;
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const line = lines[lineIndex];
      let newLine = line;

      switch (fix.fix) {
        case 'comment-out':
          // Comment out the line or part of it
          if (line.includes(`const ${fix.variable}`) || line.includes(`const [${fix.variable}`) || line.includes(`const { ${fix.variable}`)) {
            newLine = `  // ${line.trim()} // Unused variable`;
          }
          break;

        case 'remove-param':
          // Remove from function parameters
          if (line.includes(fix.variable)) {
            // For simple cases, just prefix with underscore
            newLine = line.replace(fix.variable, `_${fix.variable}`);
          }
          break;

        case 'remove-destructure':
          // Remove from destructuring
          if (line.includes(`{ ${fix.variable}`) || line.includes(`, ${fix.variable}`)) {
            // Remove the variable from destructuring
            newLine = line.replace(new RegExp(`,?\\s*${fix.variable}\\s*,?`, 'g'), (match) => {
              return match.startsWith(',') ? ',' : '';
            });
            // Clean up double commas
            newLine = newLine.replace(/,\s*,/g, ',');
            // Clean up trailing comma before }
            newLine = newLine.replace(/,\s*}/g, ' }');
            // Clean up { ,
            newLine = newLine.replace(/{\s*,/g, '{ ');
          }
          break;

        case 'remove-type':
          // For interface definitions, comment out the line
          if (line.includes(`interface ${fix.variable}`)) {
            // Comment out interface and its content
            let i = lineIndex;
            while (i < lines.length && !lines[i].includes('}')) {
              lines[i] = `// ${lines[i]}`;
              i++;
            }
            if (i < lines.length) {
              lines[i] = `// ${lines[i]}`;
            }
            modified = true;
            return;
          }
          break;
      }

      if (newLine !== line) {
        lines[lineIndex] = newLine;
        modified = true;
        console.log(`  ✓ Fixed ${fix.variable} at ${path.basename(filePath)}:${fix.line}`);
      }
    }
  });

  if (modified) {
    fs.writeFileSync(fullPath, lines.join('\n'));
    console.log(`  ✅ Saved ${path.basename(filePath)}`);
  }
}

// Main function
function main() {
  console.log('🔧 Fixing remaining unused variables...\n');

  // Group fixes by file
  const fixesByFile = {};
  fixes.forEach(fix => {
    if (!fixesByFile[fix.file]) {
      fixesByFile[fix.file] = [];
    }
    fixesByFile[fix.file].push(fix);
  });

  Object.entries(fixesByFile).forEach(([file, fileFixtures]) => {
    console.log(`\nProcessing ${file}...`);
    fixFile(file, fileFixtures);
  });

  console.log('\n✅ Done!');
}

main();
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix unused variables in forex and weather API files
function fixUnusedVars() {
  const fixes = [
    {
      file: 'functions/api/forex.ts',
      line: 47,
      search: 'env: Env',
      replace: '_env: Env',
    },
    {
      file: 'functions/api/forex.ts',
      line: 246,
      search: 'ctx: ExecutionContext',
      replace: '_ctx: ExecutionContext',
    },
    {
      file: 'functions/api/weather.ts',
      line: 316,
      search: 'ctx: ExecutionContext',
      replace: '_ctx: ExecutionContext',
    },
  ];

  fixes.forEach(fix => {
    const filePath = path.join(__dirname, '..', fix.file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${fix.file}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const lineIndex = fix.line - 1;

    if (lines[lineIndex] && lines[lineIndex].includes(fix.search)) {
      lines[lineIndex] = lines[lineIndex].replace(fix.search, fix.replace);
      fs.writeFileSync(filePath, lines.join('\n'));
      console.log(`✓ Fixed unused variable in ${fix.file}:${fix.line}`);
    }
  });
}

// Fix any types in weather.ts
function fixWeatherAny() {
  const filePath = path.join(__dirname, '..', 'functions/weather.ts');
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  weather.ts not found');
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Line 21 - replace any with unknown
  if (lines[20] && lines[20].includes(': any')) {
    lines[20] = lines[20].replace(': any', ': unknown');
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log('✓ Fixed any type in weather.ts:21');
  }
}

// Fix any types in MeilisearchInstantSearch
function fixMeilisearchAny() {
  const filePath = path.join(
    __dirname,
    '..',
    'src/components/search/MeilisearchInstantSearch.tsx'
  );
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  MeilisearchInstantSearch.tsx not found');
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;

  // Fix specific lines with any types
  const fixes = [
    { line: 110, search: ': any', replace: ': Record<string, unknown>' },
    { line: 118, search: ': any', replace: ': unknown' },
    { line: 129, search: ': any', replace: ': unknown' },
    { line: 135, search: ': any', replace: ': Record<string, unknown>' },
  ];

  fixes.forEach(fix => {
    if (lines[fix.line] && lines[fix.line].includes(fix.search)) {
      lines[fix.line] = lines[fix.line].replace(fix.search, fix.replace);
      modified = true;
      console.log(
        `✓ Fixed any type in MeilisearchInstantSearch.tsx:${fix.line + 1}`
      );
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'));
  }
}

// Remove unused FloodControlProject interface
function fixFloodControlProject() {
  const filePath = path.join(
    __dirname,
    '..',
    'src/pages/flood-control-projects/index.tsx'
  );
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  flood-control-projects/index.tsx not found');
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Find and remove the interface (should be around line 39)
  let startIndex = -1;
  let endIndex = -1;

  for (let i = 35; i < Math.min(50, lines.length); i++) {
    if (lines[i].includes('interface FloodControlProject')) {
      startIndex = i;
    }
    if (startIndex !== -1 && lines[i].trim() === '}') {
      endIndex = i;
      break;
    }
  }

  if (startIndex !== -1 && endIndex !== -1) {
    // Remove the interface and any blank lines after it
    let linesToRemove = endIndex - startIndex + 1;
    // Check if there's a blank line after
    if (endIndex + 1 < lines.length && lines[endIndex + 1].trim() === '') {
      linesToRemove++;
    }

    lines.splice(startIndex, linesToRemove);
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log('✓ Removed unused FloodControlProject interface');
  } else {
    console.log(
      'ℹ️  FloodControlProject interface not found or already removed'
    );
  }
}

// Fix React hook dependencies warnings
function fixHookDependencies() {
  const files = [
    {
      path: 'src/pages/government/legislative/house-members.tsx',
      variable: 'houseMembers',
    },
    {
      path: 'src/pages/government/legislative/party-list-members.tsx',
      variable: 'partyListMembers',
    },
    {
      path: 'src/pages/government/legislative/senate-committees.tsx',
      variable: 'committees',
    },
  ];

  files.forEach(({ path: filePath, variable }) => {
    const fullPath = path.join(__dirname, '..', filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    // Wrap the variable initialization in useMemo
    const pattern = new RegExp(
      `const ${variable} = (data\\.\\w+Data\\s*\\|\\|\\s*\\[\\]);`,
      'g'
    );
    const replacement = `const ${variable} = React.useMemo(() => data?.${variable === 'committees' ? 'senateCommittees' : variable}Data || [], [data]);`;

    if (content.includes(`const ${variable} =`)) {
      // Check if it's already wrapped in useMemo
      if (
        !content.includes(`const ${variable} = React.useMemo`) &&
        !content.includes(`const ${variable} = useMemo`)
      ) {
        // Find the line and wrap it
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (
            lines[i].includes(`const ${variable} =`) &&
            !lines[i].includes('useMemo')
          ) {
            // Extract the data property name
            const match = lines[i].match(/data\.(\w+)Data/);
            if (match) {
              lines[i] =
                `  const ${variable} = React.useMemo(() => data?.${match[1]}Data || [], [data]);`;
              console.log(
                `✓ Wrapped ${variable} in useMemo in ${path.basename(filePath)}`
              );
            }
            break;
          }
        }
        fs.writeFileSync(fullPath, lines.join('\n'));
      } else {
        console.log(`ℹ️  ${variable} already wrapped in useMemo`);
      }
    }
  });
}

// Main function
function main() {
  console.log('🔧 Fixing last ESLint errors...\n');

  console.log('Fixing unused variables...');
  fixUnusedVars();

  console.log('\nFixing any types in weather.ts...');
  fixWeatherAny();

  console.log('\nFixing any types in MeilisearchInstantSearch...');
  fixMeilisearchAny();

  console.log('\nRemoving unused FloodControlProject interface...');
  fixFloodControlProject();

  console.log('\nFixing React hook dependencies...');
  fixHookDependencies();

  console.log('\n✅ Done! Run npx eslint to check if all errors are fixed.');
}

main();

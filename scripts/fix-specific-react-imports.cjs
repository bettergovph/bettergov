#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files that need React imports (from lint.txt)
const filesNeedingReactImport = [
  'src/components/ui/StandardSidebar.tsx',
  'src/pages/flood-control-projects/tab.tsx',
  'src/pages/government/constitutional/[office].tsx',
  'src/pages/government/constitutional/layout.tsx',
  'src/pages/government/departments/layout.tsx',
  'src/pages/government/diplomatic/consulates.tsx',
  'src/pages/government/diplomatic/layout.tsx',
  'src/pages/government/diplomatic/missions.tsx',
  'src/pages/government/diplomatic/organizations.tsx',
  'src/pages/government/executive/layout.tsx',
  'src/pages/government/executive/office-of-the-president.tsx',
  'src/pages/government/executive/office-of-the-vice-president.tsx',
  'src/pages/government/executive/presidential-communications-office.tsx',
  'src/pages/government/legislative/layout.tsx',
  'src/pages/government/local/components/LocalLayout.tsx'
];

let filesFixed = 0;
let filesSkipped = 0;
let filesNotFound = 0;

console.log(`Processing ${filesNeedingReactImport.length} files that need React imports...\n`);

filesNeedingReactImport.forEach(file => {
  const filePath = path.join(process.cwd(), file);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    filesNotFound++;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Check if file already imports React
  if (content.includes("import React") || content.includes("import * as React")) {
    console.log(`⏭️  Skipped (already has React): ${file}`);
    filesSkipped++;
    return;
  }

  // Add React import at the beginning of the file
  let newContent;

  // Check if file starts with other imports
  if (content.startsWith('import ')) {
    // Add React import before other imports
    newContent = `import React from 'react';\n${content}`;
  } else if (content.startsWith('//') || content.startsWith('/*')) {
    // File starts with a comment, find where imports start
    const lines = content.split('\n');
    let insertIndex = 0;

    // Find the first non-comment line
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].trim().startsWith('//') && !lines[i].trim().startsWith('/*') && !lines[i].trim().startsWith('*') && lines[i].trim() !== '') {
        insertIndex = i;
        break;
      }
    }

    lines.splice(insertIndex, 0, "import React from 'react';");
    newContent = lines.join('\n');
  } else {
    // Just add at the beginning
    newContent = `import React from 'react';\n${content}`;
  }

  fs.writeFileSync(filePath, newContent, 'utf8');
  filesFixed++;
  console.log(`✅ Fixed: ${file}`);
});

console.log(`\n📊 Summary:`);
console.log(`   Files fixed: ${filesFixed}`);
console.log(`   Files skipped: ${filesSkipped}`);
console.log(`   Files not found: ${filesNotFound}`);
console.log(`   Total files processed: ${filesNeedingReactImport.length}`);

if (filesFixed > 0) {
  console.log(`\n✨ Successfully added React imports to ${filesFixed} files!`);
}
const fs = require('fs');

// Map of files and their specific line numbers with fixes needed
const fixes = [
  {
    file: 'src/pages/government/departments/index.tsx',
    fixes: [
      { line: 43, find: "The President's", replace: "The President&apos;s" },
      { line: 43, find: "nation's policies", replace: "nation&apos;s policies" }
    ]
  },
  {
    file: 'src/pages/government/local/index.tsx',
    fixes: [
      { line: 115, find: "The region you're looking for doesn't", replace: "The region you&apos;re looking for doesn&apos;t" }
    ]
  },
  {
    file: 'src/pages/government/local/[region].tsx',
    fixes: [
      { line: 115, find: "The region you're looking for doesn't", replace: "The region you&apos;re looking for doesn&apos;t" }
    ]
  },
  {
    file: 'src/pages/philippines/about/index.tsx',
    fixes: [
      { line: 158, find: "it's a cultural", replace: "it&apos;s a cultural" }
    ]
  },
  {
    file: 'src/pages/philippines/culture/index.tsx',
    fixes: [
      { line: 228, find: "\"Respect for elders\"", replace: "&quot;Respect for elders&quot;" },
      { line: 228, find: "\"Filipino hospitality\"", replace: "&quot;Filipino hospitality&quot;" }
    ]
  },
  {
    file: 'src/pages/philippines/history/index.tsx',
    fixes: [
      { line: 51, find: "Philippines' journey", replace: "Philippines&apos; journey" }
    ]
  },
  {
    file: 'src/pages/philippines/regions/index.tsx',
    fixes: [
      { line: 235, find: "Region I's", replace: "Region I&apos;s" }
    ]
  },
  {
    file: 'src/pages/services/websites/index.tsx',
    fixes: [
      { line: 105, find: "View the website's", replace: "View the website&apos;s" }
    ]
  },
  {
    file: 'src/pages/sitemap/index.tsx',
    fixes: [
      { line: 115, find: "\"Ilocos Region\"", replace: "&quot;Ilocos Region&quot;" }
    ]
  },
  {
    file: 'src/pages/travel/visa-types/index.tsx',
    fixes: [
      { line: 76, find: "\"Balikbayan\"", replace: "&quot;Balikbayan&quot;" }
    ]
  },
  {
    file: 'src/pages/travel/visa-types/[type].tsx',
    fixes: [
      { line: 115, find: "\"temporary visitor\"", replace: "&quot;temporary visitor&quot;" }
    ]
  }
];

console.log('Fixing unescaped entities in specific files...\n');

for (const fileInfo of fixes) {
  const filePath = `/Users/arke/Projects/bettergov/${fileInfo.file}`;

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let changesMade = false;

    for (const fix of fileInfo.fixes) {
      const lineIndex = fix.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const originalLine = lines[lineIndex];
        const newLine = lines[lineIndex].replace(fix.find, fix.replace);

        if (originalLine !== newLine) {
          lines[lineIndex] = newLine;
          changesMade = true;
          console.log(`✓ Fixed line ${fix.line} in ${fileInfo.file}`);
          console.log(`  "${fix.find}" → "${fix.replace}"`);
        }
      }
    }

    if (changesMade) {
      fs.writeFileSync(filePath, lines.join('\n'));
      console.log(`✓ Saved ${fileInfo.file}\n`);
    } else {
      console.log(`⚠ No changes needed in ${fileInfo.file}\n`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${fileInfo.file}: ${error.message}\n`);
  }
}

console.log('Done!');
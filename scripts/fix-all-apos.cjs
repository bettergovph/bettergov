const fs = require('fs');
const glob = require('glob');

// Find all tsx and jsx files
const files = glob.sync('/Users/arke/Projects/bettergov/src/**/*.{tsx,jsx}');

console.log(`Fixing &apos; and &quot; in ${files.length} files...\n`);

let fixedCount = 0;

for (const filePath of files) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Fix &apos; that appear in JSX attributes (should be ')
    // These patterns match attributes like href='..&apos; or path='..&apos;
    content = content.replace(/(\s+\w+)=['"]([^'"]*?)&apos;/g, "$1='$2'");
    content = content.replace(/(\s+\w+)=['"]([^'"]*?)&quot;/g, '$1="$2"');

    // Fix trailing &apos; at the end of attribute values
    content = content.replace(/&apos;(['"])/g, "'$1");
    content = content.replace(/&quot;(['"])/g, '"$1');

    // Fix &apos; in the middle of attribute values that shouldn't be there
    content = content.replace(
      /(['"])([^'"]*?)&apos;([^'"]*?)(['"])/g,
      "$1$2'$3$4"
    );
    content = content.replace(
      /(['"])([^'"]*?)&quot;([^'"]*?)(['"])/g,
      '$1$2"$3$4'
    );

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Fixed ${filePath}`);
      fixedCount++;
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}: ${error.message}`);
  }
}

console.log(`\n✅ Fixed &apos; and &quot; in ${fixedCount} files`);

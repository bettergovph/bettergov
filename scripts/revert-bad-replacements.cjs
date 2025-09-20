const fs = require('fs');
const glob = require('glob');

// Find all tsx and jsx files
const files = glob.sync('/Users/arke/Projects/bettergov/src/**/*.{tsx,jsx}');

console.log(`Reverting bad replacements in ${files.length} files...\n`);

let fixedCount = 0;

for (const filePath of files) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Fix patterns where &apos; was incorrectly added to attribute names
    // Common patterns to fix:

    // Fix attribute names that got &apos; appended
    content = content.replace(/(\s+\w+)&apos;(\s*=)/g, "$1'$2");
    content = content.replace(/(\s+\w+)&apos;>/g, "$1'>");
    content = content.replace(/(\s+\w+)&quot;(\s*=)/g, '$1"$2');

    // Fix specific common attribute patterns
    content = content.replace(/address&apos;/g, "address'");
    content = content.replace(/permits&apos;/g, "permits'");
    content = content.replace(/transition-colors&apos;/g, "transition-colors'");
    content = content.replace(/text-xs&apos;/g, "text-xs'");
    content = content.replace(/Projects&apos;/g, "Projects'");
    content = content.replace(/contractors&apos;/g, "contractors'");
    content = content.replace(
      /flood-control-projects-contractors&apos;/g,
      "flood-control-projects-contractors'"
    );
    content = content.replace(/All Projects&apos;/g, "All Projects'");
    content = content.replace(
      /Flood Control Projects&apos;/g,
      "Flood Control Projects'"
    );
    content = content.replace(
      /All Flood Control Projects&apos;/g,
      "All Flood Control Projects'"
    );

    // Fix URLs and links that got messed up
    content = content.replace(/href='([^']*?)&apos;/g, "href='$1'");
    content = content.replace(/to='([^']*?)&apos;/g, "to='$1'");
    content = content.replace(/url='([^']*?)&apos;/g, "url='$1'");

    // Fix specific paths
    content = content.replace(
      /\/government\/departments&apos;/g,
      "/government/departments'"
    );
    content = content.replace(
      /\/travel\/visa-types&apos;/g,
      "/travel/visa-types'"
    );
    content = content.replace(
      /\/philippines\/regions&apos;/g,
      "/philippines/regions'"
    );
    content = content.replace(/\/join-us&apos;/g, "/join-us'");
    content = content.replace(/\/ideas&apos;/g, "/ideas'");
    content = content.replace(
      /bettergov.ph\/ideas&apos;/g,
      "bettergov.ph/ideas'"
    );
    content = content.replace(
      /bettergov.ph\/join-us&apos;/g,
      "bettergov.ph/join-us'"
    );

    // Fix object keys and values that got messed up
    content = content.replace(/Main Pages&apos;/g, "Main Pages'");
    content = content.replace(/All Services&apos;/g, "All Services'");
    content = content.replace(
      /Government Websites Directory/g,
      'Government Websites Directory'
    );
    content = content.replace(/Philippines&apos;/g, "Philippines'");
    content = content.replace(
      /About the Philippines&apos;/g,
      "About the Philippines'"
    );
    content = content.replace(/Visa Information/g, 'Visa Information');
    content = content.replace(
      /Foreign Exchange Rates&apos;/g,
      "Foreign Exchange Rates'"
    );
    content = content.replace(
      /Flood Control Projects&apos;/g,
      "Flood Control Projects'"
    );

    // Fix category/type names
    content = content.replace(
      /category: 'Business&apos;/g,
      "category: 'Business'"
    );
    content = content.replace(/Festivals&apos;/g, "Festivals'");
    content = content.replace(/Social Values&apos;/g, "Social Values'");
    content = content.replace(/Arts and Crafts&apos;/g, "Arts and Crafts'");
    content = content.replace(
      /Infrastructure & Tools&apos;/g,
      "Infrastructure & Tools'"
    );
    content = content.replace(/'keywords&apos;/g, "'keywords'");

    // Fix descriptions that should keep their apostrophes escaped
    // (These are legitimate and should stay as &apos;)
    // But we need to make sure they're in the right context (inside JSX text, not attributes)

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Fixed ${filePath}`);
      fixedCount++;
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}: ${error.message}`);
  }
}

console.log(`\n✅ Reverted bad replacements in ${fixedCount} files`);

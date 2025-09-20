const fs = require('fs');
const path = require('path');

// List of all TSX/JSX files to scan
const glob = require('glob');

// Find all tsx and jsx files
const files = glob.sync('/Users/arke/Projects/bettergov/src/**/*.{tsx,jsx}');

console.log(`Scanning ${files.length} files for unescaped entities...\n`);

let totalFixes = 0;

for (const filePath of files) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Replace common contractions in JSX text content
    // Use a more aggressive approach - replace all apostrophes and quotes in JSX text

    // Replace apostrophes in contractions (between > and <)
    const patterns = [
      // Contractions with 't
      [/(\>[\s\S]*?)don't([\s\S]*?\<)/g, '$1don&apos;t$2'],
      [/(\>[\s\S]*?)can't([\s\S]*?\<)/g, '$1can&apos;t$2'],
      [/(\>[\s\S]*?)won't([\s\S]*?\<)/g, '$1won&apos;t$2'],
      [/(\>[\s\S]*?)isn't([\s\S]*?\<)/g, '$1isn&apos;t$2'],
      [/(\>[\s\S]*?)aren't([\s\S]*?\<)/g, '$1aren&apos;t$2'],
      [/(\>[\s\S]*?)wasn't([\s\S]*?\<)/g, '$1wasn&apos;t$2'],
      [/(\>[\s\S]*?)weren't([\s\S]*?\<)/g, '$1weren&apos;t$2'],
      [/(\>[\s\S]*?)hasn't([\s\S]*?\<)/g, '$1hasn&apos;t$2'],
      [/(\>[\s\S]*?)haven't([\s\S]*?\<)/g, '$1haven&apos;t$2'],
      [/(\>[\s\S]*?)hadn't([\s\S]*?\<)/g, '$1hadn&apos;t$2'],
      [/(\>[\s\S]*?)doesn't([\s\S]*?\<)/g, '$1doesn&apos;t$2'],
      [/(\>[\s\S]*?)didn't([\s\S]*?\<)/g, '$1didn&apos;t$2'],
      [/(\>[\s\S]*?)couldn't([\s\S]*?\<)/g, '$1couldn&apos;t$2'],
      [/(\>[\s\S]*?)shouldn't([\s\S]*?\<)/g, '$1shouldn&apos;t$2'],
      [/(\>[\s\S]*?)wouldn't([\s\S]*?\<)/g, '$1wouldn&apos;t$2'],

      // Contractions with 's
      [/(\>[\s\S]*?)it's([\s\S]*?\<)/g, '$1it&apos;s$2'],
      [/(\>[\s\S]*?)It's([\s\S]*?\<)/g, '$1It&apos;s$2'],
      [/(\>[\s\S]*?)that's([\s\S]*?\<)/g, '$1that&apos;s$2'],
      [/(\>[\s\S]*?)what's([\s\S]*?\<)/g, '$1what&apos;s$2'],
      [/(\>[\s\S]*?)there's([\s\S]*?\<)/g, '$1there&apos;s$2'],
      [/(\>[\s\S]*?)here's([\s\S]*?\<)/g, '$1here&apos;s$2'],
      [/(\>[\s\S]*?)who's([\s\S]*?\<)/g, '$1who&apos;s$2'],
      [/(\>[\s\S]*?)let's([\s\S]*?\<)/g, '$1let&apos;s$2'],
      [/(\>[\s\S]*?)Let's([\s\S]*?\<)/g, '$1Let&apos;s$2'],

      // Contractions with 're
      [/(\>[\s\S]*?)we're([\s\S]*?\<)/g, '$1we&apos;re$2'],
      [/(\>[\s\S]*?)We're([\s\S]*?\<)/g, '$1We&apos;re$2'],
      [/(\>[\s\S]*?)you're([\s\S]*?\<)/g, '$1you&apos;re$2'],
      [/(\>[\s\S]*?)You're([\s\S]*?\<)/g, '$1You&apos;re$2'],
      [/(\>[\s\S]*?)they're([\s\S]*?\<)/g, '$1they&apos;re$2'],

      // Contractions with 've
      [/(\>[\s\S]*?)I've([\s\S]*?\<)/g, '$1I&apos;ve$2'],
      [/(\>[\s\S]*?)we've([\s\S]*?\<)/g, '$1we&apos;ve$2'],
      [/(\>[\s\S]*?)We've([\s\S]*?\<)/g, '$1We&apos;ve$2'],
      [/(\>[\s\S]*?)you've([\s\S]*?\<)/g, '$1you&apos;ve$2'],
      [/(\>[\s\S]*?)they've([\s\S]*?\<)/g, '$1they&apos;ve$2'],

      // Contractions with 'll
      [/(\>[\s\S]*?)I'll([\s\S]*?\<)/g, '$1I&apos;ll$2'],
      [/(\>[\s\S]*?)we'll([\s\S]*?\<)/g, '$1we&apos;ll$2'],
      [/(\>[\s\S]*?)you'll([\s\S]*?\<)/g, '$1you&apos;ll$2'],
      [/(\>[\s\S]*?)they'll([\s\S]*?\<)/g, '$1they&apos;ll$2'],

      // Contractions with 'd
      [/(\>[\s\S]*?)I'd([\s\S]*?\<)/g, '$1I&apos;d$2'],
      [/(\>[\s\S]*?)we'd([\s\S]*?\<)/g, '$1we&apos;d$2'],
      [/(\>[\s\S]*?)you'd([\s\S]*?\<)/g, '$1you&apos;d$2'],
      [/(\>[\s\S]*?)they'd([\s\S]*?\<)/g, '$1they&apos;d$2'],

      // Contractions with 'm
      [/(\>[\s\S]*?)I'm([\s\S]*?\<)/g, '$1I&apos;m$2'],

      // Possessives
      [/(\>[\s\S]*?)(\w+)'s([\s\S]*?\<)/g, '$1$2&apos;s$3'],
      [/(\>[\s\S]*?)(\w+)s'([\s\S]*?\<)/g, '$1$2s&apos;$3'],

      // Quotes in text content - be careful here
      [/(\>[\s\S]*?)"([^"<>]+)"([\s\S]*?\<)/g, '$1&quot;$2&quot;$3'],
    ];

    for (const [pattern, replacement] of patterns) {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
      }
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      const basename = path.basename(filePath);
      console.log(`✓ Fixed ${basename}`);
      totalFixes++;
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}: ${error.message}`);
  }
}

console.log(`\n✨ Fixed ${totalFixes} files with unescaped entities`);

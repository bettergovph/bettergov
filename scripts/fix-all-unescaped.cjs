const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all files with unescaped entity errors from ESLint
const eslintOutput = execSync('npx eslint 2>&1 || true', { encoding: 'utf8' });
const lines = eslintOutput.split('\n');

const filesWithErrors = new Map();

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('react/no-unescaped-entities')) {
    // Find the file path (look backwards)
    for (let j = i - 1; j >= 0 && j >= i - 10; j--) {
      if (lines[j].startsWith('/Users/arke/Projects/bettergov/')) {
        const [filePath, lineNum] = lines[j].split(':');
        if (!filesWithErrors.has(filePath)) {
          filesWithErrors.set(filePath, []);
        }

        // Extract what needs escaping from the error message
        const errorMatch = line.match(/`([^`]+)` can be escaped/);
        if (errorMatch) {
          filesWithErrors.get(filePath).push({
            line: parseInt(lineNum),
            char: errorMatch[1],
            fullLine: lines[j],
          });
        }
        break;
      }
    }
  }
}

console.log(`Found ${filesWithErrors.size} files with unescaped entities\n`);

// Fix each file
for (const [filePath, errors] of filesWithErrors) {
  console.log(`Fixing ${path.basename(filePath)}...`);

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Sort errors by line number in reverse order to avoid offset issues
    errors.sort((a, b) => b.line - a.line);

    for (const error of errors) {
      const lineIndex = error.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        let line = lines[lineIndex];

        // Apply fixes based on the character that needs escaping
        // Only fix within JSX text content (between > and <)
        if (error.char === "'") {
          // Common contractions and possessives
          line = line.replace(/(>[^<]*)(don't)([^<]*<)/g, '$1don&apos;t$3');
          line = line.replace(/(>[^<]*)(can't)([^<]*<)/g, '$1can&apos;t$3');
          line = line.replace(/(>[^<]*)(won't)([^<]*<)/g, '$1won&apos;t$3');
          line = line.replace(/(>[^<]*)(isn't)([^<]*<)/g, '$1isn&apos;t$3');
          line = line.replace(/(>[^<]*)(aren't)([^<]*<)/g, '$1aren&apos;t$3');
          line = line.replace(/(>[^<]*)(wasn't)([^<]*<)/g, '$1wasn&apos;t$3');
          line = line.replace(/(>[^<]*)(weren't)([^<]*<)/g, '$1weren&apos;t$3');
          line = line.replace(/(>[^<]*)(hasn't)([^<]*<)/g, '$1hasn&apos;t$3');
          line = line.replace(/(>[^<]*)(haven't)([^<]*<)/g, '$1haven&apos;t$3');
          line = line.replace(/(>[^<]*)(hadn't)([^<]*<)/g, '$1hadn&apos;t$3');
          line = line.replace(/(>[^<]*)(doesn't)([^<]*<)/g, '$1doesn&apos;t$3');
          line = line.replace(/(>[^<]*)(didn't)([^<]*<)/g, '$1didn&apos;t$3');
          line = line.replace(
            /(>[^<]*)(couldn't)([^<]*<)/g,
            '$1couldn&apos;t$3'
          );
          line = line.replace(
            /(>[^<]*)(shouldn't)([^<]*<)/g,
            '$1shouldn&apos;t$3'
          );
          line = line.replace(
            /(>[^<]*)(wouldn't)([^<]*<)/g,
            '$1wouldn&apos;t$3'
          );
          line = line.replace(/(>[^<]*)(it's)([^<]*<)/g, '$1it&apos;s$3');
          line = line.replace(/(>[^<]*)(that's)([^<]*<)/g, '$1that&apos;s$3');
          line = line.replace(/(>[^<]*)(what's)([^<]*<)/g, '$1what&apos;s$3');
          line = line.replace(/(>[^<]*)(there's)([^<]*<)/g, '$1there&apos;s$3');
          line = line.replace(/(>[^<]*)(here's)([^<]*<)/g, '$1here&apos;s$3');
          line = line.replace(/(>[^<]*)(who's)([^<]*<)/g, '$1who&apos;s$3');
          line = line.replace(/(>[^<]*)(let's)([^<]*<)/g, '$1let&apos;s$3');
          line = line.replace(/(>[^<]*)(Let's)([^<]*<)/g, '$1Let&apos;s$3');
          line = line.replace(/(>[^<]*)(we're)([^<]*<)/g, '$1we&apos;re$3');
          line = line.replace(/(>[^<]*)(We're)([^<]*<)/g, '$1We&apos;re$3');
          line = line.replace(/(>[^<]*)(you're)([^<]*<)/g, '$1you&apos;re$3');
          line = line.replace(/(>[^<]*)(You're)([^<]*<)/g, '$1You&apos;re$3');
          line = line.replace(/(>[^<]*)(they're)([^<]*<)/g, '$1they&apos;re$3');
          line = line.replace(/(>[^<]*)(I'm)([^<]*<)/g, '$1I&apos;m$3');
          line = line.replace(/(>[^<]*)(I've)([^<]*<)/g, '$1I&apos;ve$3');
          line = line.replace(/(>[^<]*)(we've)([^<]*<)/g, '$1we&apos;ve$3');
          line = line.replace(/(>[^<]*)(We've)([^<]*<)/g, '$1We&apos;ve$3');
          line = line.replace(/(>[^<]*)(you've)([^<]*<)/g, '$1you&apos;ve$3');
          line = line.replace(/(>[^<]*)(they've)([^<]*<)/g, '$1they&apos;ve$3');
          line = line.replace(/(>[^<]*)(I'll)([^<]*<)/g, '$1I&apos;ll$3');
          line = line.replace(/(>[^<]*)(we'll)([^<]*<)/g, '$1we&apos;ll$3');
          line = line.replace(/(>[^<]*)(you'll)([^<]*<)/g, '$1you&apos;ll$3');
          line = line.replace(/(>[^<]*)(they'll)([^<]*<)/g, '$1they&apos;ll$3');
          line = line.replace(/(>[^<]*)(I'd)([^<]*<)/g, '$1I&apos;d$3');
          line = line.replace(/(>[^<]*)(we'd)([^<]*<)/g, '$1we&apos;d$3');
          line = line.replace(/(>[^<]*)(you'd)([^<]*<)/g, '$1you&apos;d$3');
          line = line.replace(/(>[^<]*)(they'd)([^<]*<)/g, '$1they&apos;d$3');

          // Possessives
          line = line.replace(/(>[^<]*)(\w)'s([^<]*<)/g, '$1$2&apos;s$3');
          line = line.replace(/(>[^<]*)(\w)s'([^<]*<)/g, '$1$2s&apos;$3');
        } else if (error.char === '"') {
          // Replace quotes in JSX text content
          line = line.replace(
            /(>[^<]*)"([^"]*)"([^<]*<)/g,
            '$1&quot;$2&quot;$3'
          );
        }

        lines[lineIndex] = line;
      }
    }

    const newContent = lines.join('\n');
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent);
      console.log(`  ✓ Fixed ${errors.length} unescaped entities`);
    } else {
      console.log(`  ⚠ No changes made (may need manual fix)`);
    }
  } catch (err) {
    console.error(`  ✗ Error: ${err.message}`);
  }
}

console.log('\nDone!');

const fs = require('fs');
const { execSync } = require('child_process');

// Get current commit hash
const hash = import.meta.env.HEAD_COMMIT_HASH;

// Prepare manifest object
const manifest = { head_commit: hash };

// Ensure output directory exists
fs.mkdirSync('public', { recursive: true });

// Write to public/manifest.json
fs.writeFileSync('public/manifest.json', JSON.stringify(manifest, null, 2));

console.log('✅ Manifest written to public/manifest.json');

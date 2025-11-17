#!/usr/bin/env node

/**
 * Validate JSON files against a JSON schema
 *
 * Usage:
 *   node validate-json-schema.js <schema-path> <files-pattern>
 *   node validate-json-schema.js <schema-path> <file1> <file2> ...
 *
 * Examples:
 *   node validate-json-schema.js schema.json data/*.json
 *   node validate-json-schema.js schema.json file1.json file2.json
 */

import { readFileSync, statSync } from 'fs';
import { resolve, basename } from 'path';
import { createRequire } from 'module';
import { glob } from 'glob';

const require = createRequire(import.meta.url);
const Ajv = require('ajv');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Error: Missing required arguments\n');
  console.error('Usage:');
  console.error('  node validate-json-schema.js <schema-path> <files-pattern>');
  console.error(
    '  node validate-json-schema.js <schema-path> <file1> <file2> ...\n'
  );
  console.error('Examples:');
  console.error('  node validate-json-schema.js schema.json "data/*.json"');
  console.error(
    '  node validate-json-schema.js schema.json file1.json file2.json'
  );
  process.exit(1);
}

const schemaPath = resolve(args[0]);
const filePatterns = args.slice(1);

// Load schema
let schema;
try {
  schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
} catch (err) {
  console.error(`Error loading schema from ${schemaPath}:`);
  console.error(err.message);
  process.exit(1);
}

const ajv = new Ajv({ allErrors: true, verbose: true });
let validate;
try {
  validate = ajv.compile(schema);
} catch (err) {
  console.error('Error compiling schema:');
  console.error(err.message);
  process.exit(1);
}

// Collect files to validate
const files = [];
for (const pattern of filePatterns) {
  const resolvedPattern = resolve(pattern);

  try {
    const stats = statSync(resolvedPattern);
    if (stats.isFile()) {
      files.push(resolvedPattern);
    }
  } catch {
    // Not a direct file path, try glob
    const matches = glob.sync(pattern, { nodir: true });
    if (matches.length === 0) {
      console.error(`Warning: No files found matching pattern: ${pattern}`);
    } else {
      files.push(...matches.map(f => resolve(f)));
    }
  }
}

const uniqueFiles = [...new Set(files)];

if (uniqueFiles.length === 0) {
  console.error('Error: No files to validate');
  process.exit(1);
}

console.log(
  `Validating ${uniqueFiles.length} file(s) against ${basename(schemaPath)}...\n`
);

let errorCount = 0;
let successCount = 0;

for (const filePath of uniqueFiles) {
  let data;
  try {
    data = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.log(`✗ ${basename(filePath)}`);
    console.log(`  Error: Invalid JSON - ${err.message}\n`);
    errorCount++;
    continue;
  }

  const valid = validate(data);

  if (valid) {
    console.log(`✓ ${basename(filePath)}`);
    successCount++;
  } else {
    console.log(`✗ ${basename(filePath)}`);
    console.log(`  Errors:`);
    validate.errors.forEach(err => {
      const path = err.instancePath || '(root)';
      console.log(`    - ${path}: ${err.message}`);
      if (err.params && Object.keys(err.params).length > 0) {
        console.log(`      ${JSON.stringify(err.params)}`);
      }
    });
    console.log();
    errorCount++;
  }
}

console.log(`\nResults: ${successCount} passed, ${errorCount} failed`);
process.exit(errorCount > 0 ? 1 : 0);

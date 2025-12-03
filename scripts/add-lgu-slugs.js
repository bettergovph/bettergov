#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to create URL-friendly slugs
function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Path to the LGU JSON file
const lguFilePath = path.join(__dirname, '../src/data/directory/lgu.json');

try {
  // Read the existing LGU data
  console.log('📖 Reading LGU data...');
  const lguData = JSON.parse(fs.readFileSync(lguFilePath, 'utf8'));

  console.log(`✅ Found ${lguData.length} regions`);

  // Add slugs to each region
  const updatedData = lguData.map((region, index) => {
    const slug = createSlug(region.region);
    console.log(`  ${index + 1}. ${region.region} → ${slug}`);

    return {
      ...region,
      slug: slug,
    };
  });

  // Write the updated data back to the file
  console.log('\n💾 Writing updated data...');
  fs.writeFileSync(lguFilePath, JSON.stringify(updatedData, null, 2), 'utf8');

  console.log('✅ Successfully added slugs to lgu.json!');
  console.log('\n📊 Summary:');
  console.log(`   • Regions processed: ${updatedData.length}`);
  console.log(`   • Slugs added: ${updatedData.length}`);

  // Show a sample of the slugs created
  console.log('\n🔗 Sample slugs created:');
  updatedData.slice(0, 5).forEach((region, index) => {
    console.log(`   ${index + 1}. ${region.region} → /${region.slug}`);
  });

  if (updatedData.length > 5) {
    console.log(`   ... and ${updatedData.length - 5} more`);
  }
} catch (error) {
  console.error('❌ Error processing LGU data:', error.message);
  process.exit(1);
}

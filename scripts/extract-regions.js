import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the current file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the LGU JSON file
const lguFilePath = join(__dirname, '../src/data/directory/lgu.json');
// Output path for the regions JSON file
const outputFilePath = join(__dirname, '../src/data/regions.json');

async function extractRegions() {
  try {
    // Read and parse the LGU JSON file
    const data = await readFile(lguFilePath, 'utf8');
    const lguData = JSON.parse(data);

    // Extract region data
    const regions = lguData.map(region => ({
      name: region.region,
      slug: region.slug || generateSlug(region.region),
    }));

    // Write the extracted regions to a new JSON file
    await writeFile(outputFilePath, JSON.stringify(regions, null, 2), 'utf8');

    console.log(
      `✅ Successfully extracted ${regions.length} regions to ${outputFilePath}`
    );
  } catch (error) {
    console.error('❌ Error processing LGU data:', error);
    process.exit(1);
  }
}

// Helper function to generate a slug from a string
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

// Run the extraction
extractRegions();

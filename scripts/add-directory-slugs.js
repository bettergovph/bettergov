import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration for different file types
const FILE_CONFIGS = {
  departments: {
    path: '../src/data/directory/departments.json',
    slugField: 'office_name',
    isArray: true,
  },
  constitutional: {
    path: '../src/data/directory/constitutional.json',
    slugField: 'name',
    isArray: true,
  },
  legislative: {
    path: '../src/data/directory/legislative.json',
    slugField: 'chamber',
    isArray: true,
  },
  diplomatic: {
    path: '../src/data/directory/diplomatic.json',
    slugField: 'country',
    isNested: true,
    nestedKey: 'Diplomatic Mission',
    isArray: true,
  },
  executive: {
    path: '../src/data/directory/executive.json',
    slugField: 'office',
    isArray: true,
  },
  lgu: {
    path: '../src/data/directory/lgu.json',
    slugField: 'region',
    isArray: true,
  },
};

// Function to generate a URL-friendly slug from a string
function generateSlug(name) {
  if (!name) return '';

  return String(name)
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with a single one
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

async function processFile(fileConfig) {
  try {
    const filePath = join(__dirname, fileConfig.path);

    // Read the file
    const data = await fs.readFile(filePath, 'utf8');
    let content = JSON.parse(data);

    let updatedCount = 0;
    let itemsToProcess = [];

    // Handle different file structures
    if (fileConfig.isNested && fileConfig.nestedKey) {
      // For files with nested structure like diplomatic.json
      itemsToProcess = content[fileConfig.nestedKey] || [];
    } else if (fileConfig.isArray) {
      // For array-based files
      itemsToProcess = content;
    } else {
      // For single object files (not currently used but added for completeness)
      itemsToProcess = [content];
    }

    // Add slug to each item
    const updatedItems = itemsToProcess.map(item => {
      // Skip if already has a slug
      if (item.slug) return item;

      const slugValue = item[fileConfig.slugField];
      if (!slugValue) return item;

      updatedCount++;
      return {
        slug: generateSlug(slugValue),
        ...item,
      };
    });

    // Reconstruct the content with updated items
    let updatedContent;
    if (fileConfig.isNested && fileConfig.nestedKey) {
      updatedContent = {
        ...content,
        [fileConfig.nestedKey]: updatedItems,
      };
    } else if (fileConfig.isArray) {
      updatedContent = updatedItems;
    } else {
      updatedContent = updatedItems[0] || content;
    }

    // Write the updated data back to the file
    await fs.writeFile(
      filePath,
      JSON.stringify(updatedContent, null, 2),
      'utf8'
    );

    const fileName = fileConfig.path.split('/').pop();
    console.log(`✅ Successfully processed ${fileName}`);
    console.log(`   Updated ${updatedCount} items`);

    return updatedCount;
  } catch (error) {
    console.error(`❌ Error processing ${fileConfig.path}:`, error.message);
    return 0;
  }
}

async function addSlugsToAllFiles() {
  console.log('🚀 Starting to process files...\n');

  let totalUpdated = 0;

  // Process each configured file
  for (const [name, config] of Object.entries(FILE_CONFIGS)) {
    console.log(`📄 Processing ${name}...`);
    const updated = await processFile(config);
    totalUpdated += updated;
    console.log();
  }

  console.log('🎉 All files processed successfully!');
  console.log(`📊 Total items updated: ${totalUpdated}`);
}

// Run the script
addSlugsToAllFiles();

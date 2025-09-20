import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to create slug from string
function createSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single
    .trim();
}

async function main() {
  try {
    // Read the services and categories data
    const servicesData = await fs.readFile(
      join(__dirname, '../src/data/services.json'),
      'utf8'
    );
    const categoriesData = await fs.readFile(
      join(__dirname, '../src/data/service_categories.json'),
      'utf8'
    );

    const services = JSON.parse(servicesData);
    const { categories } = JSON.parse(categoriesData);

    // Create a map of category names to their slugs and subcategories
    const categoryMap = new Map();
    categories.forEach(cat => {
      const subcatMap = new Map();
      cat.subcategories.forEach(subcat => {
        subcatMap.set(subcat.name, subcat.slug);
      });
      categoryMap.set(cat.category, {
        slug: cat.slug,
        subcategories: subcatMap,
      });
    });

    // Group services by category
    const servicesByCategory = new Map();

    services.forEach(service => {
      const { category, subcategory, ...rest } = service;

      // Get category info
      const categoryInfo = categoryMap.get(category) || {
        slug: createSlug(category),
        subcategories: new Map(),
      };

      // Generate slug for subcategory if not found
      let subcategorySlug = categoryInfo.subcategories.get(subcategory);
      if (!subcategorySlug) {
        subcategorySlug = createSlug(subcategory);
        categoryInfo.subcategories.set(subcategory, subcategorySlug);
      }

      // Add new fields to service
      const enhancedService = {
        ...rest,
        id: uuidv4(),
        slug: createSlug(service.service),
        published: true,
        category: {
          name: category,
          slug: categoryInfo.slug,
        },
        subcategory: {
          name: subcategory,
          slug: subcategorySlug,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Group by category
      if (!servicesByCategory.has(category)) {
        servicesByCategory.set(category, []);
      }
      servicesByCategory.get(category).push(enhancedService);
    });

    // Create services directory if it doesn't exist
    const outputDir = join(__dirname, '../src/data/services');
    await fs.mkdir(outputDir, { recursive: true });

    // Save each category's services to a separate file
    for (const [category, categoryServices] of servicesByCategory) {
      const categorySlug =
        categoryMap.get(category)?.slug || createSlug(category);
      const outputPath = join(outputDir, `${categorySlug}.json`);

      await fs.writeFile(
        outputPath,
        JSON.stringify(categoryServices, null, 2),
        'utf8'
      );

      console.log(`Saved ${categoryServices.length} services to ${outputPath}`);
    }

    console.log('\nAll services have been processed and saved successfully!');
  } catch (error) {
    console.error('Error processing services:', error);
    process.exit(1);
  }
}

main();

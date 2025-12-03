// scripts/index_meilisearch.cjs
require('dotenv').config(); // To load .env file

const { MeiliSearch } = require('meilisearch');
const fs = require('fs').promises;
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const RESET_INDEX = args.includes('--reset') || args.includes('-r');

// __dirname will point to the 'scripts' directory when this JS file is run directly.
const MEILISEARCH_HOST =
  process.env.VITE_MEILISEARCH_HOST || 'http://localhost';
const MEILISEARCH_PORT = process.env.VITE_MEILISEARCH_PORT || '7700';
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_MASTER_KEY || ''; // Use MASTER KEY for admin operations

const client = new MeiliSearch({
  host: `${MEILISEARCH_HOST}:${MEILISEARCH_PORT}`,
  apiKey: MEILISEARCH_API_KEY,
});

const SINGLE_INDEX_NAME = 'bettergov';

// dataBasePath will always be relative to the 'scripts' directory
// __dirname (in CommonJS) is the directory of the current module.
// So, path.join(__dirname, '..', 'src', 'data') correctly points from 'scripts' to 'src/data'.
const dataBasePath = path.join(__dirname, '..', 'src', 'data');

const DATA_SOURCES = [
  {
    dataType: 'service',
    dataPath: path.join(dataBasePath, 'services'),
  },
  {
    dataType: 'directory_item',
    dataPath: path.join(dataBasePath, 'directory'),
  },
  {
    dataType: 'website',
    dataPath: path.join(dataBasePath, 'websites.json'),
    isFile: true,
  },
];

const COMMON_INDEX_SETTINGS = {
  filterableAttributes: [
    'type',
    'service',
    'name',
    'office_name',
    'office',
    'category',
    'subcategory',
    'website',
    'address',
    'featured',
    'published',
    'tags',
  ],
  sortableAttributes: [
    'service',
    'name',
    'office_name',
    'category',
    'subcategory',
  ],
  searchableAttributes: [
    'service',
    'name',
    'office_name',
    'office',
    'website',
    'category',
    'subcategory',
    'address',
    'description',
    'tags',
    'content',
  ],
  displayedAttributes: ['*'],
};

console.log(
  RESET_INDEX
    ? 'Running with --reset flag: Will recreate the index from scratch.'
    : 'Running in update mode: Will add/update documents in the existing index.'
);

async function main() {
  console.log(
    `Starting Meilisearch indexing script for the a single index: ${SINGLE_INDEX_NAME}`
  );

  try {
    const health = await client.health();
    console.log('Meilisearch server is healthy:', health);
  } catch (e) {
    console.error('Could not connect to Meilisearch.', e);
    return;
  }

  // Check if the index exists, create it if it doesn't, or reset if requested
  try {
    let indexExists = false;

    try {
      await client.getIndex(SINGLE_INDEX_NAME);
      indexExists = true;
    } catch (e) {
      if (e.code === 'index_not_found') {
        indexExists = false;
      } else {
        throw e; // Re-throw if it's a different error
      }
    }

    if (indexExists) {
      if (RESET_INDEX) {
        console.log(
          `Index '${SINGLE_INDEX_NAME}' exists and --reset flag was provided. Deleting index...`
        );
        await client.deleteIndex(SINGLE_INDEX_NAME);
        console.log(`Index '${SINGLE_INDEX_NAME}' deleted successfully.`);

        // Create a new index
        const task = await client.createIndex(SINGLE_INDEX_NAME, {
          primaryKey: 'slug',
        });
        console.log(`Index '${SINGLE_INDEX_NAME}' recreated successfully.`);
        const settingsTask = await client
          .index(SINGLE_INDEX_NAME)
          .updateSettings(COMMON_INDEX_SETTINGS);
        console.log(`Settings updated for new index '${SINGLE_INDEX_NAME}'.`);
      } else {
        console.log(
          `Index '${SINGLE_INDEX_NAME}' already exists. Updating settings.`
        );
        // const task = await client.index(SINGLE_INDEX_NAME).updateSettings(COMMON_INDEX_SETTINGS);
      }
    } else {
      console.log(`Index '${SINGLE_INDEX_NAME}' not found. Creating...`);
      try {
        const task = await client.createIndex(SINGLE_INDEX_NAME, {
          primaryKey: 'slug',
        });
        console.log(`Index '${SINGLE_INDEX_NAME}' created successfully.`);
        const settingsTask = await client
          .index(SINGLE_INDEX_NAME)
          .updateSettings(COMMON_INDEX_SETTINGS);
        console.log(`Settings updated for index '${SINGLE_INDEX_NAME}'.`);
      } catch (createError) {
        console.error(
          `Error creating index '${SINGLE_INDEX_NAME}':`,
          createError
        );
        return;
      }
    }
  } catch (error) {
    console.error(`Error managing index '${SINGLE_INDEX_NAME}':`, error);
    return;
  }

  const allDocumentsToIndex = [];

  for (const dataSource of DATA_SOURCES) {
    console.log(
      `Processing data source type: ${dataSource.dataType} from ${dataSource.dataPath}`
    );
    try {
      // Handle single file case (like websites.json)
      if (dataSource.isFile) {
        try {
          const filePath = dataSource.dataPath;
          const baseNameForFile = path.basename(filePath, '.json');
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const parsedJson = JSON.parse(fileContent);
          const documentsFromFile = Array.isArray(parsedJson)
            ? parsedJson
            : [parsedJson];
          let docIndex = 0;

          console.log(
            `Processing single file ${filePath} with ${documentsFromFile.length} items.`
          );

          for (const doc of documentsFromFile) {
            let itemSlug = doc.slug;
            const itemIdentifierLog =
              documentsFromFile.length > 1
                ? `${baseNameForFile}[${docIndex}]`
                : baseNameForFile;

            if (!itemSlug) {
              const slugSource =
                doc.name || doc.title || doc.service || baseNameForFile;
              if (slugSource) {
                itemSlug = slugSource
                  .toString()
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^\w-]+/g, '')
                  .replace(/--+/g, '-')
                  .replace(/^-+/, '')
                  .replace(/-+$/, '');
                if (
                  documentsFromFile.length > 1 &&
                  !doc.name &&
                  !doc.title &&
                  !doc.service
                ) {
                  itemSlug = `${itemSlug}-${docIndex}`;
                }
              } else {
                itemSlug = `${baseNameForFile}${documentsFromFile.length > 1 ? `-${docIndex}` : ''}`;
              }
              console.log(
                `Document from ${baseNameForFile} (item: ${itemIdentifierLog}) missing 'slug'. Generated slug: ${itemSlug}`
              );
            }

            const documentData = {
              ...doc,
              id: doc.id || itemSlug,
              slug: itemSlug,
              type: dataSource.dataType,
            };
            allDocumentsToIndex.push(documentData);
            docIndex++;
          }
        } catch (fileReadOrParseError) {
          console.error(
            `Error processing file ${dataSource.dataPath}:`,
            fileReadOrParseError
          );
        }
        continue;
      }

      // Handle directory case (original code)
      const filesInDir = await fs.readdir(dataSource.dataPath);
      const jsonFiles = filesInDir.filter(
        f => path.extname(f).toLowerCase() === '.json'
      );

      if (jsonFiles.length === 0) {
        console.log(
          `No JSON files found in ${dataSource.dataPath} for type ${dataSource.dataType}. Skipping.`
        );
        continue;
      }
      console.log(
        `Found ${jsonFiles.length} JSON files in ${dataSource.dataPath}.`
      );

      for (const fileName of jsonFiles) {
        const filePath = path.join(dataSource.dataPath, fileName);
        const baseNameForFile = path.basename(fileName, '.json');
        try {
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const parsedJson = JSON.parse(fileContent);
          const documentsFromFile = Array.isArray(parsedJson)
            ? parsedJson
            : [parsedJson];
          let docIndex = 0;

          for (const doc of documentsFromFile) {
            let itemSlug = doc.slug;
            const itemIdentifierLog =
              documentsFromFile.length > 1
                ? `${baseNameForFile}[${docIndex}]`
                : baseNameForFile;

            if (!itemSlug) {
              const slugSource =
                doc.name || doc.title || doc.service || baseNameForFile;
              if (slugSource) {
                itemSlug = slugSource
                  .toString()
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^\w-]+/g, '')
                  .replace(/--+/g, '-')
                  .replace(/^-+/, '')
                  .replace(/-+$/, '');
                if (
                  documentsFromFile.length > 1 &&
                  !doc.name &&
                  !doc.title &&
                  !doc.service
                ) {
                  itemSlug = `${itemSlug}-${docIndex}`;
                }
              } else {
                itemSlug = `${baseNameForFile}${
                  documentsFromFile.length > 1 ? `-${docIndex}` : ''
                }`;
              }
              console.log(
                `Document from ${fileName} (item: ${itemIdentifierLog}) missing 'slug'. Generated slug: ${itemSlug}`
              );
            }

            const documentData = {
              ...doc,
              id: doc.id || itemSlug,
              slug: itemSlug,
              type: dataSource.dataType,
            };
            allDocumentsToIndex.push(documentData);
            docIndex++;
          }
        } catch (fileReadOrParseError) {
          console.error(
            `Error processing file ${fileName} (path: ${filePath}):`,
            fileReadOrParseError
          );
        }
      }
    } catch (dirReadError) {
      if (dirReadError.code === 'ENOENT') {
        console.warn(
          `Data directory ${dataSource.dataPath} not found for type ${dataSource.dataType}. Skipping.`
        );
      } else {
        console.error(
          `Error reading from directory ${dataSource.dataPath}:`,
          dirReadError
        );
      }
    }
  }

  if (allDocumentsToIndex.length > 0) {
    console.log(
      `Attempting to index ${allDocumentsToIndex.length} documents into '${SINGLE_INDEX_NAME}'...`
    );
    try {
      // Get a reference to the index
      const index = client.index(SINGLE_INDEX_NAME);

      const _task = await index.addDocuments(allDocumentsToIndex, {
        primaryKey: 'slug',
      });
      console.log(
        `${allDocumentsToIndex.length} documents successfully processed for index '${SINGLE_INDEX_NAME}'. Task ID: ${_task.taskUid}`,
        _task
      );
    } catch (indexError) {
      console.error(`An error occurred while indexing documents:`, indexError);
    }
  } else {
    console.log(`No documents to index for '${SINGLE_INDEX_NAME}'.`);
  }

  console.log(
    `Meilisearch indexing script for '${SINGLE_INDEX_NAME}' finished.`
  );
}

main().catch(error => {
  console.error(
    'An unexpected error occurred during Meilisearch indexing:',
    error
  );
});

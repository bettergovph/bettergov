import path from 'path';

const buildEslintCommand = filenames =>
  `eslint --fix ${filenames
    .map(f => `"${path.relative(process.cwd(), f)}"`)
    .join(' ')}`;

const config = {
  // ESLint for JavaScript/TypeScript files (including .cjs and .mjs)
  '*.{js,jsx,ts,tsx,cjs,mjs}': [buildEslintCommand],

  // Prettier for various file types
  '*.{js,jsx,ts,tsx,cjs,mjs,json,jsonc,md,yml,yaml,css,scss,html}': [
    'prettier --write',
  ],

  // JSON Schema validation for data files
  'src/data/directory/lgu/*.json': filenames =>
    `node scripts/validate-json-schema.js src/data/directory/lgu/schema/lgu-region.schema.json ${filenames.join(' ')}`,
  'src/data/directory/constitutional.json': filenames =>
    `node scripts/validate-json-schema.js src/data/directory/schema/constitutional.schema.json ${filenames.join(' ')}`,
  'src/data/directory/departments.json': filenames =>
    `node scripts/validate-json-schema.js src/data/directory/schema/departments.schema.json ${filenames.join(' ')}`,
  'src/data/directory/diplomatic.json': filenames =>
    `node scripts/validate-json-schema.js src/data/directory/schema/diplomatic.schema.json ${filenames.join(' ')}`,
  'src/data/directory/executive.json': filenames =>
    `node scripts/validate-json-schema.js src/data/directory/schema/executive.schema.json ${filenames.join(' ')}`,
  'src/data/directory/house_members.json': filenames =>
    `node scripts/validate-json-schema.js src/data/directory/schema/house_members.schema.json ${filenames.join(' ')}`,
  'src/data/directory/legislative.json': filenames =>
    `node scripts/validate-json-schema.js src/data/directory/schema/legislative.schema.json ${filenames.join(' ')}`,
  'src/data/directory/party_list_representatives.json': filenames =>
    `node scripts/validate-json-schema.js src/data/directory/schema/party_list_representatives.schema.json ${filenames.join(' ')}`,
  'src/data/services/*.json': filenames =>
    `node scripts/validate-json-schema.js src/data/services/schema/services.schema.json ${filenames.join(' ')}`,
  'src/data/philippines-regions.json': filenames =>
    `node scripts/validate-json-schema.js src/data/schema/GeoJSON.json ${filenames.join(' ')}`,
  'src/data/philippines_hotlines.json': filenames =>
    `node scripts/validate-json-schema.js src/data/schema/philippines_hotlines.schema.json ${filenames.join(' ')}`,
  'src/data/population-2020.json': filenames =>
    `node scripts/validate-json-schema.js src/data/schema/population-2020.schema.json ${filenames.join(' ')}`,
  'src/data/regions.json': filenames =>
    `node scripts/validate-json-schema.js src/data/schema/regions.schema.json ${filenames.join(' ')}`,
  'src/data/seo-metadata.json': filenames =>
    `node scripts/validate-json-schema.js src/data/schema/seo-metadata.schema.json ${filenames.join(' ')}`,
  'src/data/service_categories.json': filenames =>
    `node scripts/validate-json-schema.js src/data/schema/service_categories.schema.json ${filenames.join(' ')}`,
  'src/data/websites.json': filenames =>
    `node scripts/validate-json-schema.js src/data/schema/websites.schema.json ${filenames.join(' ')}`,
  'src/data/flood_control/flood_control.json': filenames =>
    `node scripts/validate-json-schema.js src/data/flood_control/schema/flood_control.schema.json ${filenames.join(' ')}`,
  'src/data/visa/philippines_visa_policy.json': filenames =>
    `node scripts/validate-json-schema.js src/data/visa/schema/philippines_visa_policy.schema.json ${filenames.join(' ')}`,
  'src/data/visa/philippines_visa_types.json': filenames =>
    `node scripts/validate-json-schema.js src/data/visa/schema/philippines_visa_types.schema.json ${filenames.join(' ')}`,

  // JSON schema validation for the project registry
  'public/api/projects.json': [
    'node scripts/validate-json-schema.js src/data/schema/projects.schema.json',
  ],
};

export default config;

import path from 'path';

const buildEslintCommand = filenames =>
  `eslint --fix ${filenames
    .map(f => `"${path.relative(process.cwd(), f)}"`)
    .join(' ')}`;

const buildValidateCommand = schemaPath => filenames =>
  `node scripts/validate-json-schema.js ${schemaPath} ${filenames
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
  'src/data/directory/lgu/*.json': buildValidateCommand(
    'src/data/directory/lgu/schema/lgu-region.schema.json'
  ),
  'src/data/directory/constitutional.json': buildValidateCommand(
    'src/data/directory/schema/constitutional.schema.json'
  ),
  'src/data/directory/departments.json': buildValidateCommand(
    'src/data/directory/schema/departments.schema.json'
  ),
  'src/data/directory/diplomatic.json': buildValidateCommand(
    'src/data/directory/schema/diplomatic.schema.json'
  ),
  'src/data/directory/executive.json': buildValidateCommand(
    'src/data/directory/schema/executive.schema.json'
  ),
  'src/data/directory/house_members.json': buildValidateCommand(
    'src/data/directory/schema/house_members.schema.json'
  ),
  'src/data/directory/legislative.json': buildValidateCommand(
    'src/data/directory/schema/legislative.schema.json'
  ),
  'src/data/directory/party_list_representatives.json': buildValidateCommand(
    'src/data/directory/schema/party_list_representatives.schema.json'
  ),
  'src/data/services/*.json': buildValidateCommand(
    'src/data/services/schema/services.schema.json'
  ),
  'src/data/philippines-regions.json': buildValidateCommand(
    'src/data/schema/GeoJSON.json'
  ),
  'src/data/philippines_hotlines.json': buildValidateCommand(
    'src/data/schema/philippines_hotlines.schema.json'
  ),
  'src/data/population-2020.json': buildValidateCommand(
    'src/data/schema/population-2020.schema.json'
  ),
  'src/data/regions.json': buildValidateCommand(
    'src/data/schema/regions.schema.json'
  ),
  'src/data/seo-metadata.json': buildValidateCommand(
    'src/data/schema/seo-metadata.schema.json'
  ),
  'src/data/service_categories.json': buildValidateCommand(
    'src/data/schema/service_categories.schema.json'
  ),
  'src/data/websites.json': buildValidateCommand(
    'src/data/schema/websites.schema.json'
  ),
  'src/data/flood_control/flood_control.json': buildValidateCommand(
    'src/data/flood_control/schema/flood_control.schema.json'
  ),
  'src/data/visa/philippines_visa_policy.json': buildValidateCommand(
    'src/data/visa/schema/philippines_visa_policy.schema.json'
  ),
  'src/data/visa/philippines_visa_types.json': buildValidateCommand(
    'src/data/visa/schema/philippines_visa_types.schema.json'
  ),

  // JSON schema validation for the project registry
  'public/api/projects.json': [
    'node scripts/validate-json-schema.js src/data/schema/projects.schema.json',
  ],
};

export default config;

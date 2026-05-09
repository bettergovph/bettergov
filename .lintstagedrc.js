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

  // JSON schema validation for the project registry
  'public/api/projects.json': [
    'node scripts/validate-json-schema.js src/data/schema/projects.schema.json',
  ],
};

export default config;

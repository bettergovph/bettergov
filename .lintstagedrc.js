import path from 'path';

const buildEslintCommand = filenames =>
  `eslint --fix ${filenames
    .map(f => `"${path.relative(process.cwd(), f)}"`)
    .join(' ')}`;

const config = {
  // ESLint for JavaScript/TypeScript files (including .cjs and .mjs)
  '*.{js,jsx,ts,tsx,cjs,mjs}': [buildEslintCommand],

  // Prettier for various file types
  '*.{js,jsx,ts,tsx,cjs,mjs,json,md,yml,yaml,css,scss,html}': [
    'prettier --write',
  ],
};

export default config;

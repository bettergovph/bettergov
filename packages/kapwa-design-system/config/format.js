import { isColor } from './filter.js';

/**
 * Exports tailwind plugin for declaring root CSS vars
 * @see https://tailwindcss.com/docs/plugins#overview
 */
export function cssVarsPlugin({ dictionary }) {
  const vars = dictionary.allTokens
    .map(token => {
      const value = token?.$value || token?.value;
      return `'--${token.name}': '${value}'`;
    })
    .join(',\n\t\t\t');

  return `import plugin from 'tailwindcss/plugin.js';

export default plugin(function ({ addBase }) {
\taddBase({
\t\t':root': {
\t\t\t${vars},
\t\t},
\t});
});\n`;
}

/**
 * Exports theme color definitions
 * @see https://tailwindcss.com/docs/customizing-colors#using-css-variables
 */
export function themeColors({ dictionary, options }) {
  const tokens = dictionary.allTokens.filter(token => isColor(token, options));

  const colorMap = new Map();
  for (const token of tokens) {
    const path = token?.['path'];
    const key = path.slice(-2)[0];
    if (colorMap.has(key)) {
      const map = colorMap.get(key);
      map.set(path.slice(-1)[0], `rgb(var(--${token.name}))`);
      colorMap.set(key, map);
    } else {
      const map = new Map();
      map.set(path.slice(-1)[0], `rgb(var(--${token.name}))`);
      colorMap.set(key, map);
    }
  }

  for (const [key, map] of colorMap) {
    colorMap.set(key, Object.fromEntries(map));
  }

  const theme = Object.fromEntries(colorMap);

  return `const colors = ${JSON.stringify(theme, null, 2)};\nexport default colors;`;
}

/**
 * Exports tailwind preset
 * @see https://tailwindcss.com/docs/presets
 */
export function preset() {
  return `import themeColors from './themeColors.js';
import cssVarsPlugin from './cssVarsPlugin.js';

export default {
\ttheme: {
\t\textend: {
\t\t\tcolors: {
\t\t\t\t...themeColors, // <-- theme colors defined here
\t\t\t},
\t\t},
\t},
\tplugins: [cssVarsPlugin], // <-- plugin imported here
};\n`;
}

import { StyleDictionary } from 'style-dictionary-utils';

import { isColor } from './config/filter.js';
import { cssVarsPlugin, preset, themeColors } from './config/format.js';
import { rgbChannels } from './config/transform.js';

const myStyleDictionary = new StyleDictionary('./config.json');
myStyleDictionary.registerTransform({
  name: 'color/rgb-channels',
  type: 'value',
  filter: isColor,
  transform: rgbChannels,
});

myStyleDictionary.registerTransformGroup({
  name: 'tailwind',
  transforms: ['name/kebab', 'color/rgb', 'color/rgb-channels'],
});

myStyleDictionary.registerFormat({
  name: 'tailwind/css-vars-plugin',
  format: cssVarsPlugin,
});

myStyleDictionary.registerFormat({
  name: 'tailwind/theme-colors',
  format: themeColors,
});

myStyleDictionary.registerFormat({
  name: 'tailwind/preset',
  format: preset,
});

myStyleDictionary.registerFormat({
  name: 'tailwind/preset',
  format: preset,
});

// Build all platforms

await myStyleDictionary.buildAllPlatforms();

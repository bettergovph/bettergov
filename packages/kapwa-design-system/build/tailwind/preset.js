import themeColors from './themeColors.js';
import cssVarsPlugin from './cssVarsPlugin.js';

export default {
	theme: {
		extend: {
			colors: {
				...themeColors, // <-- theme colors defined here
			},
		},
	},
	plugins: [cssVarsPlugin], // <-- plugin imported here
};

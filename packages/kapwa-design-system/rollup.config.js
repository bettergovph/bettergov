import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';

// Read the generated tokens
const tokensPath = './build/tokens.ts';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'named',
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
    },
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
    }),
    copy({
      targets: [
        { src: tokensPath, dest: 'dist' },
        { src: 'assets', dest: 'dist/assets' },
        { src: 'build', dest: 'dist/build' },
      ],
      copyOnce: true,
      verbose: true,
    }),
  ],
  external: [],
};

import babel from 'rollup-plugin-babel';
import pkg from './package.json';

export default {
  input: pkg.module,
  output: {
    file: pkg.main,
    format: 'cjs'
  },
  external: [
    'kronos-endpoint',
    'kronos-service',
    'loglevel-mixin',
    'model-attributes'
  ],
  plugins: [
    babel({
      babelrc: false,
      presets: ['stage-3'],
      exclude: 'node_modules/**'
    })
  ]
};

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
  ]
};

export default {
  input: 'tests/step-test.js',
  output: {
    file: 'build/step-test.js',
    format: 'cjs',
    sourcemap: true
  },
  external: [
    'ava',
    'kronos-endpoint',
    'kronos-service',
    'loglevel-mixin',
    'model-attributes'
  ],
  plugins: []
};

import multiEntry from 'rollup-plugin-multi-entry';

export default {
  input: 'tests/**/*-test.js',
  output: {
    file: 'build/step-test.js',
    format: 'cjs',
    sourcemap: true
  },
  external: ['ava', 'kronos-endpoint', 'kronos-service', 'loglevel-mixin'],
  plugins: [multiEntry()]
};

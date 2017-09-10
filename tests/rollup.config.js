import babel from 'rollup-plugin-babel';

export default {
  input: 'tests/step-test.js',
  output: {
    file: 'build/test-bundle.js',
    format: 'cjs',
    sourcemap: true
  },
  external: ['ava', 'kronos-endpoint', 'kronos-service'],
  plugins: [
    babel({
      babelrc: false,
      presets: ['stage-3'],
      exclude: 'node_modules/**'
    })
  ]
};

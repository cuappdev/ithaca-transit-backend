const nodeExternals = require('webpack-node-externals');
const NodemonPlugin = require('nodemon-webpack-plugin');
const path = require('path');
const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin');

console.log(path.resolve(''));
const baseDir = path.resolve('');

module.exports = env => ({
  context: baseDir,
  entry: ['babel-polyfill', './src/server.js'],
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader', 'eslint-loader'],
      },
    ],
  },
  plugins: [
    new NodemonPlugin({
      watch: ['./build', './src/test', './src/server.js'],
      verbose: false,
    }),
    new ExtraWatchWebpackPlugin({
      dirs: ['./'],
    }),
  ],
  stats: 'minimal',
  target: 'node',
  output: {
    path: `${baseDir}/build`,
    filename: 'bundle.js',
  },
});

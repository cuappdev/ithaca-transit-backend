const webpack = require('webpack'); //to access built-in plugins
const nodeExternals = require('webpack-node-externals');
const path = require('path');

const config = {
  target: 'node',
  context: __dirname,
  externals: [nodeExternals()],
  entry: ['babel-polyfill', path.resolve(__dirname, 'src/server.js')],
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin(),
  ]
};

module.exports = config;

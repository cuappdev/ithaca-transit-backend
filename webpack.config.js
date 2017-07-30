const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

const nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function (x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function (mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = {
  entry: [path.join(__dirname, 'src/server.js')],
  context: __dirname,
  node: {
    __filename: true,
    __dirname: true
  },
  target: 'node',
  output: {
    path: path.join(__dirname, './build/'),
    filename: 'bundle.js'
  },
  externals: nodeModules,
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /(node_modules)/,
        query: { presets: [ 'es2015', 'stage-2' ] }
      }
    ]
  },
  plugins: [
    new webpack.IgnorePlugin(/\.(css|less)$/)
  ]
};

const nodeExternals = require('webpack-node-externals');
const NodemonPlugin = require('nodemon-webpack-plugin');
const path = require('path');
const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin');

module.exports = env => ({
    target: 'node',
    context: __dirname,
    externals: [nodeExternals()],
    entry: ['babel-polyfill', './src/server.js'],
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader', 'eslint-loader'],
            },
        ],
    },
    stats: 'minimal',
    plugins: [
        new NodemonPlugin({
            // What to watch.
            watch: ['./build', './src/test', './src/server.js'],

            // Detailed log.
            verbose: false,

            // run tests after dev build complete
            exec: 'npm run test-dev',
        }),
        new ExtraWatchWebpackPlugin({
            dirs: ['./'],
        }),
    ],
});

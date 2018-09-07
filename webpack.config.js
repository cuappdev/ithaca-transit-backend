const nodeExternals = require('webpack-node-externals');
const NodemonPlugin = require('nodemon-webpack-plugin');
const path = require('path');
const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin');

module.exports = env => ({
    target: 'node',
    context: __dirname,
    externals: [nodeExternals()],
    entry: ['babel-polyfill', path.resolve(__dirname, 'src/server.js')],
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['eslint-loader'],
            },
        ],
    },
    devServer: {
        contentBase: path.join(__dirname, 'build'), // serve your static files from here
        watchContentBase: true, // initiate a page refresh if static content changes
        hot: true,
        open: true,
    },
    stats: 'minimal',
    plugins: [
        new NodemonPlugin({
            // What to watch.
            watch: [path.join(__dirname, 'build'), 'src/test', 'src/server.js'],

            // Detailed log.
            verbose: false,

            // exec: 'npm test',
        }),
        new ExtraWatchWebpackPlugin({
            dirs: ['./'],
        }),
    ],
});

const path = require('path');
const webpack = require('webpack');

const DEFAULT_VIRTUAL_MACHINES = 20;

module.exports = {
    resolve: {
        extensions: ['.js']
    },
    entry: {
        main: './index.js'
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                }
            }
        ]
    },
    plugins: [],
    devtool: 'eval',
    target: 'node'
}

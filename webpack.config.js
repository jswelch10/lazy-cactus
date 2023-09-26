const path = require('path')
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: {
        app: './joinery-helper/src/app.js',
        background: './joinery-helper/src/background.js',
        joineryHelper: './joinery-helper/src/classes/JoineryHelper.js',
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, 'joinery-helper', 'dist')
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {from: 'joinery-helper/public', to: path.resolve(__dirname, 'joinery-helper', 'dist')},
            ]
        })
    ]
}
// https://code.visualstudio.com/api/working-with-extensions/bundling-extension
// Also big thanks to Extensions Sync code!

'use strict';

const path = require('path');
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

/**@type {import('webpack').Configuration}*/
const config = {
  target: 'node',

  entry: path.resolve(__dirname, '..', 'src', 'extension.ts'),
  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  stats: {
    warningsFilter: /Critical dependency: the request of a dependency is an expression/
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  plugins: [new CleanWebpackPlugin()]
};
module.exports = config;
var path = require('path');
const webpack = require('webpack');
var APP_DIR = path.resolve(__dirname, 'src', 'js');
var DIST_DIR = path.resolve(__dirname, 'dist');

module.exports = {
  entry: {
    index: APP_DIR + "/index.js",
    graph: APP_DIR + "/graph.js",
    chat: APP_DIR + "/ChatApp.js",
    donations: APP_DIR + "/DonationsApp.js",
    animals: APP_DIR + "/AnimalsApp.js",
    games: APP_DIR + "/GamesApp.js"
  },
  output: {
    filename: "[name].bundle.js",
    path: DIST_DIR
  },
  module: {
    rules: [
      {
        test : /\.js?/,
        include : APP_DIR,
        use: {
          loader : 'babel-loader',
          options: {
            plugins: [
              'recharts',
              // Stage 2 (see here https://babeljs.io/blog/2018/07/27/removing-babels-stage-presets)
              ["@babel/plugin-proposal-decorators", { "legacy": true }],
              "@babel/plugin-proposal-function-sent",
              "@babel/plugin-proposal-export-namespace-from",
              "@babel/plugin-proposal-numeric-separator",
              "@babel/plugin-proposal-throw-expressions",
            ],
            presets: [
              ['@babel/preset-env', { targets: "defaults" }], '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      }
    ]
  },
  //devtool: '#cheap-source-map'
}
import 'webpack';

import HtmlWebPackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const htmlWebpackPlugin = new HtmlWebPackPlugin({
  template: `${__dirname}/src/client/static/index.html`,
  filename: `${__dirname}/dist/index.html`,
  hash: true,
});

const config = {
  entry: ['babel-polyfill', `${__dirname}/src/client/index`],
  context: `${__dirname}/src/client`,
  output: {
    path: `${__dirname}/dist`,
    publicPath: '/',
    filename: 'bundle.js',
  },
  devServer: {
    contentBase: `${__dirname}/src/client`,
  },
  node: {
    fs: 'empty',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loaders: 'babel-loader',
        query: {
          presets: ['es2017', 'react'],
        },
      },
    ],
  },
  plugins: [
    htmlWebpackPlugin,
    new CopyWebpackPlugin([
      {
        from: `${__dirname}/src/client/static/`,
        to: `${__dirname}/dist/`,
      },
    ]),
  ],
};

module.exports = config;

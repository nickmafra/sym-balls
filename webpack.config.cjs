const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const devMode = process.env.NODE_ENV !== "production";

module.exports = {
  entry: './src/js/index.mjs',
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          devMode ? "style-loader" : MiniCssExtractPlugin.loader,
          "css-loader"
        ],
      },
      {
        test: /\.(json|webmanifest|png|properties)/,
        type: "asset/resource",
        generator: {
          filename: 'assets/[name][ext]'
        }
      },
      {
        test: /sw\.js/,
        type: "asset/resource",
        generator: {
          filename: '[name][ext]'
        }
      },
    ],
  },
  plugins: [

    new HtmlWebpackPlugin({
      template: "src/index.html",
      inject: true,
    }),

  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
};
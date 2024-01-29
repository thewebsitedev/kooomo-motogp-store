const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development', // Use 'production' for minification and optimizations
  entry: ['./src/js/index.js', './src/scss/index.scss'], // Entry point of your application
  output: {
    path: path.resolve(__dirname, 'dist'), // Output directory
    filename: 'js/[name].[contenthash].js', // Naming pattern for output files
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          'style-loader', // injects styles into DOM
          // process.env.NODE_ENV !== 'production' ? 'style-loader' : MiniCssExtractPlugin.loader, // Use 'style-loader' in development and MiniCssExtractPlugin in production
          'css-loader', // Translates CSS into CommonJS
          'postcss-loader', // after css loader
          'sass-loader', // Compiles Sass to CSS
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[hash][ext][query]' // This will output images to 'dist/images/'
        }
      },
      {
        test: /\.(mp3)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'sounds/[hash][ext][query]' // This will output images to 'dist/images/'
        }
      },
      {
        test: /\.js$/, // Rule for JavaScript files
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader', // Babel loader to transpile modern JavaScript
          options: {
            presets: ['@babel/preset-env'], // Babel preset for ES6 and above
          },
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[hash][ext]', // Output fonts in a 'fonts' folder in the dist directory
        },
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html', // Path to your HTML template
      filename: 'index.html', // Output HTML
      inject: 'body',
    }),
    new CopyPlugin({
      patterns: [
        { from: 'src/images', to: 'images' }, // Copy images to 'dist/images'
        { from: 'src/sounds', to: 'sounds' }, // Copy sounds to 'dist/sounds'
      ],
    }),
    require('autoprefixer')
  ],
  optimization: {
    minimizer: [
      new CssMinimizerPlugin(), // Minify CSS
      new TerserPlugin(), // Minify JavaScript
    ],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'src'), // Updated from contentBase to static.directory
    },
    open: true,
  },
};

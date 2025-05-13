const { inDev } = require('./helpers');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { join } = require('path');

// Define the path to the public directory relative to this rules.js file
const Public = join(__dirname, '..', 'public');

module.exports = [
  {
    test: /\.tsx?$/,
    use: {
      loader: 'ts-loader',
      options: { transpileOnly: true }
    }
  },
  {
    test: /\.css$/,
    use: [
      { loader: inDev() ? 'style-loader' : MiniCssExtractPlugin.loader },
      { loader: 'css-loader' },
      { loader: 'postcss-loader'},
    ]
  },
  {
    test: /\.s[ac]ss$/i,
    use: [
      { loader: inDev() ? 'style-loader' : MiniCssExtractPlugin.loader },
      { loader: 'css-loader' },
      { loader: 'postcss-loader' }, // Add postcss-loader here
    ]
  },
  {
    test: /\.less$/,
    use: [
      { loader: inDev() ? 'style-loader' : MiniCssExtractPlugin.loader },
      { loader: 'css-loader' },
      { loader: 'less-loader' }
    ]
  },
  {
    test: /\.(gif|jpe?g|tiff|png|webp|bmp|svg|eot|ttf|woff|woff2)$/i,
    type: 'javascript/auto',
    use: [
      {
        loader: 'file-loader',
        options: {
          name: 'assets/[path][name].[ext]', // Preserves subdirectories like 'images/'
          context: Public,           // Strips 'public/' from the start of '[path]'
          publicPath: '/',   
          esModule: false,                 // <--- ADD THIS LINE
        }
      }
    ]
  }
];

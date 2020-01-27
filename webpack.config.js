const path = require('path');

const {CleanWebpackPlugin} = require('clean-webpack-plugin');

// const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  // モードの設定
  // v4系以降はmodeを指定しないとwebpack実行時に警告が出る
  mode: 'development', // 'development' or 'production' or 'none'
  context: path.resolve('__dirname', '../'),

  // エントリーポイントの設定
  entry: {
    client: './src/js/client.js',
  },
  // 出力の設定
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, './public'),
  },
  plugins: [
    new CleanWebpackPlugin(),
    // new CopyWebpackPlugin([
    //   './views/index.ejs'
    // ])
  ],
  module: {
    rules: [
      {
        test: /\.css/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {url: false},
          },
        ],
      },
    ],
  },
};

module.exports = {
  // メインとなるJavaScriptファイル（エントリーポイント）
  entry: {
    'script': './src/js/script.js'
  },

  // ファイルの出力設定
  output: {
    //  出力ファイルのディレクトリ名
    path: `${__dirname}/public/assets/js`,
    // 出力ファイル名
    filename: `[name].js`
  }
}

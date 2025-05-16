const webpackCommonConfig = require('./webpack.config.common.js')
const webpackMerge = require('webpack-merge')

module.exports = webpackMerge.merge(
  webpackCommonConfig,
  {
    mode: 'development'
  }
)
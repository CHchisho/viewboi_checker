const JavaScriptObfuscator = require('webpack-obfuscator');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = function override(config, env) {
  if (env === "production") {
    config.plugins.push(
      new JavaScriptObfuscator(
        {
          compact: true,
          // controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.75,
          deadCodeInjection: false,
          // stringArray: true,
          // stringArrayThreshold: 0.5,
          stringArray: false,
        },
        ['node_modules/**']
      )
    );

    // config.plugins.push(new BundleAnalyzerPlugin({
    //     analyzerMode: 'static',
    //     openAnalyzer: true,
    //     reportFilename: 'bundle-report.html',
    // }));
  }
  return config;
};

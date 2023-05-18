/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: function (config, options) {
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };
    return config;
  },
};
module.exports = nextConfig;

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Force Metro to resolve tslib from the root node_modules
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'tslib': path.resolve(__dirname, 'node_modules/tslib'),
};

module.exports = config;

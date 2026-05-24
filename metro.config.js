const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Force Metro to resolve tslib from the root node_modules
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'tslib': path.resolve(__dirname, 'node_modules/tslib'),
  // Stub out OpenTelemetry packages pulled in by @supabase/supabase-js.
  // Hermes (React Native's JS engine) cannot compile the dynamic import()
  // expressions with webpack magic comments that OTEL uses.
  '@opentelemetry/api': path.resolve(__dirname, 'stubs/otel-stub.js'),
};

module.exports = config;

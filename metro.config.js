// https://docs.expo.dev/versions/latest/sdk/sqlite/#web-setup
// The web build (used for previews and store art) runs SQLite as WebAssembly.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('wasm');

module.exports = config;

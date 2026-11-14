const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Keep reference material and specs out of the bundler's file watcher.
config.resolver.blockList = [/[\\/]REFERENCE[\\/].*/, /[\\/]\.kiro[\\/].*/];

// Web: expo-sqlite (wa-sqlite) and Skia (CanvasKit) load WebAssembly files as assets.
// Only expo-sqlite's async API works on web without cross-origin isolation, so keep to it.
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

module.exports = withNativeWind(config, { input: './src/global.css' });

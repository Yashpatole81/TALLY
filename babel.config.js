// NativeWind needs its JSX import source plus its Babel preset.
// babel-preset-expo already wires up the Reanimated/Worklets plugin.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};

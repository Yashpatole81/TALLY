const { withAppBuildGradle } = require('@expo/config-plugins');

function withCustomBuildSettings(config) {
  return withAppBuildGradle(config, (modConfig) => {
    // 1. Disable lint checks
    if (!modConfig.modResults.contents.includes('checkReleaseBuilds false')) {
      const lintConfigBlock = `
    lint {
        checkReleaseBuilds false
        abortOnError false
    }
`;
      modConfig.modResults.contents = modConfig.modResults.contents.replace(
        /android\s*\{/,
        `android {${lintConfigBlock}`
      );
    }

    // 2. Filter ABIs to phone architectures only (arm64-v8a, armeabi-v7a)
    // This skips building heavy C++ binaries (like react-native-skia) for x86/x86_64,
    // cutting compile memory in half and preventing Gradle OOM crash on EAS free tier.
    if (!modConfig.modResults.contents.includes('abiFilters')) {
      modConfig.modResults.contents = modConfig.modResults.contents.replace(
        /(defaultConfig\s*\{)/,
        `$1\n        ndk {\n            abiFilters "arm64-v8a", "armeabi-v7a"\n        }`
      );
    }

    return modConfig;
  });
}

module.exports = withCustomBuildSettings;

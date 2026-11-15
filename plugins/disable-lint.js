const { withAppBuildGradle } = require('@expo/config-plugins');

function withDisableLint(config) {
  return withAppBuildGradle(config, (modConfig) => {
    const buildGradle = modConfig.modResults.contents;
    if (!buildGradle.includes('checkReleaseBuilds false')) {
      const lintConfigBlock = `
    lint {
        checkReleaseBuilds false
        abortOnError false
    }
`;
      modConfig.modResults.contents = buildGradle.replace(
        /android\s*\{/,
        `android {${lintConfigBlock}`
      );
    }
    return modConfig;
  });
}

module.exports = withDisableLint;


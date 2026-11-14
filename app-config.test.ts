import appJson from './app.json';
import packageJson from './package.json';

describe('app.json', () => {
  it('targets Android, iOS and web', () => {
    expect(appJson.expo.platforms).toEqual(['ios', 'android', 'web']);
  });

  // Web bundles alias react-native to react-native-web. Without it every web bundle fails with
  // `Unable to resolve "react-native-web/dist/index"` (issues/2026-11-12-web-bundle-react-native-web).
  it('installs react-native-web for the web build', () => {
    expect(packageJson.dependencies).toHaveProperty('react-native-web');
  });
});

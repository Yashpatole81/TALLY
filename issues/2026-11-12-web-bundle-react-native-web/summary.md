# Resolution: Dev server builds a web bundle that can't resolve react-native-web

## Root Cause

`app.json` didn't declare `expo.platforms`, so Expo derived the list itself and added `web`
because `react-dom` is installed (kept for expo-router's Radix deps). The dev server then served the
web shell to browsers and `w`, and the web bundle needs `react-native-web`, which Tally didn't ship.

## Fix Applied

- First fix (same day): `app.json` `"platforms": ["ios", "android"]`, so Expo stopped offering web.
- Superseded the same day: the user tests in a browser, so web is now a target (spec
  `2026-11-07-tally-mvp`, Group 9). `react-native-web@0.21.4` is installed and `platforms` is
  `["ios", "android", "web"]`.

## Prevention

- `app-config.test.ts` checks the platform list and that `react-native-web` is a dependency, so web
  can't be listed without the package that web bundles need.
- `docs/tech.md` ("Web build") records the `react-dom` → implicit `web` rule.

## Status

RESOLVED

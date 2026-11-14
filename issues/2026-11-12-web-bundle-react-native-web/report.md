# Issue: Dev server builds a web bundle that can't resolve react-native-web

## Summary

Opening the Expo dev server in a browser (or pressing `w`) fails with
`Unable to resolve "react-native-web/dist/index" from "node_modules\expo-router\build\renderRootComponent.js"`.

## Impact

- Severity: low (dev tooling only; Android/iOS builds are unaffected).
- Tally has no web target (spec `2026-11-07-tally-mvp`, `decisions.md` → Tooling), yet the dev
  server offers web and the bundle fails. Same for `expo export` / `eas update` with default platforms.

## Reproduction

1. `$env:CI='1'; $env:EXPO_OFFLINE='1'; npx expo start --port 8090`
2. `curl.exe -A "Mozilla/5.0" http://localhost:8090/` → `200 text/html`, the web shell with
   `<script src="/node_modules/expo-router/entry.bundle?platform=web&...">`.
3. Request that bundle → `UnableToResolveError`, `targetModuleName: "react-native-web/dist/index"`,
   `originModulePath: ...\expo-router\build\renderRootComponent.js`.

## Investigation

- On web, Expo's Metro config aliases `react-native` to `react-native-web/dist/index`. The package
  isn't installed (dropped on purpose: no web target).
- `react-dom@19.3.0` stays installed because expo-router's Radix deps peer on it
  (`decisions.md` → "react-dom stays installed").
- `app.json` has no `expo.platforms`. `@expo/config@58.0.11` `getSupportedPlatforms()` then adds
  `web` whenever `react-dom/package.json` resolves. Resolved platforms today: `["ios","android","web"]`.
- With `web` in the list, `@expo/cli@58.1.19` serves the web HTML for header-less (browser) requests
  (`ManifestMiddleware.checkBrowserRequestAsync`) and `w` only warns that react-native-web is missing
  (`WebSupportProjectPrerequisite`) before opening the browser.
- Ruled out installing `react-native-web`: web is out of scope, and the bundle would only get further
  before failing at runtime (e.g. expo-secure-store's web build is an empty stub, and the encrypted
  session key lives there).

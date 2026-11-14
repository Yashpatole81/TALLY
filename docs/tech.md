# Tally: Verified Tech Reference

Verified 2026-11-07 against the **installed** packages in `node_modules` (source/type inspection)
and official docs. Every version below is pinned exactly in `package.json` and was published at
least 7 days before 2026-11-07 (supply-chain quarantine rule).

## Runtime

| Item                  | Version                          | Source                                                                                        |
| --------------------- | -------------------------------- | --------------------------------------------------------------------------------------------- |
| Expo SDK              | 58 (`expo@58.0.21`)              | `npm view expo dist-tags` (latest SDK, GA 2026-09-29)                                         |
| React / React Native  | 19.3.0 / 0.88.1                  | SDK 58 template `expo-template-default@58.0.30`                                               |
| Node.js (project pin) | 26.13.0 LTS "Lithium" (`.nvmrc`) | nodejs.org/dist/index.json; Expo 58 `engines`: `^22.13.0 \|\| ^24.3.0 \|\| ^26.0.0 \|\| >=27` |
| TypeScript            | 6.0.3                            | SDK 58 template                                                                               |

> Node 25 is **not** in Expo 58's supported engine range (npm prints `EBADENGINE`). Use Node 26 LTS.

## Version decisions that differ from "newest"

| Package               | Pinned                         | Why                                                                                                                                                                                                                                                    |
| --------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `victory-native`      | 42.0.1                         | 43.x peers on the _unscoped_ `react-native-skia >=2.15.1` (wcandillon's fork). SDK 58 bundles `@shopify/react-native-skia@2.14.0`; 42.0.1 peers `@shopify/react-native-skia >=2.6.0 <3`. Mixing both Skia packages would ship two native Skia modules. |
| `@hookform/resolvers` | 6.0.2                          | all 7.x releases are < 7 days old                                                                                                                                                                                                                      |
| `nativewind`          | 4.2.7 (+ `tailwindcss` 3.4.19) | v5 is still `rc`; v4 requires Tailwind 3 (`react-native-css-interop` peer `tailwindcss ~3`)                                                                                                                                                            |
| `eslint`              | 9.39.5                         | `eslint-plugin-react@7.37.5` / `eslint-plugin-import@2.32.0` (from `eslint-config-expo`) do not declare ESLint 10 support yet. npm marks 9.x deprecated, so revisit when Expo's config supports 10.                                                    |
| SDK patch versions    | e.g. `expo-router@58.0.28`     | `expo install --check` wants newer patches (58.0.30 etc.) published < 7 days ago. They're compatible within the `~58.0.x` range; bump after quarantine.                                                                                                |

## Web build (verified 2026-11-12 against installed packages)

- `react-native-web@0.21.4` (SDK 58's `bundledNativeModules.json`: `~0.21.4`; published 2026-10-08).
  Web bundles alias `react-native` to `react-native-web/dist/index`, so without it every web bundle
  fails. `app.json` lists `platforms: ["ios","android","web"]` explicitly: when unset,
  `@expo/config@58.0.11` `getSupportedPlatforms()` adds `web` whenever `react-dom` resolves.
- `web.output: "single"` (SPA). `static`/`server` would render routes in Node, where native modules
  don't load.
- **expo-sqlite web** (wa-sqlite worker, OPFS `AccessHandlePoolVFS`): Metro needs `wasm` in
  `resolver.assetExts`. Only the sync API (`invokeWorkerSync`) needs `SharedArrayBuffer`, i.e.
  COOP/COEP headers, and Expo's dev server can't send those for its SPA page: `server.enhanceMiddleware`
  only wraps Metro's own middleware, and the HTML comes from `ManifestMiddleware` before it. Tally
  uses the async API only, so no headers are needed. `withExclusiveTransactionAsync` throws on web.
  `PRAGMA journal_mode = WAL` is a silent no-op (mode stays `delete`).
- One tab at a time: a second tab's `openDatabaseAsync` fails with "Access Handles cannot be
  created…", and that worker stays broken ("Invalid VFS state"). Only a reload recovers.
- `expo-secure-store` web build is `export default {}` (no API). `expo-notifications`
  `scheduleNotificationAsync` throws `UnavailabilityError` on web. react-native-web's `Alert.alert`
  is a no-op.
- `expo-web-browser` web `openAuthSessionAsync` opens a popup and waits for `maybeCompleteAuthSession`
  to post back. The popup would boot the whole app on `/auth/callback`, so web uses a full-page redirect.
- `expo-linking` web `createURL(path)` = `new URL(path, window.location.origin)`, e.g.
  `http://localhost:8081/auth/callback`.
- **Skia web**: `@shopify/react-native-skia/lib/module/web` exports `LoadSkiaWeb(opts)` and
  `WithSkiaWeb({ getComponent, opts, componentProps, fallback })`. CanvasKit is `canvaskit-wasm@0.41.0`
  (exact dependency of Skia 2.14.0; its exports map includes `./bin/full/canvaskit.wasm`). On web,
  `@expo/metro-config`'s asset transformer exports non-image assets as a URL string, so
  `import url from 'canvaskit-wasm/bin/full/canvaskit.wasm'` + `locateFile: () => url` works in dev and
  export (no `public/` copy).
- NativeWind 4 on web with `darkMode: 'media'` throws "Cannot manually set color scheme…" when its CSS
  is injected after the runtime loads (dev). `darkMode: 'class'` avoids it.
- Expo Router 58: `Stack.Protected` takes `redirectTo`. Without it a blocked route redirects to the
  navigator's fallback, which for a group without an index is the group URL itself. `unstable_settings.
initialRouteName` is deprecated in favour of `anchor`.
- `victory-native@42.0.1` `Pie.Chart`: a children function _replaces_ the default `<Pie.Slice />`.

## Expo Router 58 (`expo-router@58.0.28`)

- Routes live in `src/app` (template default). Path alias `@/*` → `src/*` (`tsconfig.json`).
- JS bottom tabs: `import { Tabs } from 'expo-router/js-tabs'` (`Tabs` from `'expo-router'` is **deprecated**).
  Options used: `tabBarStyle`, `tabBarIcon`, `tabBarLabel`, `tabBarActiveTintColor`,
  `tabBarInactiveTintColor`, `tabBarLabelStyle`, `headerShown`, `sceneStyle`, `animation`
  (types: `build/react-navigation/bottom-tabs/types.d.ts`).
- Native tabs exist at `expo-router/native-tabs`, but they take image/SF-symbol icons and render
  the platform tab bar (iOS 26 Liquid Glass), which doesn't match the Figma's flat white bar.
  See decisions.md.
- Stack sheet options (`build/react-navigation/native-stack/types.d.ts`):
  `presentation: 'formSheet'`, `sheetAllowedDetents?: number[] | 'fitToContents'`,
  `sheetGrabberVisible?: boolean`, `sheetCornerRadius?: number`, `sheetInitialDetentIndex`.
- Guards: `Stack.Protected` (`guard` prop) is exported from the Stack layout.
- Hooks: `useRouter`, `useLocalSearchParams`, `useFocusEffect`, `router`, `Redirect`.

## Styling: NativeWind 4.2.7

```js
// babel.config.js
presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'];
// metro.config.js
withNativeWind(getDefaultConfig(__dirname), { input: './src/global.css' });
// tailwind.config.js
presets: [require('nativewind/preset')];
```

Plus `nativewind-env.d.ts` with `/// <reference types="nativewind/types" />`.
Custom fonts on Android need one `fontFamily` per weight (no synthetic bold), so typography
maps each weight to its own Inter face.

## Animation: Reanimated 4.7.1 + Worklets 0.13.0

- In Expo, `babel-preset-expo` configures the worklets plugin automatically.
- Use `.get()` / `.set()` on shared values (React Compiler is enabled via `experiments.reactCompiler`).
- `runOnJS` is deprecated → `scheduleOnRN` from `react-native-worklets`.
- Motion rules: `REFERENCE/DOCS/animation-guidelines.md` (Emil Kowalski `animate-expo`).

## Local database: expo-sqlite 58.0.14

```ts
import * as SQLite from 'expo-sqlite';
const db = await SQLite.openDatabaseAsync('tally.db');
await db.execAsync('PRAGMA journal_mode = WAL;');
await db.runAsync('INSERT ... VALUES (?, ?)', a, b);       // SQLiteRunResult
const row = await db.getFirstAsync<T>('SELECT ...', ...p); // T | null
const rows = await db.getAllAsync<T>('SELECT ...', ...p);  // T[]
await db.withExclusiveTransactionAsync(async (txn) => { ... });
```

Key-value store: `import { SQLiteStorage } from 'expo-sqlite/kv-store'`. `new SQLiteStorage(name)`
exposes the AsyncStorage-compatible `getItem` / `setItem` / `removeItem`.

## Supabase: `@supabase/supabase-js@2.118.0`

Official Expo guide (supabase/supabase `with-expo-react-native.mdx`): pass a custom `auth.storage`,
`autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: false`, and toggle
`startAutoRefresh()` / `stopAutoRefresh()` on `AppState`. The guide's encrypted option
("LargeSecureStore") keeps an AES key in SecureStore and the ciphertext in AsyncStorage, because
SecureStore values are limited to ~2048 bytes.

Tally's version of that pattern uses **SDK modules only** (no `aes-js` or
`react-native-get-random-values`):

- AES-256-**GCM** (authenticated) via `expo-crypto` 58: `AESEncryptionKey.generate()`,
  `aesEncryptAsync(base64Plaintext, key)` → `AESSealedData` (`.combined('base64')`),
  `AESSealedData.fromCombined(b64)`, `aesDecryptAsync(sealed, key, { output: 'base64' })`.
  Plaintext and output are base64.
- Key stored with `expo-secure-store` (`keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY`).
- Ciphertext stored in `expo-sqlite/kv-store`.

Auth methods (`@supabase/auth-js` `GoTrueClient.d.ts`): `signUp`, `signInWithPassword`,
`signInWithOAuth` (`options.redirectTo`, `options.skipBrowserRedirect`), `exchangeCodeForSession`,
`resetPasswordForEmail(email, { redirectTo })`, `updateUser`, `signOut`, `getSession`,
`onAuthStateChange`. Client option `auth.flowType: 'pkce'` makes email links and OAuth return a
`code` that the app exchanges.

Supabase now issues **publishable keys** (`sb_publishable_…`) in place of the legacy anon key.
Both are safe in the client, but only because RLS enforces access. **Never** ship the secret or
service-role key.

## Charts: victory-native 42.0.1

```tsx
<PolarChart data={rows} labelKey="label" valueKey="value" colorKey="color">
  <Pie.Chart innerRadius="78%">
    {() => <Pie.SliceAngularInset angularInset={{ angularStrokeWidth: 4, angularStrokeColor: '#FFFFFF' }} />}
  </Pie.Chart>
</PolarChart>
```

## Notifications: expo-notifications 58.1.7

`scheduleNotificationAsync({ content, trigger: { type: SchedulableTriggerInputTypes.DATE, date, channelId } })`,
`cancelScheduledNotificationAsync(id)`, `requestPermissionsAsync()`, `getPermissionsAsync()`,
`setNotificationHandler()`, `setNotificationChannelAsync()` (Android).

## Validation: zod 4.6.7 + react-hook-form 7.91.0 + @hookform/resolvers 6.0.2

Zod 4: `z.email('msg')` (top-level; `z.string().email()` is deprecated), `.min(n, 'msg')`,
`.refine(fn, { message, path })`. Resolver: `zodResolver(schema)` from `@hookform/resolvers/zod`.

## Icons: lucide-react-native 1.66.0

Verified exports: `House`, `ChartNoAxesColumn`, `Settings2`, `ShoppingCart`, `Zap`, `Utensils`,
`Briefcase`, `Wallet`, `EyeOff`, `Eye`, `CircleAlert`, `Info`, `ChevronRight`, `ChevronLeft`,
`ArrowLeft`, `Mail`, `Check`, `X`, `Plus`, `Plane`, `ShoppingBag`, `Receipt`, `PiggyBank`,
`Camera`, `Gift`, `Laptop`, `Tag`. Lucide ships no brand icons, so the Google "G" is a local SVG.

## Figma access

The `/figma` skill uses the REST API. On the **Starter** plan, Tier-1 endpoints (`files`, `nodes`,
`images`) rate-limit hard: on 2026-11-07 the API returned `429` with `Retry-After: 397245` (~4.6 days).
Design values here were sampled from the exported PNGs in `REFERENCE/UI/` (2x scale).

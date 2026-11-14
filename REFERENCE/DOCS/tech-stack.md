# Tally — Tech Stack

> Confirmed 7 Nov 2026. Platform decision: **React Native + Expo native app** (Android + iOS).
> This resolves the earlier open question in `tally-design-review.md` §5 and
> `ui-libraries-assessment.md`.

## Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| UI/UX Design | Figma | UI design and prototyping |
| Mobile Framework | React Native | Android and iOS app |
| Development Framework | Expo | Build and native tooling |
| Programming Language | TypeScript | Application logic |
| Styling | NativeWind | Tailwind-style styling |
| Navigation | Expo Router | Screen navigation |
| Animations | React Native Reanimated | Smooth animations (UI-thread) |
| Gestures | React Native Gesture Handler | Bottom sheets and swipe gestures |
| Backend | Supabase | Backend services |
| Database | PostgreSQL | Store user and transaction data |
| Authentication | Supabase Auth | Google and Email login |
| File Storage | Supabase Storage | Profile pictures |
| Local Database | Expo SQLite | Offline transaction storage |
| State Management | Zustand | Global application state |
| Data Fetching | TanStack Query | Server-state management |
| Charts | Victory Native | Expense and income charts |
| Form Validation | React Hook Form + Zod | Form handling and validation |
| Icons | Lucide React Native | Minimal icons |
| Notifications | Expo Notifications | Salary reminders |
| Version Control | Git + GitHub | Source code management |
| Build & Deployment | EAS Build | Android/iOS builds |

## Animation & UI resources

| Tool | Usage |
|------|-------|
| Motion.dev | Animation **inspiration** only (web lib — not used in-app) |
| GSAP | **Future marketing website** only (not in-app) |
| 21st.dev | Web component **inspiration** (web-only — not used in-app) |
| Three UI | UI component **inspiration** (web-only — not used in-app) |
| TasteSkill | Design **inspiration** |
| Reanimated | **Actual mobile animations** (the in-app animation engine) |

**Note:** Motion.dev, GSAP, 21st.dev and Three UI are web technologies. In a React
Native app they serve as *inspiration* only. All real in-app motion is built with
**Reanimated + Gesture Handler**. GSAP is reserved for a future marketing website.

## Reference: Emil Kowalski animation skills

For in-app motion craft, follow the distilled rules in `animation-guidelines.md`
(derived from the `animate-expo` skill at
https://github.com/emilkowalski/skills/tree/main/skills).

Install that skill set directly in the app repo when building:
```bash
npx skills@latest add emilkowalski/skills
```
The relevant skill is **`animate-expo`** (Reanimated + Gesture Handler + Expo Router +
expo-haptics). There is also `animate` (web) and `review-animations` for auditing.

## Install commands (for when the app repo is created)

> Always install native deps via Expo so versions match the SDK:
```bash
npx expo install react-native-reanimated react-native-worklets
npx expo install react-native-gesture-handler
npx expo install expo-router expo-haptics expo-sqlite expo-notifications
# JS-only deps:
npm install nativewind zustand @tanstack/react-query
npm install react-hook-form zod victory-native lucide-react-native
npm install @supabase/supabase-js
```
(Pin exact versions when adding them — no ranges.)

## Notes / standing constraints

- **No git commands without explicit permission.** Do not run `git`, and do not use
  scaffolding that auto-inits a repo, without asking first.
- Reanimated 4 requires the **New Architecture** (Expo SDK default on recent versions).
- Judge animation feel on a **release build on the slowest supported Android**, never
  in Expo Go or the simulator.

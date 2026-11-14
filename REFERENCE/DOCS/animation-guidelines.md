# Tally — UI Animation Guidelines

> Source: Emil Kowalski's `animate-expo` skill
> (https://github.com/emilkowalski/skills/tree/main/skills) — creator of Sonner & Vaul,
> ex-Vercel/Linear. Distilled here and mapped to Tally's screens.
> Stack: Reanimated 4 + Gesture Handler + Expo Router + expo-haptics.

These are the rules the app's motion should follow. They are opinionated on purpose —
the goal is an app that feels right **on a real mid-range Android in a release build**,
not just in the simulator.

---

## The three mobile truths everything follows from
1. **There is no hover.** Every affordance lives in *press*, position, or nothing.
2. **There are two runtimes.** Keep motion on the **UI thread** (worklets). Anything that
   touches the React Native (JS) thread per frame will stutter.
3. **The finger is on the element.** Gestures are primary input — interruptibility and
   velocity handoff are baseline, not polish.

---

## Decision sequence (run in order for any animation)

### 1. Should it animate at all?
| Frequency | Decision |
|-----------|----------|
| 100+/day (tab switches, keyboard, scroll, settings toggles) | **No animation.** Platform default. |
| Tens/day (press feedback, navigation, row select) | Near-imperceptible only (<150ms) or nothing |
| Occasional (sheets, modals, toasts, onboarding) | Standard animation |
| Rare/first-time (success, empty-state, celebration) | The "delight budget" lives here |

**Tab switches never slide** — Home/Insights/Settings are peers, not a hierarchy. Use
`animation: 'none'`.

### 2. Name the purpose in one word
feedback · spatial consistency · state indication · preventing a jarring change ·
explanation · delight (rare only). Can't name it? Don't build it.

### 3. Pick the cheapest tool that works
| Need | Tool |
|------|------|
| State-driven change, no gesture (press, toggle, color) | Reanimated CSS transition (`transitionProperty`) |
| Loop / mount with no state change | Reanimated CSS animation (keyframes) |
| Mount/unmount or list reflow | Layout animations (`entering`/`exiting`/`itemLayoutAnimation`) |
| Anything a finger touches, or scroll-derived | `useSharedValue` + `Gesture` + `useAnimatedStyle` |
| Screen → screen | Expo Router native stack options — never hand-roll |
| Bottom sheet that is its own screen | `presentation: 'formSheet'` |
| Tab bar | `NativeTabs` from `expo-router/unstable-native-tabs` |
| Vector illustration / celebration | Lottie (illustration only, never UI state) |

### 4. Properties — `transform` and `opacity` are free
Everything else (`width`, `height`, `margin`, `padding`, `flex`, `top`, `left`, `gap`)
re-runs layout every frame. **Exception:** an absolutely-positioned, childless element
(a progress-bar fill, a tab pill) may animate `width`.
- Never `scale(0)` — start from `scale(0.95–0.97)` + `opacity: 0`.
- `transform` order matters — keep `translate` before `scale`.
- Never animate `BlurView` intensity or Android `elevation` — crossfade a static layer.

### 5. Timing vs spring
- **Finger involved → spring** (carries velocity through interruption).
- Everything else → timing with these easings:
  - Entering/exiting → `ease-out`
  - On-screen move/morph → `ease-in-out`
  - Constant (progress) → `linear`
  - **Never `ease-in` on UI.**
```js
import { Easing } from 'react-native-reanimated';
const EASE_OUT     = Easing.bezier(0.23, 1, 0.32, 1);
const EASE_IN_OUT  = Easing.bezier(0.77, 0, 0.175, 1);
const EASE_SHEET   = Easing.bezier(0.32, 0.72, 0, 1); // iOS sheet
```
Springs (Apple's two-param form):
| Interaction | Config |
|-------------|--------|
| Default settle | `{ duration: 400, dampingRatio: 1 }` |
| Snap back after drag | `{ duration: 400, dampingRatio: 0.8, velocity }` |
| Sheet / drawer | `{ duration: 300, dampingRatio: 0.8, velocity }` |
| Must not pass a hard edge | add `overshootClamping: true` |

Durations: press 100–150ms · toggle 150–200ms · sheet ~300ms · screen = platform default.
All UI animations stay **under 300ms**.

### 6. Keep it off the JS thread
- Never `setState` from a gesture/scroll handler.
- Never schedule back to RN inside `onUpdate` — use `onEnd` or `useAnimatedReaction` at a threshold.
- Never read/write a shared value during render. Use `.get()`/`.set()` in worklets/handlers/effects.
- `runOnJS` is deprecated in Reanimated 4 → use `scheduleOnRN` from `react-native-worklets`.
- Worklet helper functions need `'worklet'` as the first line.

### 7. Press, not hover
- Feedback on **press-in**, commit on **press-out**.
- `scale: 0.97` in 100–150ms on every pressable (takes label + icon with it).
- 44×44pt min target (48dp Android); use `hitSlop`, don't grow the visual.
- `pressRetentionOffset` so a slight drift doesn't cancel.

### 8. Haptics (sparingly)
| Moment | Call |
|--------|------|
| Value ticks past a step (picker, slider detent) | `Haptics.selectionAsync()` |
| Something snaps home / drag commits | `Haptics.impactAsync(Light)` |
| Heavy landing / destructive fires | `Haptics.impactAsync(Medium)` |
| Succeeded / failed | `Haptics.notificationAsync(Success/Error)` |
Rules: same frame as the visual · one per user action · never the only feedback (many
users have it off). From a worklet: `scheduleOnRN(Haptics.selectionAsync)`.

### 9. Reduced motion + text scaling ship with the animation
`useReducedMotion()` → fewer and gentler (keep opacity/color, drop translate/scale/parallax;
screen transitions become `fade`). Text scales (`allowFontScaling`) — never animate to a
hardcoded height; measure with `onLayout` or animate a transform.

---

## Applied to Tally — screen by screen

| Screen / element | Animate? | What & how |
|------------------|----------|------------|
| **Bottom tab bar** (Home/Insights/Settings) | Tab switch: NO slide (`animation: 'none'`). Active icon: tiny. | `NativeTabs`. If custom, a <150ms opacity/weight change on the active label. |
| **Add Expense / Add Income sheets** | Yes — occasional tier | `presentation: 'formSheet'` (native sheet). If custom: drag-to-dismiss with velocity **or** distance threshold, rubber-band at the top, spring `{duration:300, dampingRatio:0.8, velocity}`. |
| **+ Add Expense / + Add Income buttons** | Yes — press feedback | `scale: 0.97`, 100–150ms, CSS transition on `Pressable`. |
| **Available Balance number** (₹6,000) | Delight tier — only on first load / after a change | Count-up via shared value + `useAnimatedReaction`, ease-out, <600ms. Don't re-run on every mount. |
| **Budget progress bar** (spent/left) | Yes — state indication | Absolutely-positioned fill → animate `width` (the allowed exception), ease-out. |
| **Savings progress ring** (30%) | Yes — state indication, on appear | Animate `strokeDashoffset` via `useAnimatedProps` on an SVG circle, ease-out ~500ms. |
| **Save Expense / Save Income** success | Delight tier | On save: `Haptics.notificationAsync(Success)` on the same frame as a brief check/scale-in (`scale 0.95→1` + opacity). |
| **Category / source chips** select | Near-imperceptible | <150ms background/scale on select + `Haptics.selectionAsync()`. |
| **Onboarding step transitions** (Welcome→…→Savings→Done) | Yes — spatial consistency | Native stack push (platform default). Don't override duration. |
| **Transaction list** first render | Occasional | `itemLayoutAnimation` / staggered `entering` on the *container*, not virtualized rows. Keep subtle. |
| **Donut chart (Insights)** draw-in | Delight, first view | Animate the arc with Reanimated/Skia; once per view, ease-out. |
| **Screen loads / pull to refresh** | Platform | `RefreshControl`. |

---

## Never ship (Tally quick-reference)
- Sliding between the three tabs.
- `setState` in a gesture/scroll handler.
- Animating `height`/`width`/`margin`/`flex` (except an absolute, childless fill/pill).
- `scale(0)` entrances — use `scale(0.95)` + opacity.
- A haptic per frame, or a haptic as the only feedback.
- `ease-in` on any UI element.
- Judging feel in Expo Go or the simulator — verify on a release build, slowest Android.

---

## When building: load the real skill
In the app repo, install the skill so the agent building animations follows these rules
with the full recipes:
```bash
npx skills@latest add emilkowalski/skills
```
Then use the **`animate-expo`** skill for any motion work, and **`review-animations`**
to audit before shipping.

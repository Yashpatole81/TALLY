# UI & Animation Libraries — Assessment for Tally

> Review date: 7 Nov 2026
> Context: evaluating candidate UI / animation resources against the Tally design
> (a minimal, monochrome, mobile budgeting app).

---

## The key question first: platform

**DECIDED (7 Nov 2026): Tally is a React Native + Expo native app** (Android + iOS).
See `tech-stack.md`.

This means **most of the libraries the user found are web tools and will NOT run in the app.**
They serve as *inspiration* only. The real in-app animation engine is **Reanimated**
(+ Gesture Handler). GSAP is reserved for a future marketing website. The sections below
keep the web-vs-native comparison for reference, but the native column is what applies.

---

## Candidate assessment

| Site | What it is | Fit for Tally | Verdict |
|------|-----------|---------------|---------|
| **motion.dev** | Framer Motion / Motion One — production animation library for React + vanilla JS. Physics-based, lightweight. | Excellent for number count-ups, bottom-sheet transitions, donut-chart draw-in, progress-bar fills. | **Use (web).** For native, use **Reanimated** instead — same model. |
| **gsap.com** | GSAP — the most powerful web animation engine. | Overkill for in-app micro-interactions; heavier than needed. Brilliant for a *marketing landing page*. | **Use for the marketing site, not the app.** |
| **21st.dev** | Community library of React + Tailwind + shadcn/ui components. | Strong accelerator **if Tally is web/React**. Clean components match the minimal aesthetic. Not for React Native. | **Use if web.** Pair with shadcn/ui. |
| **threeui.com** | Tailwind / React UI component collection. | Web component snippets; a reference/accelerator. Overlaps with 21st.dev. | **Use if web, as a supplement.** |
| **tasteskill.dev** | Design-taste / UI inspiration resource. | Good for inspiration and polish direction; not a component source you build directly from. | **Use for inspiration, not as a dependency.** |

---

## Recommended stacks

### If Tally is a WEB app / PWA
- **Base components:** shadcn/ui + Tailwind CSS
- **Component snippets / accelerators:** 21st.dev, threeui.com
- **Animation (in-app):** Motion (motion.dev)
- **Animation (marketing site only):** GSAP
- **Polish / taste direction:** tasteskill.dev

### If Tally is a NATIVE mobile app  (most likely, based on the Figma)
- **Framework:** React Native + Expo
- **Styling:** NativeWind (Tailwind for React Native)
- **Animation:** react-native-reanimated (+ react-native-gesture-handler for the sheets)
  — the native counterpart to Motion/GSAP; those web libraries do **not** run here.
- **Bottom sheets:** @gorhom/bottom-sheet
- **Charts:** victory-native or react-native-svg for the donut + bars
- **Inspiration:** tasteskill.dev (platform-agnostic)

---

## Summary recommendation (platform confirmed: native)

1. The app is **React Native + Expo** → use the **NATIVE stack** above.
2. The user's found libraries (Motion, GSAP, 21st.dev, Three UI) are **web tools** →
   **inspiration only**, they don't run in the app. GSAP → future marketing site. TasteSkill →
   design inspiration.
3. **Reanimated (+ Gesture Handler)** is the one animation engine for the app itself — the design
   has clear opportunities (balance count-up, sheet drag-to-dismiss, progress-ring/bar fills,
   donut-chart reveal, press feedback, save-success haptics).

## Animation craft reference — Emil Kowalski's skills

https://github.com/emilkowalski/skills/tree/main/skills — high-quality, opinionated
Expo/Reanimated animation guidance (creator of Sonner & Vaul, ex-Vercel/Linear). The
`animate-expo` skill is directly applicable. Distilled into Tally-specific rules in
`animation-guidelines.md`. Install in the app repo when building:
```bash
npx skills@latest add emilkowalski/skills
```

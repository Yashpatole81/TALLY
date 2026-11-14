# Tally — Design Review & Product Suggestions

> Review date: 7 Nov 2026
> Source: Figma file "Tally" (`jxaOVylrMuefmQYcCWA71s`), 18 frames exported to `REFERENCE/`
> Screens reviewed: onboarding flow, Home, Insights, Settings, Add Expense/Income sheets

---

## 1. What Tally is

A **salary-first personal budgeting app**. The core idea that makes it distinct:
**your payday funds the month ahead** — your 30 Oct salary becomes your November budget
("Following Month" allocation).

Most budget apps track a plain calendar month. Tally ties the budget to the user's actual
pay cycle. That is the differentiator and should stay front and center.

### User flow
```
Welcome
  → Sign In / Sign Up (+ validation states, Forgot Password, Reset Email Sent)
  → Personal Details
  → Salary Setup (amount, credit date, allocation, currency; + Custom Date variant)
  → Budget Confirmation ("You're all set")
  → Home  /  Insights  /  Settings   (bottom tab bar)
       ├─ Add Expense (bottom sheet)
       └─ Add Income  (bottom sheet)
```

### Screen inventory (exported to `REFERENCE/`)
| File | Screen |
|------|--------|
| `01-welcome.png` | Welcome / landing |
| `02-sign-in.png` | Sign In |
| `03-sign-up.png` | Sign Up |
| `04-personal-details.png` | Personal Details |
| `05-salary-setup.png` | Salary Setup |
| `06-budget-confirmation.png` | Budget Confirmation |
| `07-sign-in-validation.png` | Sign In — validation errors |
| `08-sign-up-validation.png` | Sign Up — validation errors |
| `09-salary-custom-date.png` | Salary Setup — custom date variant |
| `10-forgot-password.png` | Forgot Password |
| `11-reset-email-sent.png` | Reset Email Sent |
| `12-home.png` | Home dashboard |
| `13-insights.png` | Insights / analytics |
| `14-settings.png` | Settings |
| `15-add-expense-sheet.png` | Add Expense bottom sheet |
| `16-add-income-sheet.png` | Add Income bottom sheet |
| `17-reusable-elements.png` | Component library |
| `18-onboarding-ui-kit.png` | Onboarding UI kit |

---

## 2. Design language

- **Palette:** monochrome — black, white, and greys on a light-grey (#F1F1F0-ish) canvas.
- **Typography:** big, bold numeric displays; clean system sans-serif.
- **Layout:** rounded white cards floating on the grey canvas; generous spacing.
- **Buttons:** single black primary button; white/ghost secondary.
- **Charts:** monochrome donut + horizontal bars (greyscale ramp instead of color coding).

**Verdict:** confident, minimal, premium "fintech 2026" aesthetic. Strong foundation —
the suggestions below extend it rather than redesign it.

---

## 3. Suggestions — what to change

Ordered by impact.

### 3.1 Add a "budget health / pace" signal on Home  (highest value)
"56% left" means very different things on the 4th vs the 28th of the month. Add a subtle
pace indicator: *"On track"* / *"Spending faster than usual"*. For a budget app this is the
single highest-value addition.

### 3.2 Make categories one-tap on the Add sheets
Insights depends entirely on categories, but Add Expense marks Category as *optional* behind
a drill-in. If users skip it, Insights breaks. Put quick-select chips (Food, Bills, Shopping,
Travel, + custom) directly on the sheet — one tap, not a navigation.

### 3.3 Design empty states
First-run Home and Insights (zero transactions) will look broken. Add friendly empty states
with a prompt to add the first expense.

### 3.4 Custom numeric keypad on the Add sheets
A custom in-app keypad (instead of the OS keyboard) feels more premium and matches the
big-number aesthetic. Common in fintech apps.

### 3.5 Surface a "safe-to-spend per day" number
Available balance is spend-focused. A small *"₹X/day safe to spend"* is often the killer
metric for salary-cycle budgeting — it turns a number into a daily decision.

---

## 4. Suggestions — what to add (to make it a complete app)

| Feature | Why it matters for Tally |
|---------|--------------------------|
| **Recurring expenses / bills** | Rent, subscriptions auto-deducted from the budget. Essential for a salary app. |
| **Savings goals** | "Set aside ₹X before spending." Pairs naturally with the payday model. **Detailed in §4.1 below.** |
| **Month rollover rule** | What happens to leftover budget on payday — carry over, reset, or move to savings? Currently undefined and it is core to the concept. |
| **Notifications (events)** | "Salary credited", "80% of budget used", "3 days to payday". Settings has the toggle; the events need defining. |
| **Transaction detail / edit / delete** | Tapping a transaction should open it. Not in current screens. |
| **Search + filter on "View all"** | Needed once transaction volume grows. |
| **Biometric lock (Face ID / fingerprint)** | Expected for a finance app — a security requirement, not a nice-to-have. |
| **Export (CSV / PDF)** | Monthly statement export. |
| **Dark mode** | Settings promises "Appearance: System". The monochrome palette converts to dark beautifully. |

### 4.1 Savings goals — "pay yourself first" (priority feature)

Ask the user what they are saving for, then protect that money before it can be spent. This is a
natural extension of Tally's payday model: salary comes in → savings are set aside first → the
*rest* becomes the spendable monthly budget.

**Where to ask:**
- **Onboarding** — add a step after Salary Setup ("What are you saving for?"). This makes the very
  first budget savings-aware, so the Home "Available Balance" is already net of savings.
- **Anytime** — a "Goals" entry (new tab or a Home card) to add/edit goals later.

**What to capture per goal:**
- Goal name (e.g. "Emergency fund", "New phone", "Trip to Goa")
- Target amount (optional — some goals are open-ended, e.g. "build a cushion")
- Target date (optional — drives the suggested monthly contribution)
- Monthly contribution — either user-set, or auto-suggested from `target ÷ months remaining`

**How it changes the money math (this is the key decision):**
Savings should come **off the top**, not out of leftover spending:
```
Monthly salary            ₹16,000
− Savings contribution    ₹ 3,000   ← set aside first
= Spendable budget        ₹13,000   ← this is what Home shows as the budget
```
Today Home shows the full ₹16,000 as the budget. With goals on, the budget becomes
*salary − savings*, and a new line shows savings progress.

**Suggested UI:**
- **Onboarding step:** a simple "Add a savings goal" card with an optional "Skip for now".
- **Home:** a compact "Savings" card — this month's contribution + overall progress ring toward
  the goal ("₹9,000 of ₹30,000 · 30%").
- **Goal detail:** progress ring, target, projected completion date, contribution history.
- **On payday / month rollover:** auto-move the month's contribution into the goal, and optionally
  let leftover budget "sweep" into savings (ties directly to the month-rollover decision in §5).

**Scope options (pick one for v1):**
1. **Simple (recommended for v1):** a single savings target + monthly contribution, tracked as a
   progress ring. No separate "accounts", just a tracked set-aside number.
2. **Multiple goals:** several named goals, each with its own target/date/contribution.
3. **Advanced:** goals + automatic sweep of leftover budget + projections. (Later.)

**Keep it honest:** Tally tracks the *intention* to save; it is not moving real money between bank
accounts (unless a banking integration is added later). The UI copy should make that clear so users
don't think the app is debiting their account.

---

## 5. Open questions (need decisions before build)

1. ~~**Platform**~~ — **DECIDED: React Native + Expo native app** (Android + iOS).
   See `tech-stack.md`.
2. **Month rollover behaviour** (see §4) — carry over / reset / sweep leftover into savings?
3. **Is categorisation required or optional?** (see §3.2)
4. **Savings goals scope** (see §4.1) — single goal, multiple goals, or advanced? And should
   savings come off the top of the budget (recommended) or be tracked separately?
5. **Auth backend** — custom, Firebase, Supabase, or other?

---

## 6. Next steps

- ~~Confirm platform~~ — done (React Native + Expo, see `tech-stack.md`).
- Answer the remaining open questions above (rollover, categories, savings scope, auth).
- Decide whether to formalise this into a spec (requirements → design → tasks) or build
  screens directly from Figma.

## 7. Related docs

- `tech-stack.md` — confirmed stack + animation resources.
- `animation-guidelines.md` — in-app motion rules (from Emil Kowalski's `animate-expo` skill).
- `ui-libraries-assessment.md` — UI/animation tooling evaluation.

# Tally 💰

A clean, salary-first budgeting app for Android and iOS. 

Most budgeting apps assume your month starts on the 1st, but for salaried people, cash flow is tied to payday. If your salary lands on October 30th, that money is meant for November. Tally helps you manage your monthly budget from one payday to the next, sets aside your savings first, and shows you exactly what you can safely spend.

---

## ✨ Features

- **Salary-Cycle Budgeting**: Your payday funds the upcoming month ahead so your budget matches your real-life pay schedule.
- **Pay Yourself First**: Set aside money for savings goals upfront before you start spending.
- **Works 100% Offline**: Add expenses and check your budget anytime, even without an internet connection. It automatically syncs when you're back online.
- **Visual Insights**: Easy-to-read charts and category breakdowns showing where your money is going.
- **Customizable**: Set your own currency (INR ₹, USD $, EUR €, GBP £, etc.), manage expense categories, and receive payday reminders.
- **Private & Secure**: Your data belongs to you, protected with secure user authentication and cloud sync.

---

## 🚀 Quick Start (Running Locally)

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Expo Go](https://expo.dev/go) app installed on your Android or iOS phone

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the example environment file:
```bash
# On Windows PowerShell:
Copy-Item .env.example .env

# On macOS/Linux:
cp .env.example .env
```

Open `.env` and fill in your Supabase project credentials (available in your Supabase dashboard under **Project Settings → API**):
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

### 3. Start the App
```bash
npm start
```
Scan the displayed QR code with the **Expo Go** app on your phone to open and test Tally instantly!

---

## 📱 How to Build the Android APK (via Expo.dev)

You can build a standalone installable Android APK file using Expo's cloud build service (**EAS Build**) without needing Android Studio or complex build tools installed on your computer.

### Step 1: Create a Free Expo Account
If you don't already have an Expo account, sign up for free at [expo.dev](https://expo.dev/signup).

### Step 2: Log In to Expo via Terminal
Run the following command in your project terminal:
```bash
npx eas-cli login
```
Enter your Expo username/email and password.

### Step 3: Link Project to Expo
Initialize EAS in your project directory:
```bash
npx eas-cli project:init
```
Follow the simple on-screen prompt to create or link your project on your Expo dashboard.

### Step 4: Build the APK
Run the preview build command configured for APK generation:
```bash
npx eas-cli build -p android --profile preview
```

### Step 5: Download & Install
1. Expo will build the APK on the cloud.
2. Once the build finishes (usually a few minutes), EAS CLI will print a **download link** in your terminal.
3. You can also visit your [expo.dev](https://expo.dev) dashboard, go to **Builds**, and download the `.apk` file directly.
4. Transfer or open the link on your Android device to install and enjoy Tally!

> **Note on Build Types:**
> - `preview` profile builds an **APK** file (`.apk`) which you can directly install on any Android phone.
> - `production` profile builds an **Android App Bundle** (`.aab`) used for submitting to the Google Play Store.

---

## 🛠️ Helpful Commands

| Command | Description |
|---|---|
| `npm start` | Starts the Expo development server |
| `npm run android` | Starts the app directly on an attached Android device / emulator |
| `npm run ios` | Starts the app on the iOS simulator (macOS only) |
| `npm run web` | Opens the app in your web browser |
| `npm test` | Runs automated tests for math, logic, and validation |
| `npm run lint` | Checks code formatting and quality |

---

## 📁 Project Structure

```text
src/
├── app/          # App screens and navigation (Home, Insights, Settings, etc.)
├── components/   # UI elements (buttons, inputs, cards, charts)
├── data/         # Offline SQLite database, sync engine, and Supabase client
├── domain/       # Core budgeting math, salary rules, dates, and money helpers
├── theme/        # Colors, fonts, and styling tokens
└── validation/   # Form validation rules
```

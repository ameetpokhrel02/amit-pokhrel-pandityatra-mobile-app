<div align="center">
  <img src="src/assets/images/pandit-logo.png" alt="PanditYatra Logo" width="140" />

  <h1>PanditYatra</h1>
  <p><strong>Book pandits, shop puja samagri and consult live — all in one app.</strong></p>
  <p>Mobile app for Customers, Pandits and Vendors, built with Expo &amp; React Native.</p>

  <p>
    <img src="https://img.shields.io/badge/Expo-SDK_57-000020?style=flat-square&logo=expo&logoColor=white" alt="Expo SDK 57" />
    <img src="https://img.shields.io/badge/React_Native-0.86-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React Native 0.86" />
    <img src="https://img.shields.io/badge/React-19.2-149ECA?style=flat-square&logo=react&logoColor=white" alt="React 19.2" />
    <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 6.0" />
    <img src="https://img.shields.io/badge/NativeWind-4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="NativeWind 4" />
    <img src="https://img.shields.io/badge/Zustand-5-433e38?style=flat-square" alt="Zustand 5" />
  </p>
</div>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Running the App](#running-the-app)
- [Building for Release](#building-for-release)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [License](#license)

---

## Features

| Role | What they can do |
| --- | --- |
| **Customer** | Find nearby pandits and book pujas · Generate Vedic Kundali on-device and export to PDF · Shop samagri with Khalti, eSewa & Stripe · Live video puja & chat · Daily Panchang · AI assistant |
| **Pandit** | Manage services, pricing and availability · Track bookings and earnings (NPR) · Join live video sessions |
| **Vendor** | List and manage products · Track orders, stock and payouts |

> Admin features live in the separate Django web dashboard, not in this app.

Supports **English**, **Nepali** and **Hindi**, with light and dark themes.

---

## Tech Stack

- **Framework:** Expo SDK 57, React Native 0.86, Expo Router
- **Styling:** NativeWind (Tailwind CSS)
- **State:** Zustand
- **Networking:** Axios, Socket.IO
- **Auth:** Firebase, Google Sign-In
- **Payments:** Khalti, eSewa, Stripe
- **Video:** WebRTC / Daily
- **i18n:** i18next
- **Testing:** Jest, React Native Testing Library

---

## Prerequisites

| Tool | Version | Needed for |
| --- | --- | --- |
| [Node.js](https://nodejs.org/) | 20 LTS or newer | Everything |
| [Git](https://git-scm.com/) | Latest | Cloning the repo |
| [Expo Go](https://expo.dev/go) | Latest (App Store / Play Store) | Quick preview on a phone |
| [Android Studio](https://developer.android.com/studio) | Latest + JDK 17 | Android emulator / native builds |
| [Xcode](https://developer.apple.com/xcode/) | Latest (macOS only) | iOS simulator / native builds |

<details>
<summary><b>🐧 Linux setup</b></summary>

```bash
# Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install --lts

# Java 17 (Debian / Ubuntu)
sudo apt install openjdk-17-jdk

# Android SDK paths — add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
```

Enable KVM for a fast Android emulator. iOS builds are not possible on Linux — use Expo Go or EAS Build.
</details>

<details>
<summary><b>🍎 macOS setup</b></summary>

```bash
# Homebrew packages
brew install node watchman
brew install --cask zulu@17        # JDK 17 for Android

# Android SDK paths — add to ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

# iOS: install Xcode from the App Store, then
xcode-select --install
sudo gem install cocoapods
```
</details>

<details>
<summary><b>🪟 Windows setup</b></summary>

```powershell
# Node.js and JDK 17 (via winget)
winget install OpenJS.NodeJS.LTS
winget install Microsoft.OpenJDK.17

# Android SDK path (PowerShell, then restart the terminal)
setx ANDROID_HOME "$env:LOCALAPPDATA\Android\Sdk"
setx PATH "$env:PATH;$env:LOCALAPPDATA\Android\Sdk\platform-tools"
```

iOS builds are not possible on Windows — use Expo Go or EAS Build.
</details>

---

## Getting Started

**1. Clone the repository**

```bash
git clone https://github.com/ameetpokhrel02/amit-pokhrel-pandityatra-app.git
cd amit-pokhrel-pandityatra-app
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up environment variables**

| Linux / macOS | Windows (PowerShell) |
| --- | --- |
| `cp .env.example .env` | `Copy-Item .env.example .env` |

Then open `.env` and fill in your values. `EXPO_PUBLIC_API_URL` must point to the PanditYatra backend.

> When testing on a real phone against a local backend, use your computer's LAN IP (e.g. `http://192.168.1.10:8000/api/`), not `localhost`.

---

## Running the App

### Option A — Expo Go (quickest)

1. Install **Expo Go** on your phone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) · [iOS](https://apps.apple.com/app/expo-go/id982107779)).
2. Start the dev server:

   ```bash
   npm start
   ```

3. Scan the QR code — with the Expo Go app on Android, or the Camera app on iOS.

Phone and computer on different networks? Use a tunnel:

```bash
npm run start:tunnel
```

> **Note:** Expo Go can't load some native modules (WebRTC video calls, Khalti, Stripe, Google Sign-In). The app detects Expo Go and falls back where possible. To test these features, use a development build (Option B).

### Option B — Development build (full native features)

```bash
# Android (Linux / macOS / Windows) — emulator running or device connected via USB
npm run android

# iOS (macOS only)
npm run ios
```

### Option C — Web

```bash
npm run web
```

### Dev server shortcuts

With the dev server running, press:

| Key | Action |
| --- | --- |
| `a` | Open on Android emulator / device |
| `i` | Open on iOS simulator (macOS) |
| `w` | Open in the browser |
| `r` | Reload the app |
| `j` | Open the debugger |

### Troubleshooting

```bash
npx expo start -c        # clear the Metro cache
npx expo-doctor          # check for dependency issues
npx expo install --fix   # align package versions with the Expo SDK
```

---

## Building for Release

Builds run in the cloud with [EAS Build](https://docs.expo.dev/build/introduction/), so they work from any OS.

```bash
npm install -g eas-cli
eas login

eas build -p android --profile preview      # installable APK for testing
eas build -p android --profile production   # AAB for the Play Store
eas build -p ios --profile production       # iOS build (needs an Apple Developer account)
```

---

## Testing

```bash
npm test                  # run all tests
npm run test:watch        # watch mode
npm run test:coverage     # coverage report
npm run test:critical     # auth, booking and kundali tests only
npm run lint              # ESLint
```

---

## Project Structure

```
src/
├── app/            # Expo Router screens: (auth), (customer), (pandit), (vendor), (public)
├── components/     # Reusable UI components
├── features/       # Feature modules (e.g. auth)
├── hooks/          # Custom React hooks
├── services/       # API clients (Axios) and backend services
├── store/          # Zustand stores and React contexts
├── theme/          # Colors, spacing, typography
├── locales/        # Translations: en, np, hi
├── utils/          # Helpers (Kundali, Nepali calendar, currency, …)
├── assets/         # Images, fonts, animations
└── __tests__/      # Jest test suites
```

---

## License

Distributed under the MIT License.

<p align="center">Built with 🙏 by <b>Amit Pokhrel</b> for PanditYatra</p>

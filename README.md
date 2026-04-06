<div align="center">
  <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="PanditYatra Logo" width="120" />
  <h1>🕉️ Pandit Yatra Platform (Mobile Interfaces)</h1>
  <p><strong>A Next-Generation Spiritual Booking & E-commerce Platform for Customers, Pandits, and Vendors</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React_Native-0.81.5-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native Version" />
    <img src="https://img.shields.io/badge/Expo-~54.0.30-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo Version" />
    <img src="https://img.shields.io/badge/TypeScript-~5.9.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript Version" />
    <img src="https://img.shields.io/badge/Zustand-^5.0.9-423535?style=for-the-badge&logo=react&logoColor=white" alt="Zustand Version" />
    <img src="https://img.shields.io/badge/TailwindCSS-^3.4.19-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind Version" />
  </p>
</div>

---

## ✨ Comprehensive Features

### 👤 Customer (Anita) Journey
- **Pandit Booking:** Discover top-rated pandits near your location, view their real-time availability, and securely book personalized rituals or pujas.
- **Offline Kundali AI Engine:** Generate highly precise, private Vedic Kundali charts entirely on-device, and seamlessly export your detailed reading as a formatted PDF.
- **Unified Samagri Shop:** A comprehensive e-commerce portal to buy genuine spiritual items, including secure Khalti and eSewa integrated checkouts.
- **Live Video Consultations:** Communicate with your booked Pandits immediately through the native WebRTC Video Call integration.

### 👳 Pandit (Ramesh) Portal
- **Service & Availability Management:** Update custom prices for rituals, set expected durations, and toggle your availability.
- **Live Wallet & Earnings Tracker:** View total bookings, track real-time earnings stored dynamically, and manage upcoming, ongoing, or pending payments securely in NPR.

### 🏬 Marketplace Vendor (Riya) Interface
- **Store & Product Oversight:** Add and customize listings directly onto the PanditYatra ecosystem securely.
- **Analytics Dashboard:** Instantly view live total earnings, real-time product depletion counts, and payout metrics managed end-to-end through the synchronized backend.

*(Note: **Admin Oversight** is managed exclusively out of the native application context via the connected Django Web Administrator platform to enforce strict boundary protocols and keep the apps lightweight.)*

---

## 🛑 System Requirements & SDK Dependencies

Before building PanditYatra natively or using Expo, you strictly need the following environment configurations installed.

### Global Dependencies
- **Node.js**: v18.17.0+ (LTS Version highly recommended)
- **PNPM**: Package manager (Install via `npm install -g pnpm`)
- **Git**: For version control management

### 🍏 Mac OS X Specifics (iOS & Android)
- **Watchman**: `brew install watchman`
- **Xcode** (For iOS Emulation/Builds): Available from the Mac App Store. Make sure the Command Line Tools are active.
- **CocoaPods**: `sudo gem install cocoapods`
- **Android Studio** (For Android Emulation/Builds): 
   - Accept all SDK licenses.
   - Requires Android SDK 34, Android SDK Platform-Tools 35.x, and Android NDK settings.
   - *Java requirement: OpenJDK 17 (`brew install openjdk@17`).*

### 🪟 Windows Specifics (Android Only)
- **Java Development Kit (JDK)**: Microsoft OpenJDK 17 or Oracle JDK 17.
- **Android Studio**:
   - Install standard SDK packages via SDK Manager. Ensure `Android API 34` and `Android SDK Build-Tools` are accessible.
   - Configure global `ANDROID_HOME` system variables properly pointing to `C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk`.

### 🐧 Linux Specifics (Android Only)
- **Java**: OpenJDK 17 (`sudo apt install openjdk-17-jdk`)
- **Android Studio**: Install via Snap or direct tar extract. 
   - Add `.bashrc` or `.zshrc` exports:
     ```bash
     export ANDROID_HOME=$HOME/Android/Sdk
     export PATH=$PATH:$ANDROID_HOME/emulator
     export PATH=$PATH:$ANDROID_HOME/platform-tools
     ```
- **KVM**: Ensure KVM accelerates Linux kernel running to assist with smooth emulator performance.

---

## 🚀 Installation & Build Guide

### 1. Cloning the Core Application
On all operating systems, begin by cloning the repository using bash or powershell:
```bash
git clone https://github.com/ameetpokhrel02/amit-pokhrel-pandityatra-app.git
cd amit-pokhrel-pandityatra-app
```

### 2. Dependency Resolution
Execute the following to hydrate all internal packages without legacy peer conflicts:
```bash
pnpm install
```

### 3. Environment Context
Duplicate the template structure to bind your endpoints locally:
```bash
cp .env.example .env
```
Ensure `process.env.EXPO_PUBLIC_API_URL` reflects either your local Django environment network tunnel or your live production instance to verify authentication channels correctly.

### 4. Running the Development Server
**For Local Testing & Device Previews:**
```bash
# Starts the local development instance using Expo Metro
pnpm run start

# Important: If firing this on an external mobile device over fluctuating Wi-Fi 
# or testing heavily isolated APIs, ALWAYS prefer tunnel tunneling:
pnpm run start:tunnel
```
Press `a` in your terminal to fire up your Android Emulator, `i` for iOS (Mac only), or scan the QR Code via the **Expo Go App** on your smartphone.

### 5. Compiling for Production Release (APK / AAB)
When validating your end-to-end integration mapping, execute an internal build sequence to distribute the APK. Wait for the EAS compilation process to export the standalone application file.
```bash
# Install Expo Application Services CLI globally
npm install -g eas-cli

# Login and create your localized build configuration locally or push to servers
eas login
eas build:configure
eas build -p android --profile production
```

---

## 👨‍💻 Primary Directory Mapping
- `src/app/` — Central Expo Router Navigation. All restricted roles `(customer)`, `(pandit)`, and `(vendor)` live dynamically here alongside strictly gated middleware in `_layout.tsx`.
- `src/components/` — Standalone native components including maps, video layers, and chart parsers.
- `src/services/` — All API handlers managing Axios interceptors tracking automatic 401 token rotations.
- `src/store/` — Robust Zustand state modules (Global Authenticators, Wishlists).
- `src/utils/` — Math engine layers including standalone pure TS calculation mechanisms (WASM fallback Kundali).

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---
<p align="center">Built and Maintained for PanditYatra Production • Amit Pokhrel</p>

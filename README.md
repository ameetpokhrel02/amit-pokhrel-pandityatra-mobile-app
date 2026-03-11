🕉️ PanditYatra Mobile App

PanditYatra is a spiritual service platform that connects users with verified Vedic Pandits for pujas, consultations, astrology, and religious services. The mobile app allows users to book pujas, consult pandits, buy samagri, generate kundali, and attend live video pujas directly from their phones.

The mobile application is built using React Native with Expo, while the backend runs on Django REST Framework with PostgreSQL.

📱 Features
🔐 Authentication

Users can securely sign in using multiple methods:

Email + Password Login

Phone OTP Login

Google Login

Guest Explore Mode

📿 Puja Booking

Users can browse and book pujas easily.

Features:

Browse puja categories

View puja details

Select pandit

Schedule date & time

Book instantly

👳 Pandit Discovery

Users can discover verified pandits.

Includes:

Pandit profiles

Languages spoken

Experience

Ratings & reviews

Services offered

🛍 Samagri Shop

Users can purchase puja materials directly from the app.

Includes:

Samagri catalog

Category filters

AI-based samagri recommendation

Checkout and payment

🔮 Kundali & Astrology

Users can generate personalized horoscope charts.

Features:

Kundali generation

Kundali history

Panchang information

Astrology insights

📹 Live Video Puja

Users can attend puja ceremonies remotely.

Powered by Daily.co video SDK.

Flow:

Booking → Payment → Join Video Puja
💬 Chat System

Users can chat with pandits or use an AI guide.

Features:

Chat rooms

Real-time messages

Quick AI spiritual guide

🔔 Notifications

Users receive updates for:

Upcoming bookings

Puja reminders

Payment updates

Platform announcements

🏠 Home Screen Layout

The home screen is designed to highlight daily spiritual information and quick actions.

Sections include:

Hero Banner

Displays PanditYatra branding with a spiritual guide illustration.

Quick Actions
Book Puja
Find Pandit
Shop Samagri
Generate Kundali
Panchang
AI Guide
Daily Panchang

Shows important astrological data for the day.

Example:

Tithi
Nakshatra
Sunrise
Sunset
Auspicious Time
Featured Pujas

Shows popular pujas available for booking.

Top Pandits

Displays recommended pandits.

Upcoming Booking

Shows user's upcoming scheduled puja.

🧱 Tech Stack
Mobile App

React Native

Expo

Expo Router

TypeScript

Tailwind / Native styles

Backend

Django REST Framework

PostgreSQL

Docker

Integrations

Google OAuth

Khalti Payment Gateway

Daily.co Video SDK

OpenAI (AI Guide)

🔌 API Integration

The mobile app uses the same backend APIs used by the web application.

Base API URL example:

http://your-server-ip:8000/api/
🔐 Authentication APIs
POST /api/token/
POST /api/token/refresh/
POST /api/users/register/
POST /api/users/request-otp/
POST /api/users/login-otp/
POST /api/users/login-password/
POST /api/users/google-login/
GET /api/users/profile/
📿 Services APIs
GET /api/services/
GET /api/services/categories/
GET /api/services/{id}/
👳 Pandit APIs
GET /api/pandits/
GET /api/pandits/{id}/
POST /api/pandits/register/
GET /api/pandits/my-services/
📅 Booking APIs
GET /api/bookings/
POST /api/bookings/
GET /api/bookings/{id}/
💳 Payment APIs
POST /api/payments/create/
GET /api/payments/check-status/{booking_id}/
POST /api/payments/khalti/verify/
🛍 Samagri APIs
GET /api/samagri/items/
GET /api/samagri/categories/
POST /api/samagri/checkout/
POST /api/samagri/ai_recommend/
🔮 Kundali APIs
POST /api/kundali/generate/
GET /api/kundali/list/
GET /api/panchang/data/
💬 Chat APIs
GET /api/chat/rooms/
GET /api/chat/rooms/{id}/messages/
POST /api/chat/quick-chat/
📹 Video APIs
GET /api/video/room/{booking_id}/
POST /api/video/room/{booking_id}/join/
⚙️ Getting Started
1️⃣ Install dependencies
pnpm install
2️⃣ Start development server
pnpm start
3️⃣ Run Android
npx expo run:android
4️⃣ Build APK
eas build -p android --profile preview
📂 Project Structure
pandityatra-app
 ├── app
 │   ├── auth
 │   ├── home
 │   ├── services
 │   ├── pandits
 │   ├── bookings
 │   ├── shop
 │   ├── kundali
 │   └── profile
 │
 ├── components
 │   ├── common
 │   ├── home
 │   └── ui
 │
 ├── services
 │   ├── api.ts
 │   ├── auth.service.ts
 │   ├── booking.service.ts
 │   └── payment.service.ts
 │
 ├── assets
 │
 └── navigation
👤 Guest Mode

Users can explore the app without login.

Allowed actions:

Browse pujas
Browse pandits
View shop
View panchang

Restricted actions:

Booking
Chat
Payments
Video puja
📦 Deployment

The mobile app can be distributed using APK builds generated via Expo EAS Build.

Example:

eas build -p android --profile preview
🌐 Website

PanditYatra Web Platform
(Provide your web link here)

📜 License

This project is developed as part of the PanditYatra platform.
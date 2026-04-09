# Maa: Maternal Health Companion 🌸

Maa is a beautiful, offline-first mobile application built with React Native and Expo SDK 54, designed to serve as a warm, knowledgeable, and reliable companion for expecting mothers. 

It provides daily check-ins, prenatal yoga session tracking, water intake logging, an intelligent voice-activated AI maternal companion, and appointment reminders—all prioritizing user privacy by utilizing local on-device SQLite databases.

## 🌟 Features

* **Daily Insights & Logging**: Keep track of mood, symptoms, energy levels, and hydration natively.
* **Local Persistence**: Powered by `expo-sqlite`, ensuring 100% of journal entries and profile configurations stay private on your device.
* **Maa AI Chat**: A fully voice-activated AI companion capable of converting your speech into text directly on the device, returning specialized pregnancy advice, and playing it back audibly via offline Text-To-Speech (TTS). 
* **Prenatal Yoga & Exercises**: Dedicated guided sessions mapped securely via your local streaks tracking.
* **Dynamic Reminders**: Keep track of prenatal checkups and doctor appointments with push notifications dynamically scheduled to your calendar.

## 🚀 Getting Started

### Prerequisites

* Node.js (>= 20.x recommended)
* `npm` or `yarn`
* **Expo Go** application installed on your iOS or Android device.

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. *(Optional)* **Configure Backend:**
   Maa communicates with an external conversational AI text-to-speech backend. Update the IP configuration in `src/constants/theme.ts` relative to your dev environment to point toward your Python server.

### Running the App

Start the Expo Development Server:
```bash
npm start -- -c
```

* Ensure your mobile device and your PC are on the same local Wi-Fi network.
* Open **Expo Go** on your physical phone, and scan the QR code printed in the terminal.

## 🛠 Tech Stack

* **React Native** & **Expo SDK 54** (expo-router)
* **TypeScript** for strict type verification
* **Expo SQLite** for local database management
* **Expo AV** & Speech Recognition integration for accessibility 
* **React Native Reanimated** for 60-FPS micro-animations
* **Pre-bundled Google Fonts** (`Playfair Display` & `Inter`)

## 🤫 Security & Secrets

This repository's `.gitignore` guarantees that local IDE configurations, compilation build products, internal databases, `.env` files, and local Android/iOS credential keystores are safely ignored from history. Ensure that any third-party API credentials utilized by the backend or inside `.env` map stay out of your branches!

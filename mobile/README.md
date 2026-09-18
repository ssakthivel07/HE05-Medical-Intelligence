# Medical Timeline — Mobile Application (React Native / Expo)

Cross-platform companion mobile application for the **Medical Timeline** platform. Built with **React Native** and **Expo SDK 52+**, sharing the same Supabase authentication, database schema, storage bucket, and clinical intelligence APIs.

---

## 📱 Features

- **Document Camera Scanner:** Capture prescriptions, discharge letters, and lab results using the device camera with automatic cropping, perspective correction, and upload directly to Supabase storage.
- **Biometric Authentication:** FaceID / TouchID and Android BiometricPrompt support for instant, HIPAA-conscious session unlock.
- **Push Notifications & Medication Alarms:** Local and remote notification scheduling for daily medicine slots (Morning, Afternoon, Evening, Bedtime) and upcoming physician visits.
- **Offline Health Vault:** Secure local caching of the medical timeline and recent documents using encrypted SQLite for emergency offline review.
- **Interactive Voice Assistant:** Audio query capture via native microphone, streaming answers from the patient records intelligence engine.
- **Multi-Profile Household Switcher:** Fast switching between family profiles (Self, Parents, Children).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | React Native (Expo Managed Workflow SDK 52+) |
| **Navigation** | Expo Router v4 (File-based routing) |
| **Backend / DB** | Supabase (`@supabase/supabase-js`) |
| **Local Storage** | `expo-secure-store` (Tokens), `expo-sqlite` (Offline cache) |
| **Biometrics** | `expo-local-authentication` |
| **Camera & Media** | `expo-camera`, `expo-image-manipulator`, `expo-document-picker` |
| **Notifications** | `expo-notifications` (APNs / FCM) |
| **Styling** | NativeWind v4 (Tailwind CSS for React Native) |
| **Audio / Voice** | `expo-av`, `@react-native-voice/voice` |

---

## 📁 Directory Structure

```
mobile/
├── app/                          # Expo Router file-based screens
│   ├── (auth)/                   # Unauthenticated routes
│   │   ├── login.tsx             # Biometric / email sign in
│   │   └── signup.tsx            # Patient registration
│   ├── (tabs)/                   # Primary app tabs
│   │   ├── _layout.tsx           # Bottom tab bar configuration
│   │   ├── index.tsx             # Health Dashboard & AI Insights
│   │   ├── timeline.tsx          # Chronological Medical Timeline
│   │   ├── documents.tsx         # Document Center & Upload
│   │   ├── medicines.tsx         # Daily Medication Schedule
│   │   └── appointments.tsx      # Upcoming visits & booking
│   ├── document/[id].tsx         # Native document viewer with pinch-to-zoom
│   ├── scan/                     # Camera document scanner screen
│   │   └── index.tsx             # Real-time camera viewfinder & auto-capture
│   ├── assistant/                # Voice assistant overlay
│   └── _layout.tsx               # Root navigation stack & AuthProvider
├── components/                   # Reusable mobile UI components
│   ├── ui/                       # Buttons, Cards, Inputs, Badges
│   ├── timeline/                 # TimelineNode, EventDetailModal
│   ├── camera/                   # CameraOverlay, CropView
│   └── medicines/                # ScheduleSlotCard, DoseCheckButton
├── lib/                          # Core utilities & services
│   ├── supabase.ts               # Shared Supabase client with SecureStore adapter
│   ├── storage.ts                # Offline SQLite database sync
│   ├── notifications.ts          # Local medication alarm scheduler
│   └── types.ts                  # Shared TypeScript interfaces
├── app.json                      # Expo configuration & app permissions
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 20+ and npm / bun.
- Expo Go installed on iOS or Android test device, or Xcode / Android Studio for emulators.

### 2. Installation
```bash
cd mobile
npm install
```

### 3. Environment Configuration
Create `.env` in the `mobile/` root:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_API_URL=https://medical-timeline.health/api
```

### 4. Run Development Server
```bash
npx expo start
```
- Scan QR code with Expo Go (Android) or Camera app (iOS).
- Press `a` for Android Emulator or `i` for iOS Simulator.

---

## 🔒 Mobile Security & Compliance

1. **Zero Hardcoded Secrets:** Anon key only; all elevated clinical analysis occurs server-side.
2. **Encrypted Token Storage:** Auth session tokens stored in iOS Keychain and Android Keystore via `expo-secure-store`.
3. **Signed URLs Only:** Documents are loaded using short-lived signed URLs with 300-second expiration.
4. **App Blur on Backgrounding:** Hides sensitive medical screen contents in the OS app switcher.

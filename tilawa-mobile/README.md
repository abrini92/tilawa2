# Tilawa Mobile

> The world's first "Spiritual Tech" platform for Qur'an recitation.

A React Native + Expo mobile application that provides studio-grade recording, AI-powered enhancement, and community discovery for Qur'an reciters.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator
- Expo Go app on your physical device (recommended)

### Setup

```bash
# Clone and navigate
cd tilawa-mobile

# Install dependencies
npm install

# Start development server
npm start
```

### Running on Device

1. Install **Expo Go** from App Store / Play Store
2. Scan the QR code from terminal with your camera
3. App opens in Expo Go

### Running on Simulator

```bash
# iOS (Mac only)
npm run ios

# Android
npm run android
```

**Time from clone to running: < 5 minutes** ✅

---

## 📁 Project Structure

```
tilawa-mobile/
├── App.tsx                    # Root component
├── src/
│   ├── components/
│   │   └── ui/                # Design system components
│   │       ├── Button.tsx     # Primary/Secondary/Ghost variants
│   │       ├── Text.tsx       # Typography component
│   │       ├── Card.tsx       # Elevated surfaces
│   │       ├── Input.tsx      # Form inputs
│   │       └── LoadingSpinner.tsx
│   ├── screens/
│   │   ├── auth/              # Login, Signup
│   │   └── main/              # Studio, Library, Profile
│   ├── navigation/            # React Navigation setup
│   │   ├── RootNavigator.tsx  # Auth state switching
│   │   ├── AuthNavigator.tsx  # Login/Signup stack
│   │   └── MainNavigator.tsx  # Bottom tabs
│   ├── store/                 # Zustand stores
│   │   └── authStore.ts       # Authentication state
│   ├── services/              # API client
│   │   └── api.ts             # Axios with interceptors
│   ├── theme/                 # Design tokens
│   │   ├── colors.ts          # "Nocturnal Sanctuary" palette
│   │   ├── typography.ts      # Font scales
│   │   ├── spacing.ts         # 4px grid system
│   │   ├── shadows.ts         # Elevation system
│   │   ├── radius.ts          # Border radius
│   │   └── animations.ts      # Spring configs
│   ├── types/                 # TypeScript definitions
│   └── constants/             # App configuration
├── babel.config.js            # Path aliases (@/)
├── tsconfig.json              # TypeScript strict mode
└── .eslintrc.js               # Linting rules
```

---

## 🎨 Design System

### Color Palette: "Nocturnal Sanctuary"

| Token | Hex | Usage |
|-------|-----|-------|
| `sanctuary.black` | `#0A0A0A` | Main background |
| `sacred.green` | `#0D4D3E` | Mosque heritage accent |
| `divine.gold` | `#D4AF37` | CTAs, highlights |
| `neutral.white` | `#F8F6F0` | Text (warm, never pure white) |

### Typography

- **Arabic**: Uthmanic Hafs standard, line-height 1.8
- **Latin**: System font (SF Pro on iOS)
- **Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)

### Spacing

4px grid system: `xs(4)`, `sm(8)`, `md(12)`, `lg(16)`, `xl(20)`, `2xl(24)`, etc.

### Animations

Physics-based springs via `react-native-reanimated`:
- `snappy`: Quick feedback (buttons)
- `gentle`: Page transitions
- `bouncy`: Playful elements
- `slow`: Modal overlays

---

## 🧩 Component Usage

### Button

```tsx
import { Button } from '@/components/ui';

// Primary (gold background)
<Button variant="primary" onPress={handlePress}>
  Start Recording
</Button>

// Secondary (green background)
<Button variant="secondary" onPress={handlePress}>
  Save
</Button>

// Ghost (transparent with border)
<Button variant="ghost" onPress={handlePress}>
  Cancel
</Button>

// With loading state
<Button loading onPress={handlePress}>
  Processing...
</Button>
```

### Text

```tsx
import { Text } from '@/components/ui';

// Display text
<Text variant="displayLarge" color={colors.divine.gold}>
  تلاوة
</Text>

// Body text
<Text variant="bodyMedium">
  Welcome to Tilawa
</Text>

// Arabic Qur'anic text
<Text variant="arabicLarge">
  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
</Text>
```

### Card

```tsx
import { Card } from '@/components/ui';

// Default card
<Card>
  <Text>Content</Text>
</Card>

// Elevated with shadow
<Card variant="elevated">
  <Text>Elevated content</Text>
</Card>

// Outlined
<Card variant="outlined">
  <Text>Outlined content</Text>
</Card>
```

---

## 🏗 Architecture Decisions

### Why Expo?

- **Hot reload**: Instant feedback during development
- **OTA updates**: Push fixes without App Store review
- **Cross-platform**: Single codebase for iOS + Android
- **Managed workflow**: No native code complexity initially

### Why Zustand over Redux?

- **Simplicity**: No boilerplate, no actions/reducers
- **Performance**: Selective re-renders out of the box
- **Size**: ~1KB vs Redux's ~7KB
- **TypeScript**: First-class support

### Why React Query?

- **Caching**: Automatic request deduplication
- **Offline-first**: Stale-while-revalidate pattern
- **Sync**: Background refetching
- **DevTools**: Excellent debugging

### Why Reanimated 3?

- **Performance**: Runs on UI thread (60/120fps)
- **Springs**: Physics-based, natural motion
- **Gestures**: Seamless integration with Gesture Handler

---

## 🔧 Development

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### Type Checking

```bash
# Run TypeScript compiler
npx tsc --noEmit
```

### Clear Cache

```bash
# Clear Expo cache
npx expo start --clear

# Clear Metro bundler
rm -rf node_modules/.cache
```

---

## 📱 Testing on Device

For best results, always test on **real devices**:

1. Performance: Simulators don't reflect true frame rates
2. Haptics: Only work on physical devices
3. Audio: Recording quality varies by device

### iOS Device

1. Install Expo Go from App Store
2. Scan QR code or open link from terminal

### Android Device

1. Install Expo Go from Play Store
2. Scan QR code with Expo Go app

---

## 🎯 Phase 1 Checklist

- [x] Expo project with TypeScript strict mode
- [x] All dependencies installed
- [x] Folder structure (components, screens, navigation, store, theme)
- [x] Theme system (colors, typography, spacing, shadows, animations)
- [x] Path aliases configured (@/)
- [x] Navigation (Auth stack, Main tabs)
- [x] Core components (Button, Text, Card, Input, LoadingSpinner)
- [x] Auth store (Zustand)
- [x] API client (Axios with interceptors)
- [x] Auth screens (Login, Signup)
- [x] Main screens (Studio, Library, Profile)
- [x] ESLint + Prettier configured

---

## 📄 License

Proprietary - Tilawa © 2025

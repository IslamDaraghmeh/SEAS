# SEAS Mobile App

Smart Exam Attendance System - Flutter Mobile Application for Students

## Overview

This is the mobile application for students to view exam summaries, grades, and schedules as part of the SEAS (Smart Exam Attendance System) project.

## Features

- **Dashboard**: View upcoming exams, recent grades, and overall statistics
- **Exams**: Browse all exams with filtering by status (upcoming, ongoing, completed)
- **Grades**: View grades with detailed breakdowns and charts
- **Profile**: Manage user profile and settings
- **Bilingual Support**: Full Arabic (RTL) and English support
- **Theme Support**: Light and dark themes

## Tech Stack

- **Flutter** - Cross-platform mobile framework
- **Riverpod** - State management
- **GoRouter** - Navigation
- **Dio** - HTTP client
- **Flutter Secure Storage** - Token storage
- **FL Chart** - Charts and graphs
- **Google Fonts** - Cairo font for Arabic support

## Project Structure

```
lib/
├── core/
│   ├── constants/        # App constants (colors, strings, API)
│   ├── theme/            # App themes (light/dark)
│   ├── router/           # GoRouter configuration
│   ├── network/          # Dio client and API endpoints
│   └── localization/     # i18n support (Arabic/English)
├── data/
│   ├── models/           # Data models
│   └── repositories/     # API repositories
├── providers/            # Riverpod providers
└── presentation/
    ├── screens/          # App screens
    └── widgets/          # Reusable widgets
```

## Getting Started

### Prerequisites

- Flutter SDK (>=3.0.0)
- Dart SDK
- Android Studio / VS Code
- iOS Simulator / Android Emulator

### Installation

1. Clone the repository
2. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

3. Install dependencies:
   ```bash
   flutter pub get
   ```

4. Download the Cairo font from Google Fonts and place in `assets/fonts/`:
   - Cairo-Regular.ttf
   - Cairo-Bold.ttf
   - Cairo-SemiBold.ttf
   - Cairo-Medium.ttf
   - Cairo-Light.ttf

5. Run the app:
   ```bash
   flutter run
   ```

## Configuration

### API Configuration

Update the base URL in `lib/core/constants/api_constants.dart`:

```dart
static const String baseUrl = 'https://your-api-url.com';
```

### Theme Customization

Modify colors in `lib/core/constants/app_colors.dart` and themes in `lib/core/theme/app_theme.dart`.

## Localization

The app supports Arabic (default) and English. Add or modify strings in:
- `lib/core/localization/l10n/app_ar.arb` - Arabic strings
- `lib/core/localization/l10n/app_en.arb` - English strings

## Building for Production

### Android
```bash
flutter build apk --release
```

### iOS
```bash
flutter build ios --release
```

## Architecture

The app follows Clean Architecture principles:

- **Data Layer**: Models and repositories for API communication
- **Domain Layer**: Business logic in providers
- **Presentation Layer**: UI screens and widgets

### State Management

Using Riverpod for state management:
- `StateNotifierProvider` for complex state
- `FutureProvider` for async data
- `Provider` for computed values

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary software for SEAS.

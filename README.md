# Victoria Portal (Flutter)

This repository is now a **Flutter** application.

## Run

```bash
flutter pub get
flutter run
```

## Firebase

- Android config: `android/app/google-services.json` (package: `com.victoria.portal`)
- Web config is in `lib/firebase_options.dart`

### Hosting (Flutter web)

From the repo root, after `firebase login`:

```bash
flutter build web --release --dart-define=API_BASE_URL=https://YOUR-NEXT-API-HOST
firebase deploy --only hosting
```

The default `API_BASE_URL` in `lib/config/api_config.dart` is for local/Android emulator; production web **must** pass your deployed `legacy_next` API URL (no trailing slash). In the Firebase console, add your Hosting domain under **Authentication → Settings → Authorized domains**.

## Legacy (archived)

The previous Next.js + Prisma implementation is preserved under `legacy_next/`.

# victoria_portal

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

/// Base URL of the Victoria Next.js backend (no trailing slash).
///
/// Override at build/run time, e.g.:
/// `flutter run --dart-define=API_BASE_URL=https://YOUR_HOST`
///
/// Android emulator → host machine localhost:
/// `--dart-define=API_BASE_URL=http://10.0.2.2:3000`
class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );
}

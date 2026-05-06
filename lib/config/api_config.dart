class ApiConfig {
  /// Base URL of backend API (no trailing slash).
  ///
  /// Override:
  /// `flutter run --dart-define=API_BASE_URL=https://your-api-host`
  ///
  /// Android emulator localhost -> host machine:
  /// `http://10.0.2.2:3000`
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );
}

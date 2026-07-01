/// Mirrors `frontend/src/config/auth.js`.
class AuthConfig {
  /// Must match `applicationId` in `android/app/build.gradle.kts`.
  static const androidPackageName = 'com.akhdmedia.app';

  /// Origin registered for the web OAuth client in Google Cloud Console.
  static const googleAuthOrigin = 'https://akhdmedia.com';

  /// Optional override via `--dart-define=GOOGLE_CLIENT_ID=...`
  /// (same role as `VITE_GOOGLE_CLIENT_ID` on the website).
  static const _clientIdOverride = String.fromEnvironment(
    'GOOGLE_CLIENT_ID',
    defaultValue: '',
  );

  static const _defaultClientId =
      '581422572984-eiv7vs7tdl744g2pnd5m4jh95d6p054t.apps.googleusercontent.com';

  /// Public web OAuth client ID used for Google Sign-In.
  static String get googleClientId {
    final override = _clientIdOverride.trim();
    if (override.isNotEmpty) return override;
    return _defaultClientId;
  }
}

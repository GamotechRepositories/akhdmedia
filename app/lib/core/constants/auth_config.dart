class AuthConfig {
  /// Must match `applicationId` in `android/app/build.gradle.kts`.
  static const androidPackageName = 'com.example.app';

  /// Origin registered for the web OAuth client in Google Cloud Console.
  static const googleAuthOrigin = 'https://akhdmedia.com';
}

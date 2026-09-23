/// App auth constants shared across platforms.
class AuthConfig {
  /// Must match `applicationId` in `android/app/build.gradle.kts`.
  static const androidPackageName = 'com.akhdmedia.app';

  /// Must match the iOS bundle ID and Apple Sign-In audience on the server.
  static const iosBundleId = 'com.akhdmedia.ios';
}

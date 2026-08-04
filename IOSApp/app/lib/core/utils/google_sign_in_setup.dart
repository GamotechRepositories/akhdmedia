import '../constants/auth_config.dart';

/// User-facing hints when native Google Sign-In fails after account selection.
class GoogleSignInSetup {
  static String cancelledAfterAccountSelection() {
    return 'Google sign-in closed after you picked an account. '
        'This almost always means the Android OAuth client is missing or wrong in Google Cloud Console.\n\n'
        'In Google Cloud → APIs & Services → Credentials, create an OAuth client (Android):\n'
        '• Package name: ${AuthConfig.androidPackageName}\n'
        '• SHA-1: from `cd app/android && ./gradlew signingReport` (debug + release for store builds)\n\n'
        'The Web client ID in the app must match the server:\n'
        '${AuthConfig.googleClientId}\n\n'
        'Production server `.env`:\n'
        'GOOGLE_CLIENT_ID=${AuthConfig.googleClientId}\n'
        'GOOGLE_ANDROID_CLIENT_ID=<android-oauth-client-id> (recommended)\n\n'
        'After updating Google Cloud, stop the app and run again (not hot reload).';
  }

  static String serverRejectedToken(String? tokenAudience) {
    final aud = tokenAudience?.trim();
    final audLine = aud != null && aud.isNotEmpty ? '\nToken audience: $aud' : '';
    return 'The server rejected the Google sign-in token.$audLine\n\n'
        'Ensure production `GOOGLE_CLIENT_ID` matches the app web client ID above, '
        'and set `GOOGLE_ANDROID_CLIENT_ID` to your Android OAuth client ID if needed.';
  }
}

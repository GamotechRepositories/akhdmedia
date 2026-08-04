import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../core/errors/api_exception.dart';
import '../models/google_auth_config.dart';

enum GoogleSignInOutcome { success, cancelled }

/// Native Google Sign-In for Android/iOS (WebView OAuth is blocked by Google).
class GoogleSignInService {
  GoogleSignInService._();

  static final GoogleSignInService instance = GoogleSignInService._();

  static const _scopeHint = <String>[
    'openid',
    'email',
    'profile',
  ];

  String? _initializedWebClientId;
  String? _initializedIosClientId;
  bool _initializing = false;

  bool get _supportsNativeSignIn =>
      !kIsWeb && (Platform.isAndroid || Platform.isIOS);

  Future<void> _ensureInitialized(GoogleAuthConfig config) async {
    if (!_supportsNativeSignIn) {
      throw const ApiException('Google sign-in is not supported on this device');
    }

    if (_initializedWebClientId == config.webClientId &&
        _initializedIosClientId == config.iosClientId) {
      return;
    }

    if (_initializing) {
      while (_initializing) {
        await Future<void>.delayed(const Duration(milliseconds: 50));
      }
      return;
    }

    _initializing = true;
    try {
      await GoogleSignIn.instance.initialize(
        clientId: config.iosClientId?.isNotEmpty == true
            ? config.iosClientId
            : null,
        serverClientId: config.webClientId,
      );
      _initializedWebClientId = config.webClientId;
      _initializedIosClientId = config.iosClientId;
    } finally {
      _initializing = false;
    }
  }

  Future<({GoogleSignInOutcome outcome, String? idToken})> requestIdToken(
    GoogleAuthConfig config,
  ) async {
    await _ensureInitialized(config);

    final signIn = GoogleSignIn.instance;
    if (!signIn.supportsAuthenticate()) {
      throw const ApiException('Google sign-in is not supported on this device');
    }

    try {
      final account = await signIn.authenticate(scopeHint: _scopeHint);
      final idToken = account.authentication.idToken;
      if (idToken == null || idToken.isEmpty) {
        throw const ApiException(
          'Google did not return a sign-in token. Verify OAuth client setup for this app.',
        );
      }
      return (outcome: GoogleSignInOutcome.success, idToken: idToken);
    } on GoogleSignInException catch (e) {
      if (e.code == GoogleSignInExceptionCode.canceled) {
        return (outcome: GoogleSignInOutcome.cancelled, idToken: null);
      }
      throw ApiException(_messageForGoogleError(e));
    }
  }

  String _messageForGoogleError(GoogleSignInException error) {
    switch (error.code) {
      case GoogleSignInExceptionCode.clientConfigurationError:
      case GoogleSignInExceptionCode.providerConfigurationError:
        return 'Google sign-in is not configured for this app. '
            'Verify the OAuth client IDs and Android SHA-1 fingerprint in Google Cloud Console.';
      case GoogleSignInExceptionCode.interrupted:
      case GoogleSignInExceptionCode.uiUnavailable:
        return 'Google sign-in was interrupted. Please try again.';
      case GoogleSignInExceptionCode.canceled:
        return 'Google sign-in was cancelled.';
      case GoogleSignInExceptionCode.unknownError:
      case GoogleSignInExceptionCode.userMismatch:
        return error.description?.trim().isNotEmpty == true
            ? error.description!.trim()
            : 'Google sign-in failed. Please try again.';
    }
  }
}

import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../core/errors/api_exception.dart';

enum AppleSignInOutcome { success, cancelled }

class AppleSignInCredentials {
  const AppleSignInCredentials({
    required this.identityToken,
    this.email,
    this.name,
  });

  final String identityToken;
  final String? email;
  final String? name;
}

class AppleSignInService {
  AppleSignInService._();

  static final AppleSignInService instance = AppleSignInService._();

  Future<({AppleSignInOutcome outcome, AppleSignInCredentials? credentials})>
      requestCredentials() async {
    try {
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      final identityToken = credential.identityToken;
      if (identityToken == null || identityToken.isEmpty) {
        throw const ApiException(
          'Apple did not return a sign-in token. Please try again.',
        );
      }

      final given = credential.givenName?.trim();
      final family = credential.familyName?.trim();
      final nameParts = [
        if (given != null && given.isNotEmpty) given,
        if (family != null && family.isNotEmpty) family,
      ];

      return (
        outcome: AppleSignInOutcome.success,
        credentials: AppleSignInCredentials(
          identityToken: identityToken,
          email: credential.email?.trim().toLowerCase(),
          name: nameParts.isEmpty ? null : nameParts.join(' '),
        ),
      );
    } on SignInWithAppleAuthorizationException catch (error) {
      if (error.code == AuthorizationErrorCode.canceled) {
        return (outcome: AppleSignInOutcome.cancelled, credentials: null);
      }
      throw ApiException(_messageForError(error));
    }
  }

  String _messageForError(SignInWithAppleAuthorizationException error) {
    if (error.code == AuthorizationErrorCode.canceled) {
      return 'Apple sign-in was cancelled.';
    }

    return error.message.isNotEmpty
        ? error.message
        : 'Apple sign-in failed. Please try again.';
  }
}

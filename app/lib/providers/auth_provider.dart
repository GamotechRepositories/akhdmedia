import 'package:flutter/foundation.dart';

import '../core/errors/api_exception.dart';
import '../core/utils/google_sign_in_setup.dart';
import '../core/utils/jwt_debug.dart';
import '../models/user.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../services/google_sign_in_service.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider(this._authService);

  final AuthService _authService;

  AppUser? user;
  bool loading = true;
  String? error;

  bool get isAuthenticated => user != null;

  Future<void> bootstrap() async {
    loading = true;
    notifyListeners();

    try {
      user = await _authService.getMe();
      error = null;
    } catch (_) {
      // Mirror web `refreshAuth`: failed session check just means signed out.
      user = null;
      error = null;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    error = null;
    try {
      user = await _authService.login(email: email, password: password);
      notifyListeners();
    } catch (e) {
      error = ApiClient.unwrapError(e).toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    error = null;
    try {
      user = await _authService.register(
        name: name,
        email: email,
        phone: phone,
        password: password,
      );
      notifyListeners();
    } catch (e) {
      error = ApiClient.unwrapError(e).toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<String> sendRegisterOtp({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    error = null;
    try {
      return await _authService.sendRegisterOtp(
        name: name,
        email: email,
        phone: phone,
        password: password,
      );
    } catch (e) {
      error = ApiClient.unwrapError(e).toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<String> resendRegisterOtp(String email) async {
    error = null;
    try {
      return await _authService.resendRegisterOtp(email);
    } catch (e) {
      error = ApiClient.unwrapError(e).toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> verifyRegisterOtp({
    required String email,
    required String code,
  }) async {
    error = null;
    try {
      user = await _authService.verifyRegisterOtp(email: email, code: code);
      notifyListeners();
    } catch (e) {
      error = ApiClient.unwrapError(e).toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<GoogleSignInOutcome> signInWithGoogle() async {
    error = null;
    try {
      final result = await GoogleSignInService.instance.requestIdToken(
        _authService.googleAuthConfig,
      );
      if (result.outcome == GoogleSignInOutcome.cancelled) {
        if (kDebugMode) {
          debugPrint(
            '[Auth] Google sign-in returned cancelled after account picker — '
            'check Android OAuth client (package + SHA-1) in Google Cloud Console.',
          );
        }
        return GoogleSignInOutcome.cancelled;
      }

      final idToken = result.idToken!;
      if (kDebugMode) {
        debugPrint('[Auth] Google ID token aud: ${jwtAudience(idToken) ?? 'unknown'}');
      }

      try {
        await loginWithGoogle(idToken);
      } on ApiException catch (e) {
        if (e.statusCode == 401) {
          throw ApiException(
            GoogleSignInSetup.serverRejectedToken(jwtAudience(idToken)),
            statusCode: e.statusCode,
          );
        }
        rethrow;
      }
      return GoogleSignInOutcome.success;
    } catch (e, stack) {
      if (kDebugMode) {
        debugPrint('[Auth] Google sign-in failed: $e');
        debugPrintStack(stackTrace: stack);
      }
      error = ApiClient.unwrapError(e).toString();
      notifyListeners();
      rethrow;
    }
  }

  /// Mirrors web `loginWithGoogle(credential)` → `POST /user/auth/google`.
  Future<void> loginWithGoogle(String credential) async {
    error = null;
    try {
      user = await _authService.loginWithGoogle(credential);
      notifyListeners();
    } catch (e) {
      error = ApiClient.unwrapError(e).toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<String> requestPasswordReset(String email) async {
    return _authService.requestPasswordReset(email);
  }

  Future<String> resendPasswordResetOtp(String email) async {
    return _authService.resendPasswordResetOtp(email);
  }

  Future<void> resetPasswordWithOtp({
    required String email,
    required String code,
    required String password,
  }) async {
    error = null;
    try {
      user = await _authService.resetPasswordWithOtp(
        email: email,
        code: code,
        password: password,
      );
      notifyListeners();
    } catch (e) {
      error = ApiClient.unwrapError(e).toString();
      notifyListeners();
      rethrow;
    }
  }

  /// Mirrors web `logout()` → `POST /user/auth/logout`, then clear local user.
  Future<void> logout() async {
    try {
      await _authService.logout();
    } finally {
      user = null;
      notifyListeners();
    }
  }

  Future<void> updateProfile({required String name, required String phone}) async {
    user = await _authService.updateProfile(name: name, phone: phone);
    notifyListeners();
  }
}

import 'package:flutter/foundation.dart';

import '../models/user.dart';
import '../services/api_client.dart';
import '../services/apple_sign_in_service.dart';
import '../services/auth_service.dart';

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

  Future<AppleSignInOutcome> signInWithApple() async {
    error = null;
    try {
      final result = await AppleSignInService.instance.requestCredentials();
      if (result.outcome == AppleSignInOutcome.cancelled) {
        return AppleSignInOutcome.cancelled;
      }

      final credentials = result.credentials!;
      user = await _authService.loginWithApple(
        identityToken: credentials.identityToken,
        email: credentials.email,
        name: credentials.name,
      );
      notifyListeners();
      return AppleSignInOutcome.success;
    } catch (e, stack) {
      if (kDebugMode) {
        debugPrint('[Auth] Apple sign-in failed: $e');
        debugPrintStack(stackTrace: stack);
      }
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

  /// Mirrors web reset: verify OTP, set password, then signed-in session.
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

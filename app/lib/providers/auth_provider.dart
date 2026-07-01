import 'package:flutter/foundation.dart';

import '../models/user.dart';
import '../services/api_client.dart';
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
    } catch (e) {
      user = null;
      error = ApiClient.unwrapError(e).toString();
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

  Future<String> getGoogleClientId() => _authService.getGoogleClientId();

  Future<void> loginWithGoogleCredential(String credential) async {
    error = null;
    try {
      if (kDebugMode) {
        debugPrint('[Auth] Google credential received (${credential.length} chars)');
      }
      user = await _authService.loginWithGoogle(credential);
      notifyListeners();
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

  Future<String> requestPasswordReset(String email) async {
    return _authService.requestPasswordReset(email);
  }

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

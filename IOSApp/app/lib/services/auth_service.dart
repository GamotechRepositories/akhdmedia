import '../core/errors/api_exception.dart';
import '../models/user.dart';
import 'api_client.dart';

class AuthService {
  AuthService(this._api);

  final ApiClient _api;

  Future<AppUser> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    final response = await _api.postJson('/user/auth/register', data: {
      'name': name,
      'email': email,
      'phone': phone,
      'password': password,
    });
    return _parseUser(response);
  }

  Future<String> sendRegisterOtp({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    final response = await _api.postJson('/user/auth/register/send-otp', data: {
      'name': name,
      'email': email,
      'phone': phone,
      'password': password,
    });
    return response['message']?.toString() ??
        'A verification code has been sent to your email.';
  }

  Future<String> resendRegisterOtp(String email) async {
    final response = await _api.postJson('/user/auth/register/resend-otp', data: {
      'email': email.trim(),
    });
    return response['message']?.toString() ??
        'A new verification code has been sent.';
  }

  Future<AppUser> verifyRegisterOtp({
    required String email,
    required String code,
  }) async {
    final response = await _api.postJson('/user/auth/register/verify-otp', data: {
      'email': email.trim(),
      'code': code.trim(),
    });
    return _parseUser(response);
  }

  Future<AppUser> login({
    required String email,
    required String password,
  }) async {
    final response = await _api.postJson('/user/auth/login', data: {
      'email': email,
      'password': password,
    });
    return _parseUser(response);
  }

  Future<AppUser> loginWithApple({
    required String identityToken,
    String? email,
    String? name,
  }) async {
    final response = await _api.postJson('/user/auth/apple', data: {
      'identityToken': identityToken,
      if (email != null && email.isNotEmpty) 'email': email,
      if (name != null && name.isNotEmpty) 'name': name,
    });
    return _parseUser(response);
  }

  Future<String> requestPasswordReset(String email) async {
    final response = await _api.postJson('/user/auth/forgot-password', data: {
      'email': email.trim().toLowerCase(),
    });
    return response['message']?.toString() ??
        'A verification code has been sent to your email.';
  }

  Future<String> resendPasswordResetOtp(String email) async {
    final response =
        await _api.postJson('/user/auth/forgot-password/resend-otp', data: {
      'email': email.trim().toLowerCase(),
    });
    return response['message']?.toString() ??
        'A new verification code has been sent.';
  }

  /// Mirrors web `resetPassword(email, code, password)` → `POST /user/auth/reset-password`.
  Future<AppUser> resetPasswordWithOtp({
    required String email,
    required String code,
    required String password,
  }) async {
    final response = await _api.postJson('/user/auth/reset-password', data: {
      'email': email.trim().toLowerCase(),
      'code': code.trim(),
      'password': password,
    });
    return _parseUser(response);
  }

  Future<void> logout() async {
    try {
      await _api.postJson('/user/auth/logout');
    } finally {
      await _api.clearSessionCookies();
    }
  }

  Future<AppUser?> getMe() async {
    try {
      final response = await _api.getJson('/user/auth/me');
      return _parseUser(response);
    } on ApiException catch (e) {
      if (e.statusCode == 401) return null;
      rethrow;
    }
  }

  Future<AppUser> updateProfile({
    required String name,
    required String phone,
  }) async {
    final response = await _api.patchJson('/user/auth/profile', data: {
      'name': name,
      'phone': phone,
    });
    return _parseUser(response);
  }

  AppUser _parseUser(Map<String, dynamic> response) {
    final userJson = response['data']?['user'];
    if (userJson is! Map<String, dynamic>) {
      throw const ApiException('Invalid auth response');
    }
    return AppUser.fromJson(userJson);
  }
}

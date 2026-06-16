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

  Future<void> logout() async {
    await _api.postJson('/user/auth/logout');
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

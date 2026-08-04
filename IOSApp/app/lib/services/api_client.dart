import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:path_provider/path_provider.dart';

import '../core/config/app_config.dart';
import '../core/errors/api_exception.dart';

class ApiClient {
  ApiClient._(this._dio, this._cookieJar);

  final Dio _dio;
  final CookieJar _cookieJar;
  static ApiClient? _instance;

  static Future<ApiClient> create() async {
    if (_instance != null) return _instance!;

    final dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 20),
        headers: {'Content-Type': 'application/json'},
        validateStatus: (status) => status != null && status < 500,
      ),
    );

    final appDir = await getApplicationDocumentsDirectory();
    final cookieJar = PersistCookieJar(
      storage: FileStorage('${appDir.path}/.cookies/'),
    );
    dio.interceptors.add(CookieManager(cookieJar));

    dio.interceptors.add(
      InterceptorsWrapper(
        onError: (error, handler) {
          handler.reject(
            DioException(
              requestOptions: error.requestOptions,
              response: error.response,
              type: error.type,
              error: ApiException.fromDio(error),
            ),
          );
        },
      ),
    );

    _instance = ApiClient._(dio, cookieJar);
    return _instance!;
  }

  Dio get dio => _dio;

  Future<void> clearSessionCookies() async {
    await _cookieJar.deleteAll();
  }

  Future<Map<String, dynamic>> getJson(String path, {Map<String, dynamic>? query}) async {
    return _unwrap(await _dio.get<Map<String, dynamic>>(path, queryParameters: query));
  }

  Future<Map<String, dynamic>> postJson(
    String path, {
    Object? data,
    Map<String, dynamic>? query,
  }) async {
    return _unwrap(await _dio.post<Map<String, dynamic>>(path, data: data, queryParameters: query));
  }

  Future<Map<String, dynamic>> patchJson(String path, {Object? data}) async {
    return _unwrap(await _dio.patch<Map<String, dynamic>>(path, data: data));
  }

  Future<Map<String, dynamic>> putJson(String path, {Object? data}) async {
    return _unwrap(await _dio.put<Map<String, dynamic>>(path, data: data));
  }

  Future<Map<String, dynamic>> deleteJson(String path) async {
    return _unwrap(await _dio.delete<Map<String, dynamic>>(path));
  }

  Future<List<int>> getBytes(String path) async {
    final response = await _dio.get<List<int>>(
      path,
      options: Options(responseType: ResponseType.bytes),
    );

    final status = response.statusCode ?? 0;
    if (status >= 200 && status < 300) {
      return response.data ?? [];
    }

    throw ApiException('Request failed ($status)', statusCode: status);
  }

  Map<String, dynamic> _unwrap(Response<Map<String, dynamic>> response) {
    final status = response.statusCode ?? 0;
    final data = response.data ?? <String, dynamic>{};

    if (status >= 200 && status < 300) {
      return data;
    }

    final message = data['message']?.toString() ?? 'Request failed ($status)';
    throw ApiException(message, statusCode: status);
  }

  static Object unwrapError(Object error) {
    if (error is DioException && error.error is ApiException) {
      return error.error as ApiException;
    }
    if (error is ApiException) return error;
    return ApiException(error.toString());
  }
}

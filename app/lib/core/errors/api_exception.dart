import 'package:dio/dio.dart';

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;

  static ApiException fromDio(DioException error) {
    final response = error.response;
    final data = response?.data;

    if (data is Map) {
      final message = data['message']?.toString();
      if (message != null && message.isNotEmpty) {
        return ApiException(message, statusCode: response?.statusCode);
      }
    }

    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return const ApiException('Request timed out. Please try again.');
    }

    if (error.type == DioExceptionType.connectionError) {
      return const ApiException('Could not connect. Check your internet connection.');
    }

    return ApiException(
      'Something went wrong. Please try again.',
      statusCode: response?.statusCode,
    );
  }
}

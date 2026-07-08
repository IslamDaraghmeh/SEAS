import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/api_constants.dart';
import 'api_endpoints.dart';

/// Single shared secure-storage configuration used for BOTH reads and writes.
///
/// IMPORTANT: on Android, `encryptedSharedPreferences: true` and the default
/// (`false`) are two completely different backing stores. If the token is
/// written with one and read with the other, the read returns null. Previously
/// the repository wrote with `encryptedSharedPreferences: true` while the Dio
/// auth interceptor read with the default `const FlutterSecureStorage()`, so
/// the `Authorization` header was never attached and every authed request came
/// back 401 ("please login again"). Everything now uses this one instance.
const FlutterSecureStorage appSecureStorage = FlutterSecureStorage(
  aOptions: AndroidOptions(
    encryptedSharedPreferences: true,
  ),
  iOptions: IOSOptions(
    accessibility: KeychainAccessibility.first_unlock_this_device,
  ),
);

/// Dio HTTP Client Provider
final dioClientProvider = Provider<DioClient>((ref) {
  return DioClient(ref.watch(secureStorageProvider));
});

/// Secure Storage Provider
final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return appSecureStorage;
});

/// Dio HTTP Client with interceptors
class DioClient {
  late final Dio _dio;
  final FlutterSecureStorage _storage;

  DioClient(this._storage) {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl + ApiConstants.apiPrefix,
        connectTimeout: const Duration(milliseconds: ApiConstants.connectionTimeout),
        receiveTimeout: const Duration(milliseconds: ApiConstants.receiveTimeout),
        sendTimeout: const Duration(milliseconds: ApiConstants.sendTimeout),
        headers: {
          'Content-Type': ApiConstants.contentType,
          'Accept': ApiConstants.contentType,
        },
      ),
    );

    _dio.interceptors.addAll([
      _AuthInterceptor(_storage),
      _LoggingInterceptor(),
      _ErrorInterceptor(),
    ]);
  }

  Dio get dio => _dio;

  // GET request
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    return _dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  // POST request
  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    return _dio.post<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  // PUT request
  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    return _dio.put<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  // PATCH request
  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    return _dio.patch<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  // DELETE request
  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    return _dio.delete<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  // Set language header
  void setLanguage(String languageCode) {
    _dio.options.headers['Accept-Language'] = languageCode;
  }
}

/// Auth Interceptor for adding tokens
class _AuthInterceptor extends Interceptor {
  final FlutterSecureStorage _storage;

  _AuthInterceptor(this._storage);

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Skip auth for login/register endpoints
    if (options.path.contains(ApiEndpoints.login) ||
        options.path.contains(ApiEndpoints.register)) {
      return handler.next(options);
    }

    // Add token to headers
    final token = await _storage.read(key: ApiConstants.accessTokenKey);
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    return handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Try to refresh token
      final refreshToken = await _storage.read(key: ApiConstants.refreshTokenKey);
      if (refreshToken != null) {
        try {
          final response = await Dio().post(
            '${ApiConstants.baseUrl}${ApiConstants.apiPrefix}${ApiEndpoints.refreshToken}',
            data: {'refreshToken': refreshToken},
          );

          if (response.statusCode == 200) {
            final newToken =
                response.data['accessToken'] ?? response.data['access_token'];
            await _storage.write(key: ApiConstants.accessTokenKey, value: newToken);

            // Retry the original request
            err.requestOptions.headers['Authorization'] = 'Bearer $newToken';
            final retryResponse = await Dio().fetch(err.requestOptions);
            return handler.resolve(retryResponse);
          }
        } catch (e) {
          // Refresh failed, clear tokens
          await _storage.deleteAll();
        }
      }
    }

    return handler.next(err);
  }
}

/// Logging Interceptor for debugging
class _LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    print('==> ${options.method} ${options.uri}');
    print('Headers: ${options.headers}');
    if (options.data != null) {
      print('Body: ${options.data}');
    }
    return handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    print('<== ${response.statusCode} ${response.requestOptions.uri}');
    return handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    print('<== Error: ${err.response?.statusCode} ${err.requestOptions.uri}');
    print('Error message: ${err.message}');
    return handler.next(err);
  }
}

/// Error Interceptor for handling errors
class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    ApiException apiException;

    switch (err.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        apiException = ApiException(
          message: 'انتهت مهلة الاتصال',
          messageEn: 'Connection timeout',
          statusCode: 408,
        );
        break;
      case DioExceptionType.connectionError:
        apiException = ApiException(
          message: 'لا يوجد اتصال بالإنترنت',
          messageEn: 'No internet connection',
          statusCode: 0,
        );
        break;
      case DioExceptionType.badResponse:
        apiException = _handleBadResponse(err.response);
        break;
      case DioExceptionType.cancel:
        apiException = ApiException(
          message: 'تم إلغاء الطلب',
          messageEn: 'Request cancelled',
          statusCode: 0,
        );
        break;
      default:
        apiException = ApiException(
          message: 'حدث خطأ غير متوقع',
          messageEn: 'An unexpected error occurred',
          statusCode: 500,
        );
    }

    return handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        response: err.response,
        type: err.type,
        error: apiException,
      ),
    );
  }

  ApiException _handleBadResponse(Response? response) {
    final statusCode = response?.statusCode ?? 500;
    final data = response?.data;

    String messageAr = 'حدث خطأ غير متوقع';
    String messageEn = 'An unexpected error occurred';

    if (data is Map<String, dynamic>) {
      messageAr = data['message_ar'] ?? data['message'] ?? messageAr;
      messageEn = data['message_en'] ?? data['message'] ?? messageEn;
    }

    switch (statusCode) {
      case 400:
        return ApiException(
          message: messageAr,
          messageEn: messageEn,
          statusCode: statusCode,
        );
      case 401:
        return ApiException(
          message: 'يرجى تسجيل الدخول مرة أخرى',
          messageEn: 'Please login again',
          statusCode: statusCode,
        );
      case 403:
        return ApiException(
          message: 'ليس لديك صلاحية للوصول',
          messageEn: 'Access denied',
          statusCode: statusCode,
        );
      case 404:
        return ApiException(
          message: 'لم يتم العثور على البيانات',
          messageEn: 'Data not found',
          statusCode: statusCode,
        );
      case 422:
        return ApiException(
          message: messageAr,
          messageEn: messageEn,
          statusCode: statusCode,
        );
      case 500:
        return ApiException(
          message: 'خطأ في الخادم',
          messageEn: 'Server error',
          statusCode: statusCode,
        );
      default:
        return ApiException(
          message: messageAr,
          messageEn: messageEn,
          statusCode: statusCode,
        );
    }
  }
}

/// API Exception class
class ApiException implements Exception {
  final String message;
  final String messageEn;
  final int statusCode;

  ApiException({
    required this.message,
    required this.messageEn,
    required this.statusCode,
  });

  @override
  String toString() => message;

  String getLocalizedMessage(String locale) {
    return locale == 'ar' ? message : messageEn;
  }
}

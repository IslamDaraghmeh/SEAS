/// API Constants for SEAS Mobile App
class ApiConstants {
  ApiConstants._();

  // Base URLs
  static const String baseUrl = 'https://api.seas.edu.sa';
  static const String devBaseUrl = 'http://localhost:3000';
  static const String stagingBaseUrl = 'https://staging-api.seas.edu.sa';

  // API Version
  static const String apiVersion = 'v1';
  static const String apiPrefix = '/api/$apiVersion';

  // Timeouts (in milliseconds)
  static const int connectionTimeout = 30000;
  static const int receiveTimeout = 30000;
  static const int sendTimeout = 30000;

  // Headers
  static const String contentType = 'application/json';
  static const String acceptLanguageAr = 'ar';
  static const String acceptLanguageEn = 'en';

  // Token Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String tokenTypeKey = 'token_type';

  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
}

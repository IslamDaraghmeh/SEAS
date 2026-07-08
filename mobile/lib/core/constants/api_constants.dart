/// API Constants for SEAS Mobile App
class ApiConstants {
  ApiConstants._();

  // ---------------------------------------------------------------------------
  // Base URLs
  //
  // The app talks to the deployed backend behind nginx, which serves the API at
  // https://<domain>/api (see nginx.prod.conf -> `location /api`). We therefore
  // point the mobile app at the production DOMAIN by default instead of
  // localhost. Any of these values can be overridden at build/run time without
  // touching the code, e.g.:
  //
  //   flutter run --dart-define=API_BASE_URL=https://daraghmeh.online \
  //               --dart-define=API_PREFIX=/api
  //
  // ---------------------------------------------------------------------------

  /// Production domain (default). nginx reverse-proxies /api -> backend:3000.
  static const String prodBaseUrl = 'https://daraghmeh.online';

  /// Staging environment (adjust if/when one exists).
  static const String stagingBaseUrl = 'https://staging.daraghmeh.online';

  /// Local development. Android emulators reach the host via 10.0.2.2.
  static const String devBaseUrl = 'http://10.0.2.2:3000';

  /// Effective base URL. Overridable via --dart-define=API_BASE_URL=...
  /// Defaults to the production domain (NOT localhost).
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: prodBaseUrl,
  );

  // API Prefix
  //
  // The NestJS backend uses `app.setGlobalPrefix('api')` with NO version
  // segment, and the live server confirms this: `/api/*` responds while
  // `/api/v1/*` returns 404. The default is therefore `/api`. If a gateway
  // ever rewrites a versioned path, override with --dart-define=API_PREFIX=...
  static const String apiPrefix = String.fromEnvironment(
    'API_PREFIX',
    defaultValue: '/api',
  );

  /// Legacy version segment kept for reference. Not used in the request path
  /// because the current backend is unversioned.
  static const String apiVersion = 'v1';

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

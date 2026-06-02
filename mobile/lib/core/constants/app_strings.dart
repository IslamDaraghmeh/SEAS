/// String Constants for SEAS Mobile App
class AppStrings {
  AppStrings._();

  // App Info
  static const String appName = 'SEAS';
  static const String appNameAr = 'نظام حضور الامتحانات الذكي';
  static const String appNameEn = 'Smart Exam Attendance System';
  static const String appVersion = '1.0.0';

  // Route Names
  static const String splashRoute = 'splash';
  static const String loginRoute = 'login';
  static const String registerRoute = 'register';
  static const String homeRoute = 'home';
  static const String dashboardRoute = 'dashboard';
  static const String examsRoute = 'exams';
  static const String examDetailsRoute = 'exam-details';
  static const String examResultsRoute = 'exam-results';
  static const String gradesRoute = 'grades';
  static const String gradeDetailsRoute = 'grade-details';
  static const String gradesChartRoute = 'grades-chart';
  static const String profileRoute = 'profile';
  static const String settingsRoute = 'settings';
  static const String languageRoute = 'language';

  // Storage Keys
  static const String themeKey = 'theme_mode';
  static const String localeKey = 'locale';
  static const String userKey = 'user_data';
  static const String onboardingKey = 'onboarding_complete';

  // Asset Paths
  static const String imagesPath = 'assets/images/';
  static const String iconsPath = 'assets/icons/';
  static const String logoPath = 'assets/images/logo.png';
  static const String placeholderPath = 'assets/images/placeholder.png';

  // Date Formats
  static const String dateFormat = 'yyyy-MM-dd';
  static const String timeFormat = 'HH:mm';
  static const String dateTimeFormat = 'yyyy-MM-dd HH:mm';
  static const String displayDateFormat = 'dd MMMM yyyy';
  static const String displayTimeFormat = 'hh:mm a';
  static const String displayDateTimeFormat = 'dd MMMM yyyy - hh:mm a';

  // Validation Patterns
  static const String emailPattern =
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';
  static const String phonePattern = r'^[0-9]{10,15}$';
  static const String studentIdPattern = r'^[0-9]{8,12}$';

  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;

  // Animation Durations
  static const int shortAnimationDuration = 200;
  static const int mediumAnimationDuration = 400;
  static const int longAnimationDuration = 600;

  // Error Messages (Defaults - will be overridden by localization)
  static const String unknownError = 'حدث خطأ غير متوقع';
  static const String networkError = 'خطأ في الاتصال بالشبكة';
  static const String serverError = 'خطأ في الخادم';
  static const String authError = 'خطأ في المصادقة';
  static const String validationError = 'خطأ في البيانات المدخلة';
}

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

/// App Localizations for SEAS Mobile App
class AppLocalizations {
  final Locale locale;

  AppLocalizations(this.locale);

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static const List<Locale> supportedLocales = [
    Locale('ar'), // Arabic (default)
    Locale('en'), // English
  ];

  static const Locale defaultLocale = Locale('ar');

  // Localized strings
  late final Map<String, String> _localizedStrings = _isArabic ? _arStrings : _enStrings;

  bool get _isArabic => locale.languageCode == 'ar';

  String get(String key) => _localizedStrings[key] ?? key;

  // Arabic Strings
  static const Map<String, String> _arStrings = {
    // App
    'app_name': 'نظام حضور الامتحانات الذكي',
    'app_short_name': 'SEAS',

    // Auth
    'login': 'تسجيل الدخول',
    'register': 'إنشاء حساب',
    'logout': 'تسجيل الخروج',
    'email': 'البريد الإلكتروني',
    'password': 'كلمة المرور',
    'confirm_password': 'تأكيد كلمة المرور',
    'forgot_password': 'نسيت كلمة المرور؟',
    'student_id': 'الرقم الجامعي',
    'full_name': 'الاسم الكامل',
    'phone': 'رقم الهاتف',
    'no_account': 'ليس لديك حساب؟',
    'have_account': 'لديك حساب بالفعل؟',
    'login_success': 'تم تسجيل الدخول بنجاح',
    'register_success': 'تم إنشاء الحساب بنجاح',

    // Navigation
    'home': 'الرئيسية',
    'dashboard': 'لوحة التحكم',
    'exams': 'الامتحانات',
    'grades': 'الدرجات',
    'profile': 'الملف الشخصي',
    'settings': 'الإعدادات',

    // Dashboard
    'welcome_back': 'مرحباً بعودتك',
    'upcoming_exams': 'الامتحانات القادمة',
    'recent_grades': 'الدرجات الأخيرة',
    'total_exams': 'إجمالي الامتحانات',
    'completed_exams': 'الامتحانات المكتملة',
    'average_grade': 'متوسط الدرجات',
    'view_all': 'عرض الكل',

    // Exams
    'exam_details': 'تفاصيل الامتحان',
    'exam_results': 'نتائج الامتحان',
    'exam_date': 'تاريخ الامتحان',
    'exam_time': 'وقت الامتحان',
    'exam_duration': 'مدة الامتحان',
    'exam_location': 'مكان الامتحان',
    'exam_status': 'حالة الامتحان',
    'exam_type': 'نوع الامتحان',
    'no_exams': 'لا توجد امتحانات',
    'status_upcoming': 'قادم',
    'status_ongoing': 'جاري',
    'status_completed': 'مكتمل',
    'status_cancelled': 'ملغي',
    'midterm': 'اختبار نصفي',
    'final': 'اختبار نهائي',
    'quiz': 'اختبار قصير',

    // Grades
    'grade_details': 'تفاصيل الدرجة',
    'grades_chart': 'مخطط الدرجات',
    'your_grade': 'درجتك',
    'max_grade': 'الدرجة القصوى',
    'class_average': 'متوسط الصف',
    'grade_breakdown': 'تفصيل الدرجات',
    'no_grades': 'لا توجد درجات',
    'gpa': 'المعدل التراكمي',
    'semester_gpa': 'معدل الفصل',

    // Profile
    'edit_profile': 'تعديل الملف الشخصي',
    'change_password': 'تغيير كلمة المرور',
    'department': 'القسم',
    'level': 'المستوى',
    'academic_year': 'السنة الأكاديمية',

    // Settings
    'language': 'اللغة',
    'arabic': 'العربية',
    'english': 'English',
    'theme': 'المظهر',
    'light_mode': 'الوضع الفاتح',
    'dark_mode': 'الوضع الداكن',
    'system_mode': 'وضع النظام',
    'notifications': 'الإشعارات',
    'about': 'حول التطبيق',
    'version': 'الإصدار',
    'privacy_policy': 'سياسة الخصوصية',
    'terms_of_service': 'شروط الخدمة',

    // Common
    'loading': 'جاري التحميل...',
    'error': 'خطأ',
    'retry': 'إعادة المحاولة',
    'cancel': 'إلغاء',
    'save': 'حفظ',
    'delete': 'حذف',
    'edit': 'تعديل',
    'confirm': 'تأكيد',
    'yes': 'نعم',
    'no': 'لا',
    'ok': 'حسناً',
    'close': 'إغلاق',
    'search': 'بحث',
    'filter': 'تصفية',
    'sort': 'ترتيب',
    'refresh': 'تحديث',
    'no_data': 'لا توجد بيانات',
    'something_went_wrong': 'حدث خطأ ما',
    'try_again': 'حاول مرة أخرى',
    'minutes': 'دقيقة',
    'hours': 'ساعة',
    'days': 'يوم',

    // Validation
    'required_field': 'هذا الحقل مطلوب',
    'invalid_email': 'البريد الإلكتروني غير صالح',
    'invalid_password': 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
    'passwords_not_match': 'كلمات المرور غير متطابقة',
    'invalid_student_id': 'الرقم الجامعي غير صالح',
    'invalid_phone': 'رقم الهاتف غير صالح',
  };

  // English Strings
  static const Map<String, String> _enStrings = {
    // App
    'app_name': 'Smart Exam Attendance System',
    'app_short_name': 'SEAS',

    // Auth
    'login': 'Login',
    'register': 'Register',
    'logout': 'Logout',
    'email': 'Email',
    'password': 'Password',
    'confirm_password': 'Confirm Password',
    'forgot_password': 'Forgot Password?',
    'student_id': 'Student ID',
    'full_name': 'Full Name',
    'phone': 'Phone Number',
    'no_account': "Don't have an account?",
    'have_account': 'Already have an account?',
    'login_success': 'Login successful',
    'register_success': 'Registration successful',

    // Navigation
    'home': 'Home',
    'dashboard': 'Dashboard',
    'exams': 'Exams',
    'grades': 'Grades',
    'profile': 'Profile',
    'settings': 'Settings',

    // Dashboard
    'welcome_back': 'Welcome Back',
    'upcoming_exams': 'Upcoming Exams',
    'recent_grades': 'Recent Grades',
    'total_exams': 'Total Exams',
    'completed_exams': 'Completed Exams',
    'average_grade': 'Average Grade',
    'view_all': 'View All',

    // Exams
    'exam_details': 'Exam Details',
    'exam_results': 'Exam Results',
    'exam_date': 'Exam Date',
    'exam_time': 'Exam Time',
    'exam_duration': 'Duration',
    'exam_location': 'Location',
    'exam_status': 'Status',
    'exam_type': 'Type',
    'no_exams': 'No exams found',
    'status_upcoming': 'Upcoming',
    'status_ongoing': 'Ongoing',
    'status_completed': 'Completed',
    'status_cancelled': 'Cancelled',
    'midterm': 'Midterm',
    'final': 'Final',
    'quiz': 'Quiz',

    // Grades
    'grade_details': 'Grade Details',
    'grades_chart': 'Grades Chart',
    'your_grade': 'Your Grade',
    'max_grade': 'Max Grade',
    'class_average': 'Class Average',
    'grade_breakdown': 'Grade Breakdown',
    'no_grades': 'No grades found',
    'gpa': 'GPA',
    'semester_gpa': 'Semester GPA',

    // Profile
    'edit_profile': 'Edit Profile',
    'change_password': 'Change Password',
    'department': 'Department',
    'level': 'Level',
    'academic_year': 'Academic Year',

    // Settings
    'language': 'Language',
    'arabic': 'العربية',
    'english': 'English',
    'theme': 'Theme',
    'light_mode': 'Light Mode',
    'dark_mode': 'Dark Mode',
    'system_mode': 'System Mode',
    'notifications': 'Notifications',
    'about': 'About',
    'version': 'Version',
    'privacy_policy': 'Privacy Policy',
    'terms_of_service': 'Terms of Service',

    // Common
    'loading': 'Loading...',
    'error': 'Error',
    'retry': 'Retry',
    'cancel': 'Cancel',
    'save': 'Save',
    'delete': 'Delete',
    'edit': 'Edit',
    'confirm': 'Confirm',
    'yes': 'Yes',
    'no': 'No',
    'ok': 'OK',
    'close': 'Close',
    'search': 'Search',
    'filter': 'Filter',
    'sort': 'Sort',
    'refresh': 'Refresh',
    'no_data': 'No data available',
    'something_went_wrong': 'Something went wrong',
    'try_again': 'Try Again',
    'minutes': 'minutes',
    'hours': 'hours',
    'days': 'days',

    // Validation
    'required_field': 'This field is required',
    'invalid_email': 'Invalid email address',
    'invalid_password': 'Password must be at least 8 characters',
    'passwords_not_match': 'Passwords do not match',
    'invalid_student_id': 'Invalid student ID',
    'invalid_phone': 'Invalid phone number',
  };

  // Date formatting
  String formatDate(DateTime date) {
    return DateFormat.yMMMMd(locale.languageCode).format(date);
  }

  String formatTime(DateTime time) {
    return DateFormat.jm(locale.languageCode).format(time);
  }

  String formatDateTime(DateTime dateTime) {
    return DateFormat.yMMMMd(locale.languageCode).add_jm().format(dateTime);
  }

  String formatDuration(int minutes) {
    if (minutes < 60) {
      return '$minutes ${get('minutes')}';
    }
    final hours = minutes ~/ 60;
    final remainingMinutes = minutes % 60;
    if (remainingMinutes == 0) {
      return '$hours ${get('hours')}';
    }
    return '$hours ${get('hours')} و $remainingMinutes ${get('minutes')}';
  }
}

/// Localizations Delegate
class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['ar', 'en'].contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

/// Extension for easy access to localized strings
extension AppLocalizationsExtension on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);
  String tr(String key) => AppLocalizations.of(this).get(key);
}

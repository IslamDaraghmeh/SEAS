/// API Endpoints for SEAS Mobile App
class ApiEndpoints {
  ApiEndpoints._();

  // Auth Endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String refreshToken = '/auth/refresh';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String verifyEmail = '/auth/verify-email';
  static const String resendVerification = '/auth/resend-verification';

  // User Endpoints
  static const String profile = '/users/profile';
  static const String updateProfile = '/users/profile';
  static const String changePassword = '/users/change-password';
  static const String uploadAvatar = '/users/avatar';

  // Exam Endpoints
  static const String exams = '/exams';
  static String examById(String id) => '/exams/$id';
  static String examResults(String examId) => '/exams/$examId/results';
  static const String upcomingExams = '/exams/upcoming';
  static const String pastExams = '/exams/past';
  static const String examSchedule = '/exams/schedule';

  // Course Endpoints
  static const String courses = '/courses';
  static String courseById(String id) => '/courses/$id';
  static String courseExams(String courseId) => '/courses/$courseId/exams';
  static String courseGrades(String courseId) => '/courses/$courseId/grades';

  // Grade Endpoints
  static const String grades = '/grades';
  static String gradeById(String id) => '/grades/$id';
  static const String gradesSummary = '/grades/summary';
  static const String gpa = '/grades/gpa';
  static const String transcript = '/grades/transcript';

  // Attendance Endpoints
  static const String attendance = '/attendance';
  static String attendanceById(String id) => '/attendance/$id';
  static const String attendanceHistory = '/attendance/history';
  static String examAttendance(String examId) => '/attendance/exam/$examId';

  // Notification Endpoints
  static const String notifications = '/notifications';
  static String notificationById(String id) => '/notifications/$id';
  static const String markAllRead = '/notifications/mark-all-read';
  static const String notificationSettings = '/notifications/settings';

  // Settings Endpoints
  static const String settings = '/settings';
  static const String appSettings = '/settings/app';

  // Dashboard Endpoints
  static const String dashboardSummary = '/dashboard/summary';
  static const String dashboardStats = '/dashboard/stats';
}

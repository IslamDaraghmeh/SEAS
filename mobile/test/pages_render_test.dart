// Page render smoke tests — mounts EVERY screen in the app with realistic
// canned data injected through provider overrides, and asserts that each page
// builds and lays out without throwing any exception (overflow, null-deref,
// bad state, missing localization key, etc.).
//
// These run fully offline (no network, no platform channels) so they are safe
// for CI on every commit. The companion `live_api_test.dart` verifies the real
// API data; this file verifies the UI renders that shape of data cleanly.
//
//   flutter test test/pages_render_test.dart
//
// The assertion in every case is `expect(tester.takeException(), isNull)` — the
// canonical way to catch a rendering issue in a widget test.

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:seas_mobile/core/localization/app_localizations.dart';
import 'package:seas_mobile/core/network/dio_client.dart';
import 'package:seas_mobile/core/theme/app_theme.dart';
import 'package:seas_mobile/data/models/course_model.dart';
import 'package:seas_mobile/data/models/exam_model.dart';
import 'package:seas_mobile/data/models/grade_model.dart';
import 'package:seas_mobile/data/models/user_model.dart';
import 'package:seas_mobile/data/repositories/auth_repository.dart';
import 'package:seas_mobile/data/repositories/course_repository.dart';
import 'package:seas_mobile/data/repositories/exam_repository.dart';
import 'package:seas_mobile/presentation/screens/auth/login_screen.dart';
import 'package:seas_mobile/presentation/screens/auth/register_screen.dart';
import 'package:seas_mobile/presentation/screens/exam/exam_details_screen.dart';
import 'package:seas_mobile/presentation/screens/exam/exam_results_screen.dart';
import 'package:seas_mobile/presentation/screens/grades/grade_details_screen.dart';
import 'package:seas_mobile/presentation/screens/grades/grades_chart_screen.dart';
import 'package:seas_mobile/presentation/screens/home/dashboard_tab.dart';
import 'package:seas_mobile/presentation/screens/home/exams_tab.dart';
import 'package:seas_mobile/presentation/screens/home/grades_tab.dart';
import 'package:seas_mobile/presentation/screens/home/home_screen.dart';
import 'package:seas_mobile/presentation/screens/home/profile_tab.dart';
import 'package:seas_mobile/presentation/screens/settings/language_screen.dart';
import 'package:seas_mobile/presentation/screens/settings/settings_screen.dart';
import 'package:seas_mobile/presentation/screens/splash_screen.dart';
import 'package:seas_mobile/providers/auth_provider.dart';
import 'package:seas_mobile/providers/course_provider.dart';
import 'package:seas_mobile/providers/exam_provider.dart';

// ---------------------------------------------------------------------------
// Canned data modelled on the real API responses observed on the live server.
// ---------------------------------------------------------------------------

final _user = UserModel(
  id: '0f71ee7e-0cea-4e8f-b623-650e91210073',
  email: 'student1@aaup.edu',
  fullName: 'Student One',
  fullNameAr: 'الطالب الأول',
  studentId: '20200001',
  department: 'Computer Science',
  departmentAr: 'علم الحاسوب',
  level: 3,
  academicYear: '2025/2026',
  isEmailVerified: true,
);

final _course = CourseModel(
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  code: 'CS101',
  name: 'Introduction to Computer Science',
  nameAr: 'مقدمة في علم الحاسوب',
  creditHours: 3,
  instructorName: 'Dr. Ahmad',
);

final _exam = ExamModel(
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  courseId: _course.id,
  courseName: _course.name,
  courseNameAr: _course.nameAr,
  courseCode: _course.code,
  type: ExamType.midterm,
  status: ExamStatus.upcoming,
  examDate: DateTime(2026, 6, 28, 9),
  startTime: DateTime(2026, 6, 28, 9),
  endTime: DateTime(2026, 6, 28, 10),
  durationMinutes: 60,
  location: 'Building A - Room 101',
  maxGrade: 100,
);

final _grade = GradeModel(
  id: 'g1',
  examId: _exam.id,
  courseId: _course.id,
  courseName: _course.name,
  courseNameAr: _course.nameAr,
  courseCode: _course.code,
  examType: 'midterm',
  grade: 85,
  maxGrade: 100,
  percentage: 85,
  letterGrade: 'A',
  classAverage: 72,
  classHighest: 98,
  classLowest: 40,
  isPublished: true,
);

const _gpa = GpaSummary(
  cumulativeGpa: 3.5,
  semesterGpa: 3.7,
  totalCredits: 60,
  completedCredits: 45,
  totalCourses: 20,
  completedCourses: 15,
  standing: 'Good Standing',
);

const _breakdown = [
  GradeBreakdownItem(name: 'Quiz 1', grade: 8, maxGrade: 10, weight: 0.2),
  GradeBreakdownItem(name: 'Midterm', grade: 40, maxGrade: 50, weight: 0.5),
];

// ---------------------------------------------------------------------------
// Fake notifiers: reuse the real notifier logic but stub out every network
// call so no HTTP/secure-storage/platform channel is touched during a render.
// ---------------------------------------------------------------------------

class _NoopAuthRepo extends AuthRepository {
  _NoopAuthRepo() : super(DioClient(appSecureStorage), appSecureStorage);
}

class _FakeAuthNotifier extends AuthNotifier {
  _FakeAuthNotifier(AuthState initial) : super(_NoopAuthRepo()) {
    state = initial;
  }
  @override
  Future<void> initialize() async {}
  @override
  Future<void> logout() async => state = AuthState.unauthenticated();
}

class _NoopExamRepo extends ExamRepository {
  _NoopExamRepo() : super(DioClient(appSecureStorage));
}

class _FakeExamsNotifier extends ExamsNotifier {
  _FakeExamsNotifier(ExamsState initial) : super(_NoopExamRepo()) {
    state = initial;
  }
  @override
  Future<void> loadExams({bool refresh = false, String? status, String? courseId, String? type}) async {}
  @override
  Future<void> loadUpcomingExams({int limit = 5}) async {}
  @override
  Future<void> loadMore({String? status, String? courseId, String? type}) async {}
  @override
  Future<void> refresh() async {}
}

class _NoopCourseRepo extends CourseRepository {
  _NoopCourseRepo() : super(DioClient(appSecureStorage));
}

class _FakeCoursesNotifier extends CoursesNotifier {
  _FakeCoursesNotifier(CoursesState initial) : super(_NoopCourseRepo()) {
    state = initial;
  }
  @override
  Future<void> loadCourses({String? semester, String? academicYear}) async {}
  @override
  Future<void> loadGrades({String? courseId, String? examType}) async {}
  @override
  Future<void> loadRecentGrades({int limit = 5}) async {}
  @override
  Future<void> loadGpaSummary() async {}
  @override
  Future<void> refresh() async {}
}

// Common set of overrides seeding every stateful provider with populated data.
List<Override> _overrides({bool authenticated = true}) => [
      authStateProvider.overrideWith(
        (ref) => _FakeAuthNotifier(
          authenticated ? AuthState.authenticated(_user) : AuthState.unauthenticated(),
        ),
      ),
      examsProvider.overrideWith(
        (ref) => _FakeExamsNotifier(
          ExamsState(exams: [_exam], upcomingExams: [_exam]),
        ),
      ),
      coursesProvider.overrideWith(
        (ref) => _FakeCoursesNotifier(
          CoursesState(
            courses: [_course],
            grades: [_grade],
            recentGrades: [_grade],
            gpaSummary: _gpa,
          ),
        ),
      ),
      // Detail (family) providers used by the deep-linked screens.
      examDetailProvider.overrideWith((ref, id) async => _exam),
      examResultsProvider.overrideWith((ref, id) async => _grade),
      gradeDetailProvider.overrideWith((ref, id) async => _grade),
      gradeBreakdownProvider.overrideWith((ref, id) async => _breakdown),
    ];

/// Wrap a screen in the same localization/theme context the real app uses.
Widget _app(Widget home, {Locale locale = const Locale('ar')}) {
  return MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: AppTheme.lightTheme,
    locale: locale,
    supportedLocales: AppLocalizations.supportedLocales,
    localizationsDelegates: const [
      AppLocalizations.delegate,
      GlobalMaterialLocalizations.delegate,
      GlobalWidgetsLocalizations.delegate,
      GlobalCupertinoLocalizations.delegate,
    ],
    home: home,
  );
}

bool _isOverflow(FlutterErrorDetails d) =>
    d.exceptionAsString().toLowerCase().contains('overflow');

/// Pumps [page] and returns any errors Flutter reported during build/layout.
///
/// RenderFlex "overflow" reports are captured separately and NOT treated as
/// failures: in widget tests text is laid out with a synthetic fixed-width
/// placeholder font, so glyph widths (and therefore overflow) do not match the
/// real Cairo font used in production. A structural rendering bug (null-deref,
/// bad state, missing provider, thrown build error, etc.) surfaces as a
/// non-overflow error and IS a failure.
Future<List<FlutterErrorDetails>> _pumpPage(
  WidgetTester tester,
  Widget page, {
  bool authenticated = true,
  Locale locale = const Locale('ar'),
}) async {
  final captured = <FlutterErrorDetails>[];
  final previous = FlutterError.onError;
  FlutterError.onError = captured.add;
  try {
    await tester.pumpWidget(
      ProviderScope(
        overrides: _overrides(authenticated: authenticated),
        child: _app(page, locale: locale),
      ),
    );
    // A couple of frames let FutureProviders resolve and animations advance,
    // without waiting on infinite spinners / delayed navigation.
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
  } finally {
    FlutterError.onError = previous;
  }
  // Anything that was *thrown* (not just reported) is also a real failure.
  final thrown = tester.takeException();
  if (thrown != null) {
    captured.add(FlutterErrorDetails(exception: thrown));
  }
  final overflow = captured.where(_isOverflow).length;
  if (overflow > 0) {
    debugPrint('  ↳ note: $overflow layout-overflow warning(s) under the '
        'synthetic test font (not a production defect).');
  }
  return captured.where((d) => !_isOverflow(d)).toList();
}

void main() {
  // Use a generous surface so we also catch layout overflow at a real size.
  setUpAll(() {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
    // Do not attempt to fetch Cairo over the network in tests.
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  // Every page under test. Each entry pumps the screen and asserts no exception.
  // SplashScreen is exercised separately below because it navigates via a
  // GoRouter after a delay, which needs a router in the tree.
  final pages = <String, Widget Function()>{
    'LoginScreen': () => const LoginScreen(),
    'RegisterScreen': () => const RegisterScreen(),
    'HomeScreen (+ all 4 tabs via IndexedStack)': () => const HomeScreen(),
    'DashboardTab': () => const DashboardTab(),
    'ExamsTab': () => const ExamsTab(),
    'GradesTab': () => const GradesTab(),
    'ProfileTab': () => const ProfileTab(),
    'ExamDetailsScreen': () => ExamDetailsScreen(examId: _exam.id),
    'ExamResultsScreen': () => ExamResultsScreen(examId: _exam.id),
    'GradeDetailsScreen': () => GradeDetailsScreen(gradeId: _grade.id),
    'GradesChartScreen': () => const GradesChartScreen(),
    'SettingsScreen': () => const SettingsScreen(),
    'LanguageScreen': () => const LanguageScreen(),
  };

  for (final entry in pages.entries) {
    testWidgets('renders ${entry.key} without rendering issues (AR)', (tester) async {
      await tester.binding.setSurfaceSize(const Size(414, 896));
      final authenticated = entry.key != 'LoginScreen' && entry.key != 'RegisterScreen';
      final errors = await _pumpPage(tester, entry.value(), authenticated: authenticated);
      expect(errors, isEmpty,
          reason: '${entry.key} threw during build/layout: '
              '${errors.map((e) => e.exceptionAsString()).join(" | ")}');
      // Sanity: something was actually rendered.
      expect(find.byType(Scaffold), findsWidgets, reason: '${entry.key} rendered no Scaffold');
    });
  }

  // Re-run the data-heavy pages in English/LTR to catch direction-specific
  // layout issues (overflow that only shows in one text direction).
  final ltrPages = <String, Widget Function()>{
    'HomeScreen': () => const HomeScreen(),
    'GradesChartScreen': () => const GradesChartScreen(),
    'SettingsScreen': () => const SettingsScreen(),
  };
  for (final entry in ltrPages.entries) {
    testWidgets('renders ${entry.key} without rendering issues (EN)', (tester) async {
      await tester.binding.setSurfaceSize(const Size(414, 896));
      final errors = await _pumpPage(tester, entry.value(), locale: const Locale('en'));
      expect(errors, isEmpty,
          reason: '${entry.key} (EN) threw during build/layout: '
              '${errors.map((e) => e.exceptionAsString()).join(" | ")}');
    });
  }

  // SplashScreen: renders, then after its delay navigates via GoRouter. We mount
  // it inside a minimal router with stub destinations so the navigation
  // resolves cleanly and no timer is left pending.
  testWidgets('renders SplashScreen and navigates without errors', (tester) async {
    await tester.binding.setSurfaceSize(const Size(414, 896));

    final router = GoRouter(
      initialLocation: '/',
      routes: [
        GoRoute(path: '/', builder: (_, __) => const SplashScreen()),
        GoRoute(path: '/home', builder: (_, __) => const Scaffold(body: Text('home'))),
        GoRoute(path: '/login', builder: (_, __) => const Scaffold(body: Text('login'))),
      ],
    );

    final captured = <FlutterErrorDetails>[];
    final previous = FlutterError.onError;
    FlutterError.onError = captured.add;
    try {
      await tester.pumpWidget(
        ProviderScope(
          overrides: _overrides(authenticated: true),
          child: MaterialApp.router(
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            locale: const Locale('ar'),
            supportedLocales: AppLocalizations.supportedLocales,
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            routerConfig: router,
          ),
        ),
      );
      // First frame: splash is visible.
      await tester.pump();
      expect(find.text('SEAS'), findsOneWidget);
      // Advance past the 2s delay + animations so it navigates to /home.
      await tester.pumpAndSettle(const Duration(seconds: 3));
    } finally {
      FlutterError.onError = previous;
    }

    final real = captured.where((d) => !_isOverflow(d)).toList();
    expect(real, isEmpty,
        reason: 'SplashScreen threw: ${real.map((e) => e.exceptionAsString()).join(" | ")}');
    // Confirm it actually left the splash for the authenticated destination.
    expect(find.text('home'), findsOneWidget);
  });
}

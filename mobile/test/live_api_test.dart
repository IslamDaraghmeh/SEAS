// Live API smoke test — hits the real deployed domain and verifies that every
// student-facing endpoint the app relies on actually returns data.
//
// It logs in once with a seeded student account, then exercises each endpoint,
// asserting the HTTP status AND the shape of the JSON that comes back so a
// silently-empty or malformed response is caught.
//
// Run against the default production domain:
//   flutter test test/live_api_test.dart
//
// Override target/credentials without editing the file:
//   flutter test test/live_api_test.dart \
//     --dart-define=API_BASE_URL=https://daraghmeh.online \
//     --dart-define=API_PREFIX=/api \
//     --dart-define=TEST_EMAIL=student1@aaup.edu \
//     --dart-define=TEST_PASSWORD=student1
//
// NOTE: This test requires network access and the backend to be running. It is
// intentionally kept separate from the offline widget tests so CI can choose to
// run it in a "smoke"/nightly job rather than on every commit.

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:seas_mobile/core/constants/api_constants.dart';
import 'package:seas_mobile/data/models/course_model.dart';
import 'package:seas_mobile/data/models/exam_model.dart';
import 'package:seas_mobile/data/models/grade_model.dart';
import 'package:seas_mobile/data/models/user_model.dart';

const _email = String.fromEnvironment('TEST_EMAIL', defaultValue: 'student1@aaup.edu');
const _password = String.fromEnvironment('TEST_PASSWORD', defaultValue: 'student1');

void main() {
  final apiRoot = ApiConstants.baseUrl + ApiConstants.apiPrefix;

  late Dio dio;
  String? accessToken;

  setUpAll(() {
    dio = Dio(
      BaseOptions(
        baseUrl: apiRoot,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 20),
        // Never throw on non-2xx — we assert on statusCode ourselves so the
        // failure messages are readable instead of raw DioExceptions.
        validateStatus: (_) => true,
        headers: {'Content-Type': 'application/json'},
      ),
    );
  });

  /// Pretty helper so a failure tells you exactly which call broke.
  void expectStatus(Response res, int expected, String label) {
    expect(
      res.statusCode,
      expected,
      reason: '$label -> ${res.requestOptions.method} ${res.requestOptions.uri}\n'
          'Got ${res.statusCode}. Body: ${res.data}',
    );
  }

  Options auth() => Options(headers: {'Authorization': 'Bearer $accessToken'});

  test('Reachability: GET /health returns 200', () async {
    // /health lives at the domain root (outside /api), so hit it directly.
    final res = await Dio(BaseOptions(validateStatus: (_) => true))
        .get('${ApiConstants.baseUrl}/health');
    expectStatus(res, 200, 'health');
  });

  test('Auth: POST /auth/login returns tokens + user', () async {
    final res = await dio.post('/auth/login', data: {
      'email': _email,
      'password': _password,
    });
    expectStatus(res, 200, 'login');

    final body = res.data as Map<String, dynamic>;
    expect(body['accessToken'], isA<String>(), reason: 'missing accessToken');
    expect((body['accessToken'] as String).isNotEmpty, isTrue);
    expect(body['refreshToken'], isA<String>(), reason: 'missing refreshToken');

    final user = body['user'] as Map<String, dynamic>;
    expect(user['id'], isA<String>());
    expect(user['email'], _email);
    expect(user['role'], 'STUDENT');

    accessToken = body['accessToken'] as String;
  });

  test('Auth guard: unauthenticated request is rejected (401)', () async {
    final res = await dio.get('/exams/student');
    expectStatus(res, 401, 'exams/student (no token)');
  });

  test('Exams: GET /exams/student returns a list of exams with data', () async {
    expect(accessToken, isNotNull, reason: 'login must succeed first');
    final res = await dio.get('/exams/student', options: auth());
    expectStatus(res, 200, 'exams/student');

    final data = res.data;
    expect(data, isA<List>(), reason: 'expected a JSON array');
    final list = data as List;
    // Seeded DB has exams for student1; verify the objects carry real fields.
    if (list.isNotEmpty) {
      final exam = list.first as Map<String, dynamic>;
      expect(exam['id'], isA<String>());
      expect(exam.containsKey('titleEn') || exam.containsKey('titleAr'), isTrue,
          reason: 'exam is missing a title field: ${exam.keys}');
      expect(exam['status'], isA<String>());
    }
  });

  test('Exams: GET /exams/available returns paginated {data: [...]}', () async {
    final res = await dio.get('/exams/available', options: auth());
    expectStatus(res, 200, 'exams/available');

    final body = res.data as Map<String, dynamic>;
    expect(body['data'], isA<List>(), reason: 'expected a data[] array');
    for (final item in (body['data'] as List)) {
      final exam = item as Map<String, dynamic>;
      expect(exam['id'], isA<String>());
    }
  });

  test('Exams: GET /exams/results returns {data, meta}', () async {
    final res = await dio.get('/exams/results', options: auth());
    expectStatus(res, 200, 'exams/results');

    final body = res.data as Map<String, dynamic>;
    expect(body['data'], isA<List>());
    expect(body['meta'], isA<Map>(), reason: 'expected pagination meta');
    final meta = body['meta'] as Map<String, dynamic>;
    expect(meta['total'], isA<int>());
    expect(meta['page'], isA<int>());
  });

  test('Attempts: GET /attempts/my-attempts returns a list', () async {
    final res = await dio.get('/attempts/my-attempts', options: auth());
    expectStatus(res, 200, 'attempts/my-attempts');
    expect(res.data, isA<List>());
  });

  test('Parse: real /exams/student rows map cleanly to ExamModel', () async {
    final res = await dio.get('/exams/student', options: auth());
    expectStatus(res, 200, 'exams/student');
    final rows = (res.data as List).cast<Map<String, dynamic>>();
    expect(rows, isNotEmpty, reason: 'student1 should have seeded exams');
    for (final row in rows) {
      final exam = ExamModel.fromJson(row); // must not throw
      expect(exam.id, isNotEmpty);
      expect(exam.courseName, isNotEmpty,
          reason: 'exam ${exam.id} rendered an empty title/course name');
      expect(exam.durationMinutes, greaterThan(0));
      // endTime is derived from duration when absent — must stay ordered.
      expect(exam.endTime.isAfter(exam.startTime) ||
          exam.endTime.isAtSameMomentAs(exam.startTime), isTrue);
    }
  });

  test('Parse: real /exams/available {data} rows map cleanly to ExamModel', () async {
    final res = await dio.get('/exams/available', options: auth());
    expectStatus(res, 200, 'exams/available');
    final rows = ((res.data as Map<String, dynamic>)['data'] as List)
        .cast<Map<String, dynamic>>();
    for (final row in rows) {
      final exam = ExamModel.fromJson(row);
      expect(exam.id, isNotEmpty);
      expect(exam.courseName, isNotEmpty);
    }
  });

  test('Profile: GET /auth/me maps to a UserModel with student data', () async {
    final res = await dio.get('/auth/me', options: auth());
    expectStatus(res, 200, 'auth/me');
    final body = res.data as Map<String, dynamic>;
    expect(body['student'], isA<Map>(), reason: 'no nested student profile');

    final user = UserModel.fromJson(body);
    expect(user.email, _email);
    expect(user.fullName, isNotEmpty, reason: 'student name not surfaced');
    expect(user.studentId, isNotEmpty, reason: 'student number not surfaced');

    // The student *entity* id (needed for /courses/student/:id) is present.
    final studentId = (body['student'] as Map)['id'];
    expect(studentId, isA<String>());
  });

  test('Courses: GET /courses/student/:id maps to CourseModel with names', () async {
    final me = await dio.get('/auth/me', options: auth());
    final studentId = (me.data['student'] as Map)['id'] as String;

    final res = await dio.get('/courses/student/$studentId', options: auth());
    expectStatus(res, 200, 'courses/student/:id');
    final rows = (res.data as List).cast<Map<String, dynamic>>();
    expect(rows, isNotEmpty, reason: 'student1 should be enrolled in courses');
    for (final row in rows) {
      final course = CourseModel.fromJson(row);
      expect(course.id, isNotEmpty);
      expect(course.name, isNotEmpty, reason: 'course name (nameEn) not mapped');
      expect(course.code, isNotEmpty, reason: 'course code not mapped');
    }
  });

  test('Grades: GET /exams/results rows map cleanly to GradeModel', () async {
    final res = await dio.get('/exams/results', options: auth());
    expectStatus(res, 200, 'exams/results');
    final rows = ((res.data as Map<String, dynamic>)['data'] as List)
        .cast<Map<String, dynamic>>();
    // May be empty (no submitted attempts yet) — assert the parse when present.
    for (final row in rows) {
      final grade = GradeModel.fromJson(row);
      expect(grade.id, isNotEmpty);
      expect(grade.maxGrade, greaterThan(0));
      expect(grade.percentage, inInclusiveRange(0, 100));
    }
  });
}

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_endpoints.dart';
import '../../core/network/dio_client.dart';
import '../models/course_model.dart';
import '../models/grade_model.dart';

/// Course Repository Provider
final courseRepositoryProvider = Provider<CourseRepository>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return CourseRepository(dioClient);
});

/// Course Repository for handling course-related API calls
class CourseRepository {
  final DioClient _dioClient;

  CourseRepository(this._dioClient);

  /// Get all courses
  Future<List<CourseModel>> getCourses({
    int page = 1,
    int limit = 20,
    String? semester,
    String? academicYear,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (semester != null) queryParams['semester'] = semester;
      if (academicYear != null) queryParams['academic_year'] = academicYear;

      final response = await _dioClient.get(
        ApiEndpoints.courses,
        queryParameters: queryParams,
      );

      final List<dynamic> data =
          response.data['data'] ?? response.data['courses'] ?? [];
      return data.map((json) => CourseModel.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get course by ID
  Future<CourseModel> getCourseById(String courseId) async {
    try {
      final response = await _dioClient.get(
        ApiEndpoints.courseById(courseId),
      );

      return CourseModel.fromJson(
          response.data['data'] ?? response.data['course'] ?? response.data);
    } catch (e) {
      rethrow;
    }
  }

  /// Get courses with grades
  Future<List<CourseWithGrade>> getCoursesWithGrades({
    String? semester,
    String? academicYear,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (semester != null) queryParams['semester'] = semester;
      if (academicYear != null) queryParams['academic_year'] = academicYear;

      final response = await _dioClient.get(
        '${ApiEndpoints.courses}/with-grades',
        queryParameters: queryParams,
      );

      final List<dynamic> data =
          response.data['data'] ?? response.data['courses'] ?? [];
      return data.map((json) => CourseWithGrade.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get course grades
  Future<List<GradeModel>> getCourseGrades(String courseId) async {
    try {
      final response = await _dioClient.get(
        ApiEndpoints.courseGrades(courseId),
      );

      final List<dynamic> data =
          response.data['data'] ?? response.data['grades'] ?? [];
      return data.map((json) => GradeModel.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get all grades
  Future<List<GradeModel>> getGrades({
    int page = 1,
    int limit = 20,
    String? courseId,
    String? examType,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (courseId != null) queryParams['course_id'] = courseId;
      if (examType != null) queryParams['exam_type'] = examType;

      final response = await _dioClient.get(
        ApiEndpoints.grades,
        queryParameters: queryParams,
      );

      final List<dynamic> data =
          response.data['data'] ?? response.data['grades'] ?? [];
      return data.map((json) => GradeModel.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get grade by ID
  Future<GradeModel> getGradeById(String gradeId) async {
    try {
      final response = await _dioClient.get(
        ApiEndpoints.gradeById(gradeId),
      );

      return GradeModel.fromJson(
          response.data['data'] ?? response.data['grade'] ?? response.data);
    } catch (e) {
      rethrow;
    }
  }

  /// Get recent grades
  Future<List<GradeModel>> getRecentGrades({int limit = 5}) async {
    try {
      final response = await _dioClient.get(
        ApiEndpoints.grades,
        queryParameters: {
          'limit': limit,
          'sort': 'created_at',
          'order': 'desc',
        },
      );

      final List<dynamic> data =
          response.data['data'] ?? response.data['grades'] ?? [];
      return data.map((json) => GradeModel.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get grades summary
  Future<GradesSummary> getGradesSummary({
    String? semester,
    String? academicYear,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (semester != null) queryParams['semester'] = semester;
      if (academicYear != null) queryParams['academic_year'] = academicYear;

      final response = await _dioClient.get(
        ApiEndpoints.gradesSummary,
        queryParameters: queryParams,
      );

      return GradesSummary.fromJson(response.data['data'] ?? response.data);
    } catch (e) {
      rethrow;
    }
  }

  /// Get GPA
  Future<GpaSummary> getGpa() async {
    try {
      final response = await _dioClient.get(ApiEndpoints.gpa);
      return GpaSummary.fromJson(response.data['data'] ?? response.data);
    } catch (e) {
      rethrow;
    }
  }

  /// Get grade breakdown
  Future<List<GradeBreakdownItem>> getGradeBreakdown(String gradeId) async {
    try {
      final response = await _dioClient.get(
        '${ApiEndpoints.gradeById(gradeId)}/breakdown',
      );

      final List<dynamic> data =
          response.data['data'] ?? response.data['breakdown'] ?? [];
      return data.map((json) => GradeBreakdownItem.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get transcript
  Future<TranscriptData> getTranscript() async {
    try {
      final response = await _dioClient.get(ApiEndpoints.transcript);
      return TranscriptData.fromJson(response.data['data'] ?? response.data);
    } catch (e) {
      rethrow;
    }
  }
}

/// Grades Summary Model
class GradesSummary {
  final double averageGrade;
  final double highestGrade;
  final double lowestGrade;
  final int totalGrades;
  final int passedGrades;
  final int failedGrades;
  final Map<String, int> gradeDistribution;

  GradesSummary({
    required this.averageGrade,
    required this.highestGrade,
    required this.lowestGrade,
    required this.totalGrades,
    required this.passedGrades,
    required this.failedGrades,
    required this.gradeDistribution,
  });

  factory GradesSummary.fromJson(Map<String, dynamic> json) {
    return GradesSummary(
      averageGrade:
          (json['average_grade'] ?? json['averageGrade'] ?? 0).toDouble(),
      highestGrade:
          (json['highest_grade'] ?? json['highestGrade'] ?? 0).toDouble(),
      lowestGrade:
          (json['lowest_grade'] ?? json['lowestGrade'] ?? 0).toDouble(),
      totalGrades: json['total_grades'] ?? json['totalGrades'] ?? 0,
      passedGrades: json['passed_grades'] ?? json['passedGrades'] ?? 0,
      failedGrades: json['failed_grades'] ?? json['failedGrades'] ?? 0,
      gradeDistribution:
          Map<String, int>.from(json['grade_distribution'] ?? {}),
    );
  }

  double get passRate {
    if (totalGrades == 0) return 0;
    return (passedGrades / totalGrades) * 100;
  }
}

/// Transcript Data Model
class TranscriptData {
  final GpaSummary gpa;
  final List<SemesterGrades> semesters;

  TranscriptData({
    required this.gpa,
    required this.semesters,
  });

  factory TranscriptData.fromJson(Map<String, dynamic> json) {
    return TranscriptData(
      gpa: GpaSummary.fromJson(json['gpa'] ?? {}),
      semesters: (json['semesters'] as List<dynamic>?)
              ?.map((s) => SemesterGrades.fromJson(s))
              .toList() ??
          [],
    );
  }
}

/// Semester Grades Model
class SemesterGrades {
  final String semester;
  final String academicYear;
  final double gpa;
  final int totalCredits;
  final List<CourseWithGrade> courses;

  SemesterGrades({
    required this.semester,
    required this.academicYear,
    required this.gpa,
    required this.totalCredits,
    required this.courses,
  });

  factory SemesterGrades.fromJson(Map<String, dynamic> json) {
    return SemesterGrades(
      semester: json['semester'] ?? '',
      academicYear: json['academic_year'] ?? json['academicYear'] ?? '',
      gpa: (json['gpa'] ?? 0).toDouble(),
      totalCredits: json['total_credits'] ?? json['totalCredits'] ?? 0,
      courses: (json['courses'] as List<dynamic>?)
              ?.map((c) => CourseWithGrade.fromJson(c))
              .toList() ??
          [],
    );
  }
}

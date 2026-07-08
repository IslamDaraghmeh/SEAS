import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_endpoints.dart';
import '../../core/network/dio_client.dart';
import '../models/exam_model.dart';
import '../models/grade_model.dart';

/// Exam Repository Provider
final examRepositoryProvider = Provider<ExamRepository>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return ExamRepository(dioClient);
});

/// Exam Repository for handling exam-related API calls
class ExamRepository {
  final DioClient _dioClient;

  ExamRepository(this._dioClient);

  /// Parse a response body that may be a raw List, a `{data: [...]}` envelope,
  /// or `{exams: [...]}` into a list of [ExamModel].
  List<ExamModel> _parseExamList(dynamic body) {
    final List<dynamic> data = body is List
        ? body
        : (body is Map<String, dynamic>
            ? (body['data'] ?? body['exams'] ?? [])
            : []);
    return data
        .whereType<Map<String, dynamic>>()
        .map(ExamModel.fromJson)
        .toList();
  }

  /// Get the exams assigned to the current student.
  ///
  /// Backend: `GET /exams/student` returns a raw JSON array. The optional
  /// [status] filter is applied client-side because the endpoint is unfiltered.
  Future<List<ExamModel>> getExams({
    int page = 1,
    int limit = 20,
    String? status,
    String? courseId,
    String? type,
  }) async {
    try {
      final response = await _dioClient.get(ApiEndpoints.studentExams);
      var exams = _parseExamList(response.data);
      if (courseId != null) {
        exams = exams.where((e) => e.courseId == courseId).toList();
      }
      return exams;
    } catch (e) {
      rethrow;
    }
  }

  /// Get exam by ID
  Future<ExamModel> getExamById(String examId) async {
    try {
      final response = await _dioClient.get(
        ApiEndpoints.examById(examId),
      );

      return ExamModel.fromJson(response.data['data'] ?? response.data['exam'] ?? response.data);
    } catch (e) {
      rethrow;
    }
  }

  /// Get upcoming/available exams for the student.
  ///
  /// Backend: `GET /exams/available` returns `{ data: [...], meta: {...} }`.
  Future<List<ExamModel>> getUpcomingExams({int limit = 5}) async {
    try {
      final response = await _dioClient.get(ApiEndpoints.availableExams);
      final exams = _parseExamList(response.data);
      return limit > 0 && exams.length > limit
          ? exams.sublist(0, limit)
          : exams;
    } catch (e) {
      rethrow;
    }
  }

  /// Get past exams
  Future<List<ExamModel>> getPastExams({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _dioClient.get(ApiEndpoints.pastExams);
      return _parseExamList(response.data);
    } catch (e) {
      rethrow;
    }
  }

  /// Get exam schedule
  Future<List<ExamModel>> getExamSchedule({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (startDate != null) {
        queryParams['start_date'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        queryParams['end_date'] = endDate.toIso8601String();
      }

      final response = await _dioClient.get(
        ApiEndpoints.examSchedule,
        queryParameters: queryParams.isEmpty ? null : queryParams,
      );

      return _parseExamList(response.data);
    } catch (e) {
      rethrow;
    }
  }

  /// Get exam results
  Future<GradeModel> getExamResults(String examId) async {
    try {
      final response = await _dioClient.get(
        ApiEndpoints.examResults(examId),
      );

      return GradeModel.fromJson(response.data['data'] ?? response.data['result'] ?? response.data);
    } catch (e) {
      rethrow;
    }
  }

  /// Get exams by course
  Future<List<ExamModel>> getExamsByCourse(String courseId) async {
    try {
      final response = await _dioClient.get(
        ApiEndpoints.courseExams(courseId),
      );

      final List<dynamic> data = response.data['data'] ?? response.data['exams'] ?? [];
      return data.map((json) => ExamModel.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Get exam statistics
  Future<ExamStatistics> getExamStatistics() async {
    try {
      final response = await _dioClient.get(
        '${ApiEndpoints.exams}/statistics',
      );

      return ExamStatistics.fromJson(response.data['data'] ?? response.data);
    } catch (e) {
      rethrow;
    }
  }

  /// Mark exam attendance (for check-in)
  Future<void> markAttendance(String examId, {
    double? latitude,
    double? longitude,
  }) async {
    try {
      await _dioClient.post(
        ApiEndpoints.examAttendance(examId),
        data: {
          if (latitude != null) 'latitude': latitude,
          if (longitude != null) 'longitude': longitude,
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      rethrow;
    }
  }
}

/// Exam Statistics Model
class ExamStatistics {
  final int totalExams;
  final int upcomingExams;
  final int completedExams;
  final int cancelledExams;
  final double averageScore;
  final int passedExams;
  final int failedExams;

  ExamStatistics({
    required this.totalExams,
    required this.upcomingExams,
    required this.completedExams,
    required this.cancelledExams,
    required this.averageScore,
    required this.passedExams,
    required this.failedExams,
  });

  factory ExamStatistics.fromJson(Map<String, dynamic> json) {
    return ExamStatistics(
      totalExams: json['total_exams'] ?? json['totalExams'] ?? 0,
      upcomingExams: json['upcoming_exams'] ?? json['upcomingExams'] ?? 0,
      completedExams: json['completed_exams'] ?? json['completedExams'] ?? 0,
      cancelledExams: json['cancelled_exams'] ?? json['cancelledExams'] ?? 0,
      averageScore: (json['average_score'] ?? json['averageScore'] ?? 0).toDouble(),
      passedExams: json['passed_exams'] ?? json['passedExams'] ?? 0,
      failedExams: json['failed_exams'] ?? json['failedExams'] ?? 0,
    );
  }

  double get passRate {
    final total = passedExams + failedExams;
    if (total == 0) return 0;
    return (passedExams / total) * 100;
  }
}

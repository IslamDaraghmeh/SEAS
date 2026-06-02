import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/course_model.dart';
import '../data/models/grade_model.dart';
import '../data/repositories/course_repository.dart';

/// Courses State
class CoursesState {
  final List<CourseModel> courses;
  final List<GradeModel> grades;
  final List<GradeModel> recentGrades;
  final GpaSummary? gpaSummary;
  final bool isLoading;
  final String? error;

  const CoursesState({
    this.courses = const [],
    this.grades = const [],
    this.recentGrades = const [],
    this.gpaSummary,
    this.isLoading = false,
    this.error,
  });

  CoursesState copyWith({
    List<CourseModel>? courses,
    List<GradeModel>? grades,
    List<GradeModel>? recentGrades,
    GpaSummary? gpaSummary,
    bool? isLoading,
    String? error,
  }) {
    return CoursesState(
      courses: courses ?? this.courses,
      grades: grades ?? this.grades,
      recentGrades: recentGrades ?? this.recentGrades,
      gpaSummary: gpaSummary ?? this.gpaSummary,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Courses Notifier
class CoursesNotifier extends StateNotifier<CoursesState> {
  final CourseRepository _courseRepository;

  CoursesNotifier(this._courseRepository) : super(const CoursesState());

  /// Load all courses
  Future<void> loadCourses({
    String? semester,
    String? academicYear,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final courses = await _courseRepository.getCourses(
        semester: semester,
        academicYear: academicYear,
      );
      state = state.copyWith(
        courses: courses,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Load all grades
  Future<void> loadGrades({
    String? courseId,
    String? examType,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final grades = await _courseRepository.getGrades(
        courseId: courseId,
        examType: examType,
      );
      state = state.copyWith(
        grades: grades,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Load recent grades
  Future<void> loadRecentGrades({int limit = 5}) async {
    try {
      final grades = await _courseRepository.getRecentGrades(limit: limit);
      state = state.copyWith(recentGrades: grades);
    } catch (e) {
      // Silently fail for recent grades
    }
  }

  /// Load GPA summary
  Future<void> loadGpaSummary() async {
    try {
      final gpa = await _courseRepository.getGpa();
      state = state.copyWith(gpaSummary: gpa);
    } catch (e) {
      // Silently fail for GPA
    }
  }

  /// Refresh all data
  Future<void> refresh() async {
    await Future.wait([
      loadCourses(),
      loadGrades(),
      loadRecentGrades(),
      loadGpaSummary(),
    ]);
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Courses Provider
final coursesProvider =
    StateNotifierProvider<CoursesNotifier, CoursesState>((ref) {
  final courseRepository = ref.watch(courseRepositoryProvider);
  return CoursesNotifier(courseRepository);
});

/// All Courses Provider
final allCoursesProvider = Provider<List<CourseModel>>((ref) {
  return ref.watch(coursesProvider).courses;
});

/// All Grades Provider
final allGradesProvider = Provider<List<GradeModel>>((ref) {
  return ref.watch(coursesProvider).grades;
});

/// Recent Grades Provider
final recentGradesProvider = Provider<List<GradeModel>>((ref) {
  return ref.watch(coursesProvider).recentGrades;
});

/// GPA Summary Provider
final gpaSummaryProvider = Provider<GpaSummary?>((ref) {
  return ref.watch(coursesProvider).gpaSummary;
});

/// Single Course Provider
final courseDetailProvider =
    FutureProvider.family<CourseModel, String>((ref, courseId) async {
  final courseRepository = ref.watch(courseRepositoryProvider);
  return courseRepository.getCourseById(courseId);
});

/// Course Grades Provider
final courseGradesProvider =
    FutureProvider.family<List<GradeModel>, String>((ref, courseId) async {
  final courseRepository = ref.watch(courseRepositoryProvider);
  return courseRepository.getCourseGrades(courseId);
});

/// Single Grade Provider
final gradeDetailProvider =
    FutureProvider.family<GradeModel, String>((ref, gradeId) async {
  final courseRepository = ref.watch(courseRepositoryProvider);
  return courseRepository.getGradeById(gradeId);
});

/// Grade Breakdown Provider
final gradeBreakdownProvider =
    FutureProvider.family<List<GradeBreakdownItem>, String>(
        (ref, gradeId) async {
  final courseRepository = ref.watch(courseRepositoryProvider);
  return courseRepository.getGradeBreakdown(gradeId);
});

/// Grades Summary Provider
final gradesSummaryProvider = FutureProvider.family<GradesSummary,
    ({String? semester, String? academicYear})>((ref, params) async {
  final courseRepository = ref.watch(courseRepositoryProvider);
  return courseRepository.getGradesSummary(
    semester: params.semester,
    academicYear: params.academicYear,
  );
});

/// Transcript Provider
final transcriptProvider = FutureProvider<TranscriptData>((ref) async {
  final courseRepository = ref.watch(courseRepositoryProvider);
  return courseRepository.getTranscript();
});

/// Courses with Grades Provider
final coursesWithGradesProvider = FutureProvider.family<List<CourseWithGrade>,
    ({String? semester, String? academicYear})>((ref, params) async {
  final courseRepository = ref.watch(courseRepositoryProvider);
  return courseRepository.getCoursesWithGrades(
    semester: params.semester,
    academicYear: params.academicYear,
  );
});

/// Average Grade Provider
final averageGradeProvider = Provider<double>((ref) {
  final grades = ref.watch(allGradesProvider);
  if (grades.isEmpty) return 0;

  final total = grades.fold<double>(0, (sum, grade) => sum + grade.percentage);
  return total / grades.length;
});

/// Grades by Course Provider
final gradesByCourseProvider =
    Provider.family<List<GradeModel>, String>((ref, courseId) {
  final grades = ref.watch(allGradesProvider);
  return grades.where((grade) => grade.courseId == courseId).toList();
});

/// Passing Grades Count Provider
final passingGradesCountProvider = Provider<int>((ref) {
  final grades = ref.watch(allGradesProvider);
  return grades.where((grade) => grade.isPassing).length;
});

/// Grade Statistics Provider
final gradeStatisticsProvider = Provider<GradeStatistics>((ref) {
  final grades = ref.watch(allGradesProvider);

  if (grades.isEmpty) {
    return const GradeStatistics(
      totalGrades: 0,
      averageGrade: 0,
      highestGrade: 0,
      lowestGrade: 0,
      passingGrades: 0,
      failingGrades: 0,
    );
  }

  final percentages = grades.map((g) => g.percentage).toList();
  final passing = grades.where((g) => g.isPassing).length;

  return GradeStatistics(
    totalGrades: grades.length,
    averageGrade: percentages.reduce((a, b) => a + b) / grades.length,
    highestGrade: percentages.reduce((a, b) => a > b ? a : b),
    lowestGrade: percentages.reduce((a, b) => a < b ? a : b),
    passingGrades: passing,
    failingGrades: grades.length - passing,
  );
});

/// Grade Statistics Class
class GradeStatistics {
  final int totalGrades;
  final double averageGrade;
  final double highestGrade;
  final double lowestGrade;
  final int passingGrades;
  final int failingGrades;

  const GradeStatistics({
    required this.totalGrades,
    required this.averageGrade,
    required this.highestGrade,
    required this.lowestGrade,
    required this.passingGrades,
    required this.failingGrades,
  });

  double get passRate {
    if (totalGrades == 0) return 0;
    return (passingGrades / totalGrades) * 100;
  }
}

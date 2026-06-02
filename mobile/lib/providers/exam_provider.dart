import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/exam_model.dart';
import '../data/models/grade_model.dart';
import '../data/repositories/exam_repository.dart';

/// Exams State
class ExamsState {
  final List<ExamModel> exams;
  final List<ExamModel> upcomingExams;
  final bool isLoading;
  final String? error;
  final int currentPage;
  final bool hasMore;

  const ExamsState({
    this.exams = const [],
    this.upcomingExams = const [],
    this.isLoading = false,
    this.error,
    this.currentPage = 1,
    this.hasMore = true,
  });

  ExamsState copyWith({
    List<ExamModel>? exams,
    List<ExamModel>? upcomingExams,
    bool? isLoading,
    String? error,
    int? currentPage,
    bool? hasMore,
  }) {
    return ExamsState(
      exams: exams ?? this.exams,
      upcomingExams: upcomingExams ?? this.upcomingExams,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      currentPage: currentPage ?? this.currentPage,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

/// Exams Notifier
class ExamsNotifier extends StateNotifier<ExamsState> {
  final ExamRepository _examRepository;

  ExamsNotifier(this._examRepository) : super(const ExamsState());

  /// Load all exams
  Future<void> loadExams({
    bool refresh = false,
    String? status,
    String? courseId,
    String? type,
  }) async {
    if (state.isLoading) return;

    final page = refresh ? 1 : state.currentPage;

    state = state.copyWith(
      isLoading: true,
      error: null,
      currentPage: page,
    );

    try {
      final exams = await _examRepository.getExams(
        page: page,
        status: status,
        courseId: courseId,
        type: type,
      );

      state = state.copyWith(
        exams: refresh ? exams : [...state.exams, ...exams],
        isLoading: false,
        currentPage: page + 1,
        hasMore: exams.length >= 20,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Load upcoming exams
  Future<void> loadUpcomingExams({int limit = 5}) async {
    try {
      final exams = await _examRepository.getUpcomingExams(limit: limit);
      state = state.copyWith(upcomingExams: exams);
    } catch (e) {
      // Silently fail for upcoming exams
    }
  }

  /// Refresh all data
  Future<void> refresh() async {
    await Future.wait([
      loadExams(refresh: true),
      loadUpcomingExams(),
    ]);
  }

  /// Load more exams
  Future<void> loadMore({
    String? status,
    String? courseId,
    String? type,
  }) async {
    if (!state.hasMore || state.isLoading) return;
    await loadExams(
      status: status,
      courseId: courseId,
      type: type,
    );
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Exams Provider
final examsProvider = StateNotifierProvider<ExamsNotifier, ExamsState>((ref) {
  final examRepository = ref.watch(examRepositoryProvider);
  return ExamsNotifier(examRepository);
});

/// Upcoming Exams Provider
final upcomingExamsProvider = Provider<List<ExamModel>>((ref) {
  return ref.watch(examsProvider).upcomingExams;
});

/// Single Exam Provider
final examDetailProvider =
    FutureProvider.family<ExamModel, String>((ref, examId) async {
  final examRepository = ref.watch(examRepositoryProvider);
  return examRepository.getExamById(examId);
});

/// Exam Results Provider
final examResultsProvider =
    FutureProvider.family<GradeModel, String>((ref, examId) async {
  final examRepository = ref.watch(examRepositoryProvider);
  return examRepository.getExamResults(examId);
});

/// Exam Statistics Provider
final examStatisticsProvider = FutureProvider<ExamStatistics>((ref) async {
  final examRepository = ref.watch(examRepositoryProvider);
  return examRepository.getExamStatistics();
});

/// Exams by Course Provider
final examsByCourseProvider =
    FutureProvider.family<List<ExamModel>, String>((ref, courseId) async {
  final examRepository = ref.watch(examRepositoryProvider);
  return examRepository.getExamsByCourse(courseId);
});

/// Exam Schedule Provider
final examScheduleProvider = FutureProvider.family<List<ExamModel>,
    ({DateTime? startDate, DateTime? endDate})>((ref, params) async {
  final examRepository = ref.watch(examRepositoryProvider);
  return examRepository.getExamSchedule(
    startDate: params.startDate,
    endDate: params.endDate,
  );
});

/// Today's Exams Provider
final todaysExamsProvider = Provider<List<ExamModel>>((ref) {
  final exams = ref.watch(examsProvider).exams;
  return exams.where((exam) => exam.isToday).toList();
});

/// Filtered Exams Provider
final filteredExamsProvider =
    Provider.family<List<ExamModel>, ExamFilter>((ref, filter) {
  final exams = ref.watch(examsProvider).exams;

  return exams.where((exam) {
    if (filter.status != null && exam.status != filter.status) {
      return false;
    }
    if (filter.type != null && exam.type != filter.type) {
      return false;
    }
    if (filter.courseId != null && exam.courseId != filter.courseId) {
      return false;
    }
    return true;
  }).toList();
});

/// Exam Filter
class ExamFilter {
  final ExamStatus? status;
  final ExamType? type;
  final String? courseId;

  const ExamFilter({
    this.status,
    this.type,
    this.courseId,
  });

  ExamFilter copyWith({
    ExamStatus? status,
    ExamType? type,
    String? courseId,
  }) {
    return ExamFilter(
      status: status ?? this.status,
      type: type ?? this.type,
      courseId: courseId ?? this.courseId,
    );
  }
}

/// Exam Filter Provider
final examFilterProvider = StateProvider<ExamFilter>((ref) {
  return const ExamFilter();
});

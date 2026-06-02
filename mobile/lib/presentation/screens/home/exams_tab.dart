import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/app_localizations.dart';
import '../../../data/models/exam_model.dart';
import '../../../providers/exam_provider.dart';
import '../../widgets/exam/exam_card.dart';
import '../../widgets/common/loading_widget.dart';
import '../../widgets/common/error_widget.dart' as app_error;
import '../../widgets/common/empty_state_widget.dart';

/// Exams Tab
class ExamsTab extends ConsumerStatefulWidget {
  const ExamsTab({super.key});

  @override
  ConsumerState<ExamsTab> createState() => _ExamsTabState();
}

class _ExamsTabState extends ConsumerState<ExamsTab>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final examsState = ref.watch(examsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.get('exams')),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: [
            Tab(text: l10n.get('view_all')),
            Tab(text: l10n.get('status_upcoming')),
            Tab(text: l10n.get('status_ongoing')),
            Tab(text: l10n.get('status_completed')),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildExamsList(examsState, null),
          _buildExamsList(examsState, ExamStatus.upcoming),
          _buildExamsList(examsState, ExamStatus.ongoing),
          _buildExamsList(examsState, ExamStatus.completed),
        ],
      ),
    );
  }

  Widget _buildExamsList(ExamsState state, ExamStatus? status) {
    final l10n = AppLocalizations.of(context);

    // Filter exams by status
    final filteredExams = status == null
        ? state.exams
        : state.exams.where((exam) => exam.status == status).toList();

    if (state.isLoading && filteredExams.isEmpty) {
      return const Center(child: LoadingWidget());
    }

    if (state.error != null && filteredExams.isEmpty) {
      return app_error.ErrorDisplayWidget(
        message: state.error!,
        onRetry: () => ref.read(examsProvider.notifier).loadExams(refresh: true),
      );
    }

    if (filteredExams.isEmpty) {
      return EmptyStateWidget(
        icon: Icons.assignment_outlined,
        title: l10n.get('no_exams'),
        subtitle: status != null
            ? _getEmptySubtitle(status, l10n)
            : l10n.get('no_data'),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(examsProvider.notifier).refresh(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: filteredExams.length + (state.hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index >= filteredExams.length) {
            // Load more indicator
            if (state.hasMore && !state.isLoading) {
              ref.read(examsProvider.notifier).loadMore();
            }
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: LoadingWidget(size: 24),
              ),
            );
          }

          final exam = filteredExams[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: ExamCard(
              exam: exam,
              onTap: () => context.push('/home/exam/${exam.id}'),
            ),
          );
        },
      ),
    );
  }

  String _getEmptySubtitle(ExamStatus status, AppLocalizations l10n) {
    switch (status) {
      case ExamStatus.upcoming:
        return l10n.locale.languageCode == 'ar'
            ? 'لا توجد امتحانات قادمة'
            : 'No upcoming exams';
      case ExamStatus.ongoing:
        return l10n.locale.languageCode == 'ar'
            ? 'لا توجد امتحانات جارية'
            : 'No ongoing exams';
      case ExamStatus.completed:
        return l10n.locale.languageCode == 'ar'
            ? 'لا توجد امتحانات مكتملة'
            : 'No completed exams';
      case ExamStatus.cancelled:
        return l10n.locale.languageCode == 'ar'
            ? 'لا توجد امتحانات ملغية'
            : 'No cancelled exams';
    }
  }
}

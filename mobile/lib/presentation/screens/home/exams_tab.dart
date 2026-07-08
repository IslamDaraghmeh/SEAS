import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../data/models/exam_model.dart';
import '../../../providers/exam_provider.dart';
import '../../widgets/exam/exam_card.dart';
import '../../widgets/common/loading_widget.dart';
import '../../widgets/common/error_widget.dart' as app_error;
import '../../widgets/common/empty_state_widget.dart';

/// Exams Tab
///
/// Shows the student's INCOMING exams (upcoming / not yet completed) as
/// read-only cards. Students can review the details but cannot open or start
/// an exam from the app yet, so the cards are intentionally not tappable.
class ExamsTab extends ConsumerWidget {
  const ExamsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(examsProvider);
    final isAr = l10n.locale.languageCode == 'ar';

    // Incoming = exams that have not finished (and were not cancelled).
    final incoming = state.exams
        .where((e) =>
            e.status != ExamStatus.completed &&
            e.status != ExamStatus.cancelled)
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.get('exams')),
      ),
      body: _buildBody(context, ref, state, incoming, l10n, isAr),
    );
  }

  Widget _buildBody(
    BuildContext context,
    WidgetRef ref,
    ExamsState state,
    List<ExamModel> incoming,
    AppLocalizations l10n,
    bool isAr,
  ) {
    if (state.isLoading && incoming.isEmpty) {
      return const Center(child: LoadingWidget());
    }

    if (state.error != null && incoming.isEmpty) {
      return app_error.ErrorDisplayWidget(
        message: state.error!,
        onRetry: () => ref.read(examsProvider.notifier).loadExams(refresh: true),
      );
    }

    if (incoming.isEmpty) {
      return EmptyStateWidget(
        icon: Icons.assignment_outlined,
        title: l10n.get('no_exams'),
        subtitle: isAr ? 'لا توجد امتحانات قادمة' : 'No upcoming exams',
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(examsProvider.notifier).refresh(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: incoming.length + 1,
        itemBuilder: (context, index) {
          if (index == 0) {
            return _buildInfoBanner(context, isAr);
          }
          final exam = incoming[index - 1];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: ExamCard(
              exam: exam,
              // View-only: students cannot open/access the exam yet.
              onTap: null,
            ),
          );
        },
      ),
    );
  }

  /// A small notice explaining the exams are view-only for now.
  Widget _buildInfoBanner(BuildContext context, bool isAr) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.info.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.info.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.lock_clock_outlined, color: AppColors.info),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              isAr
                  ? 'هذه امتحاناتك القادمة. يمكنك عرض التفاصيل فقط، وسيُفتح كل امتحان في موعده المحدد.'
                  : 'These are your upcoming exams. You can view the details only — each exam opens at its scheduled time.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
        ],
      ),
    );
  }
}

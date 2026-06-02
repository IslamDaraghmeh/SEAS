import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../data/models/exam_model.dart';
import '../../../providers/exam_provider.dart';
import '../../widgets/exam/exam_status_badge.dart';
import '../../widgets/common/loading_widget.dart';
import '../../widgets/common/error_widget.dart' as app_error;

/// Exam Details Screen
class ExamDetailsScreen extends ConsumerWidget {
  final String examId;

  const ExamDetailsScreen({super.key, required this.examId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final examAsync = ref.watch(examDetailProvider(examId));
    final theme = Theme.of(context);
    final locale = l10n.locale.languageCode;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.get('exam_details')),
      ),
      body: examAsync.when(
        loading: () => const Center(child: LoadingWidget()),
        error: (error, stack) => app_error.ErrorDisplayWidget(
          message: error.toString(),
          onRetry: () => ref.refresh(examDetailProvider(examId)),
        ),
        data: (exam) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.getExamStatusColor(exam.status.name),
                      AppColors.getExamStatusColor(exam.status.name)
                          .withOpacity(0.8),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            exam.getCourseName(locale),
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        ExamStatusBadge(status: exam.status),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      exam.courseCode,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white.withOpacity(0.9),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        locale == 'ar'
                            ? exam.type.toArabic()
                            : exam.type.toEnglish(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Details Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    _buildDetailRow(
                      context,
                      Icons.calendar_today_outlined,
                      l10n.get('exam_date'),
                      l10n.formatDate(exam.examDate),
                    ),
                    const Divider(height: 24),
                    _buildDetailRow(
                      context,
                      Icons.access_time_outlined,
                      l10n.get('exam_time'),
                      '${l10n.formatTime(exam.startTime)} - ${l10n.formatTime(exam.endTime)}',
                    ),
                    const Divider(height: 24),
                    _buildDetailRow(
                      context,
                      Icons.timer_outlined,
                      l10n.get('exam_duration'),
                      l10n.formatDuration(exam.durationMinutes),
                    ),
                    if (exam.fullLocation.isNotEmpty) ...[
                      const Divider(height: 24),
                      _buildDetailRow(
                        context,
                        Icons.location_on_outlined,
                        l10n.get('exam_location'),
                        exam.getLocation(locale) ?? exam.fullLocation,
                      ),
                    ],
                    const Divider(height: 24),
                    _buildDetailRow(
                      context,
                      Icons.grade_outlined,
                      l10n.get('max_grade'),
                      '${exam.maxGrade.toInt()}',
                    ),
                  ],
                ),
              ),

              // Instructions
              if (exam.getInstructions(locale) != null) ...[
                const SizedBox(height: 24),
                Text(
                  locale == 'ar' ? 'تعليمات' : 'Instructions',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: theme.colorScheme.outline.withOpacity(0.3),
                    ),
                  ),
                  child: Text(
                    exam.getInstructions(locale)!,
                    style: theme.textTheme.bodyMedium,
                  ),
                ),
              ],

              // Actions
              if (exam.status == ExamStatus.completed) ...[
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => context.push('/home/exam/$examId/results'),
                    icon: const Icon(Icons.assessment_outlined),
                    label: Text(l10n.get('exam_results')),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              ],

              // Days until exam
              if (exam.isUpcoming && exam.daysUntil >= 0) ...[
                const SizedBox(height: 24),
                Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Text(
                      exam.daysUntil == 0
                          ? (locale == 'ar' ? 'اليوم!' : 'Today!')
                          : exam.daysUntil == 1
                              ? (locale == 'ar' ? 'غدا' : 'Tomorrow')
                              : (locale == 'ar'
                                  ? 'متبقي ${exam.daysUntil} يوم'
                                  : '${exam.daysUntil} days remaining'),
                      style: TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
              ],

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(
    BuildContext context,
    IconData icon,
    String label,
    String value,
  ) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: theme.colorScheme.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            icon,
            size: 20,
            color: theme.colorScheme.primary,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: theme.textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

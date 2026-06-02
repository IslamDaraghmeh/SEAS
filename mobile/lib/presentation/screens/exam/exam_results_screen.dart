import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../providers/exam_provider.dart';
import '../../widgets/common/loading_widget.dart';
import '../../widgets/common/error_widget.dart' as app_error;

/// Exam Results Screen
class ExamResultsScreen extends ConsumerWidget {
  final String examId;

  const ExamResultsScreen({super.key, required this.examId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final resultsAsync = ref.watch(examResultsProvider(examId));
    final theme = Theme.of(context);
    final locale = l10n.locale.languageCode;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.get('exam_results')),
      ),
      body: resultsAsync.when(
        loading: () => const Center(child: LoadingWidget()),
        error: (error, stack) => app_error.ErrorDisplayWidget(
          message: error.toString(),
          onRetry: () => ref.refresh(examResultsProvider(examId)),
        ),
        data: (grade) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Score Circle
              Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    // Course Info
                    Text(
                      grade.getCourseName(locale),
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      grade.courseCode,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Score Circle
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        SizedBox(
                          width: 180,
                          height: 180,
                          child: CircularProgressIndicator(
                            value: grade.percentage / 100,
                            strokeWidth: 12,
                            backgroundColor:
                                theme.colorScheme.outline.withOpacity(0.2),
                            valueColor: AlwaysStoppedAnimation<Color>(
                              AppColors.getGradeColor(grade.percentage),
                            ),
                          ),
                        ),
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '${grade.percentage.toStringAsFixed(1)}%',
                              style: TextStyle(
                                fontSize: 36,
                                fontWeight: FontWeight.bold,
                                color:
                                    AppColors.getGradeColor(grade.percentage),
                              ),
                            ),
                            Text(
                              grade.calculatedLetterGrade,
                              style: TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color:
                                    AppColors.getGradeColor(grade.percentage),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Grade Details
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildScoreItem(
                          context,
                          l10n.get('your_grade'),
                          '${grade.grade.toStringAsFixed(1)}',
                        ),
                        Container(
                          width: 1,
                          height: 40,
                          color: theme.colorScheme.outline.withOpacity(0.3),
                        ),
                        _buildScoreItem(
                          context,
                          l10n.get('max_grade'),
                          '${grade.maxGrade.toStringAsFixed(0)}',
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Class Statistics
              if (grade.classAverage != null ||
                  grade.classHighest != null ||
                  grade.classLowest != null)
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
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        locale == 'ar' ? 'إحصائيات الصف' : 'Class Statistics',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (grade.classAverage != null)
                        _buildStatRow(
                          context,
                          Icons.trending_flat,
                          l10n.get('class_average'),
                          '${grade.classAverage!.toStringAsFixed(1)}',
                          AppColors.info,
                        ),
                      if (grade.classHighest != null) ...[
                        const Divider(height: 24),
                        _buildStatRow(
                          context,
                          Icons.arrow_upward,
                          locale == 'ar' ? 'أعلى درجة' : 'Highest',
                          '${grade.classHighest!.toStringAsFixed(1)}',
                          AppColors.success,
                        ),
                      ],
                      if (grade.classLowest != null) ...[
                        const Divider(height: 24),
                        _buildStatRow(
                          context,
                          Icons.arrow_downward,
                          locale == 'ar' ? 'أدنى درجة' : 'Lowest',
                          '${grade.classLowest!.toStringAsFixed(1)}',
                          AppColors.error,
                        ),
                      ],
                    ],
                  ),
                ),

              // Performance Indicator
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: grade.isAboveAverage
                      ? AppColors.success.withOpacity(0.1)
                      : grade.isPassing
                          ? AppColors.warning.withOpacity(0.1)
                          : AppColors.error.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: grade.isAboveAverage
                        ? AppColors.success
                        : grade.isPassing
                            ? AppColors.warning
                            : AppColors.error,
                    width: 1.5,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      grade.isAboveAverage
                          ? Icons.emoji_events
                          : grade.isPassing
                              ? Icons.check_circle
                              : Icons.warning,
                      color: grade.isAboveAverage
                          ? AppColors.success
                          : grade.isPassing
                              ? AppColors.warning
                              : AppColors.error,
                      size: 32,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        grade.isAboveAverage
                            ? (locale == 'ar'
                                ? 'أداء ممتاز! فوق المتوسط'
                                : 'Excellent! Above Average')
                            : grade.isPassing
                                ? (locale == 'ar' ? 'ناجح' : 'Passed')
                                : (locale == 'ar'
                                    ? 'تحتاج إلى تحسين'
                                    : 'Needs Improvement'),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: grade.isAboveAverage
                              ? AppColors.success
                              : grade.isPassing
                                  ? AppColors.warning
                                  : AppColors.error,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Feedback
              if (grade.getFeedback(locale) != null) ...[
                const SizedBox(height: 24),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: theme.colorScheme.outline.withOpacity(0.3),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        locale == 'ar' ? 'ملاحظات المدرس' : 'Instructor Feedback',
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        grade.getFeedback(locale)!,
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
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

  Widget _buildScoreItem(BuildContext context, String label, String value) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Text(
          value,
          style: theme.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }

  Widget _buildStatRow(
    BuildContext context,
    IconData icon,
    String label,
    String value,
    Color color,
  ) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: theme.textTheme.bodyMedium,
          ),
        ),
        Text(
          value,
          style: theme.textTheme.bodyLarge?.copyWith(
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }
}

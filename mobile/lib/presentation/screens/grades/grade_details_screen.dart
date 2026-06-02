import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../providers/course_provider.dart';
import '../../widgets/common/loading_widget.dart';
import '../../widgets/common/error_widget.dart' as app_error;

/// Grade Details Screen
class GradeDetailsScreen extends ConsumerWidget {
  final String gradeId;

  const GradeDetailsScreen({super.key, required this.gradeId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final gradeAsync = ref.watch(gradeDetailProvider(gradeId));
    final breakdownAsync = ref.watch(gradeBreakdownProvider(gradeId));
    final theme = Theme.of(context);
    final locale = l10n.locale.languageCode;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.get('grade_details')),
      ),
      body: gradeAsync.when(
        loading: () => const Center(child: LoadingWidget()),
        error: (error, stack) => app_error.ErrorDisplayWidget(
          message: error.toString(),
          onRetry: () => ref.refresh(gradeDetailProvider(gradeId)),
        ),
        data: (grade) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Card
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.getGradeColor(grade.percentage),
                      AppColors.getGradeColor(grade.percentage).withOpacity(0.7),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  children: [
                    Text(
                      grade.getCourseName(locale),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${grade.courseCode} - ${grade.examType}',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.9),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildHeaderStat(
                          l10n.get('your_grade'),
                          '${grade.grade.toStringAsFixed(1)}/${grade.maxGrade.toInt()}',
                        ),
                        Container(
                          width: 1,
                          height: 40,
                          color: Colors.white.withOpacity(0.3),
                        ),
                        _buildHeaderStat(
                          locale == 'ar' ? 'النسبة' : 'Percentage',
                          '${grade.percentage.toStringAsFixed(1)}%',
                        ),
                        Container(
                          width: 1,
                          height: 40,
                          color: Colors.white.withOpacity(0.3),
                        ),
                        _buildHeaderStat(
                          locale == 'ar' ? 'التقدير' : 'Grade',
                          grade.calculatedLetterGrade,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Class Comparison
              if (grade.classAverage != null) ...[
                Text(
                  locale == 'ar' ? 'مقارنة بالصف' : 'Class Comparison',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(16),
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
                      _buildComparisonBar(
                        context,
                        l10n.get('your_grade'),
                        grade.grade,
                        grade.maxGrade,
                        AppColors.primary,
                      ),
                      const SizedBox(height: 12),
                      _buildComparisonBar(
                        context,
                        l10n.get('class_average'),
                        grade.classAverage!,
                        grade.maxGrade,
                        AppColors.info,
                      ),
                      if (grade.classHighest != null) ...[
                        const SizedBox(height: 12),
                        _buildComparisonBar(
                          context,
                          locale == 'ar' ? 'أعلى درجة' : 'Highest',
                          grade.classHighest!,
                          grade.maxGrade,
                          AppColors.success,
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],

              // Grade Breakdown
              breakdownAsync.when(
                loading: () => const Center(child: LoadingWidget()),
                error: (_, __) => const SizedBox.shrink(),
                data: (breakdown) {
                  if (breakdown.isEmpty) return const SizedBox.shrink();

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.get('grade_breakdown'),
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(16),
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
                          children: breakdown.asMap().entries.map((entry) {
                            final item = entry.value;
                            final isLast = entry.key == breakdown.length - 1;

                            return Column(
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            item.getName(locale),
                                            style: theme.textTheme.bodyMedium
                                                ?.copyWith(
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                          Text(
                                            '${locale == 'ar' ? 'الوزن:' : 'Weight:'} ${item.weight}%',
                                            style: theme.textTheme.bodySmall
                                                ?.copyWith(
                                              color: theme
                                                  .colorScheme.onSurfaceVariant,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.end,
                                      children: [
                                        Text(
                                          '${item.grade.toStringAsFixed(1)}/${item.maxGrade.toInt()}',
                                          style: theme.textTheme.bodyLarge
                                              ?.copyWith(
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        Text(
                                          '${item.percentage.toStringAsFixed(1)}%',
                                          style: TextStyle(
                                            color: AppColors.getGradeColor(
                                                item.percentage),
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                if (!isLast) const Divider(height: 24),
                              ],
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                  );
                },
              ),

              // Feedback
              if (grade.getFeedback(locale) != null) ...[
                const SizedBox(height: 24),
                Text(
                  locale == 'ar' ? 'ملاحظات' : 'Feedback',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: theme.colorScheme.primary.withOpacity(0.3),
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        Icons.format_quote,
                        color: theme.colorScheme.primary,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          grade.getFeedback(locale)!,
                          style: theme.textTheme.bodyMedium,
                        ),
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

  Widget _buildHeaderStat(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.white.withOpacity(0.8),
          ),
        ),
      ],
    );
  }

  Widget _buildComparisonBar(
    BuildContext context,
    String label,
    double value,
    double maxValue,
    Color color,
  ) {
    final percentage = maxValue > 0 ? (value / maxValue) : 0.0;
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: theme.textTheme.bodySmall,
            ),
            Text(
              '${value.toStringAsFixed(1)}/${maxValue.toInt()}',
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: percentage,
            backgroundColor: color.withOpacity(0.2),
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 8,
          ),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../data/models/grade_model.dart';
import '../grade/grade_card.dart';

/// Recent Grades Widget for Dashboard
class RecentGradesWidget extends StatelessWidget {
  final List<GradeModel> grades;
  final VoidCallback? onViewAll;
  final int maxItems;

  const RecentGradesWidget({
    super.key,
    required this.grades,
    this.onViewAll,
    this.maxItems = 3,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              l10n.get('recent_grades'),
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            if (grades.isNotEmpty)
              TextButton(
                onPressed: onViewAll,
                child: Text(l10n.get('view_all')),
              ),
          ],
        ),
        const SizedBox(height: 12),

        // Content
        if (grades.isEmpty)
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: Column(
                children: [
                  Icon(
                    Icons.grade_outlined,
                    size: 48,
                    color: theme.colorScheme.secondary.withOpacity(0.5),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    l10n.get('no_grades'),
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: grades.length > maxItems ? maxItems : grades.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final grade = grades[index];
              return MiniGradeCard(
                grade: grade,
                onTap: null,
              );
            },
          ),
      ],
    );
  }
}

/// Horizontal Recent Grades Widget (Carousel)
class RecentGradesCarousel extends StatelessWidget {
  final List<GradeModel> grades;
  final VoidCallback? onViewAll;

  const RecentGradesCarousel({
    super.key,
    required this.grades,
    this.onViewAll,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                l10n.get('recent_grades'),
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (grades.isNotEmpty)
                TextButton(
                  onPressed: onViewAll,
                  child: Text(l10n.get('view_all')),
                ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Content
        if (grades.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.grade_outlined,
                      size: 48,
                      color: theme.colorScheme.secondary.withOpacity(0.5),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      l10n.get('no_grades'),
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          )
        else
          SizedBox(
            height: 120,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: grades.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final grade = grades[index];
                return _HorizontalGradeCard(
                  grade: grade,
                  onTap: null,
                );
              },
            ),
          ),
      ],
    );
  }
}

/// Horizontal Grade Card for Carousel
class _HorizontalGradeCard extends StatelessWidget {
  final GradeModel grade;
  final VoidCallback? onTap;

  const _HorizontalGradeCard({
    required this.grade,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final locale = Localizations.localeOf(context).languageCode;
    final gradeColor = AppColors.getGradeColor(grade.percentage);

    return SizedBox(
      width: 200,
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: gradeColor,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        grade.calculatedLetterGrade,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '${grade.percentage.toStringAsFixed(0)}%',
                      style: TextStyle(
                        color: gradeColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                Text(
                  grade.getCourseName(locale),
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  '${grade.courseCode} - ${grade.examType}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Grade Summary Row Widget
class GradeSummaryRow extends StatelessWidget {
  final double averageGrade;
  final int totalGrades;
  final int passingGrades;
  final double? gpa;

  const GradeSummaryRow({
    super.key,
    required this.averageGrade,
    required this.totalGrades,
    required this.passingGrades,
    this.gpa,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final locale = Localizations.localeOf(context).languageCode;

    return Container(
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
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildSummaryItem(
            context,
            locale == 'ar' ? 'المتوسط' : 'Average',
            '${averageGrade.toStringAsFixed(1)}%',
            AppColors.getGradeColor(averageGrade),
          ),
          Container(
            width: 1,
            height: 40,
            color: theme.colorScheme.outline.withOpacity(0.3),
          ),
          _buildSummaryItem(
            context,
            locale == 'ar' ? 'الناجح' : 'Passed',
            '$passingGrades/$totalGrades',
            AppColors.success,
          ),
          if (gpa != null) ...[
            Container(
              width: 1,
              height: 40,
              color: theme.colorScheme.outline.withOpacity(0.3),
            ),
            _buildSummaryItem(
              context,
              'GPA',
              gpa!.toStringAsFixed(2),
              AppColors.primary,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSummaryItem(
    BuildContext context,
    String label,
    String value,
    Color color,
  ) {
    final theme = Theme.of(context);

    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

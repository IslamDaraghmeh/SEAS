import 'package:flutter/material.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../data/models/exam_model.dart';
import 'exam_status_badge.dart';

/// Exam Card Widget
class ExamCard extends StatelessWidget {
  final ExamModel exam;
  final VoidCallback? onTap;
  final bool showStatus;
  final bool compact;

  const ExamCard({
    super.key,
    required this.exam,
    this.onTap,
    this.showStatus = true,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);
    final locale = l10n.locale.languageCode;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: EdgeInsets.all(compact ? 12 : 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Course Icon
                  Container(
                    padding: EdgeInsets.all(compact ? 8 : 10),
                    decoration: BoxDecoration(
                      color: AppColors.getExamStatusColor(exam.status.name)
                          .withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      _getExamIcon(),
                      color: AppColors.getExamStatusColor(exam.status.name),
                      size: compact ? 20 : 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Course Info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          exam.getCourseName(locale),
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: compact ? 1 : 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          exam.courseCode,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Status Badge
                  if (showStatus) ExamStatusBadge(status: exam.status),
                ],
              ),
              if (!compact) ...[
                const SizedBox(height: 16),
                const Divider(height: 1),
                const SizedBox(height: 12),
                // Details Row
                Row(
                  children: [
                    // Date
                    Expanded(
                      child: _buildInfoItem(
                        context,
                        Icons.calendar_today_outlined,
                        l10n.formatDate(exam.examDate),
                      ),
                    ),
                    // Time
                    Expanded(
                      child: _buildInfoItem(
                        context,
                        Icons.access_time_outlined,
                        l10n.formatTime(exam.startTime),
                      ),
                    ),
                    // Duration
                    Expanded(
                      child: _buildInfoItem(
                        context,
                        Icons.timer_outlined,
                        '${exam.durationMinutes} ${l10n.get('minutes')}',
                      ),
                    ),
                  ],
                ),
              ] else ...[
                const SizedBox(height: 8),
                // Compact info row
                Row(
                  children: [
                    Icon(
                      Icons.calendar_today_outlined,
                      size: 14,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      l10n.formatDate(exam.examDate),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Icon(
                      Icons.access_time_outlined,
                      size: 14,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      l10n.formatTime(exam.startTime),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ],
              // Days until exam (if upcoming)
              if (exam.isUpcoming && exam.daysUntil >= 0 && !compact) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: _getDaysColor().withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _getDaysText(locale),
                    style: TextStyle(
                      color: _getDaysColor(),
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoItem(BuildContext context, IconData icon, String text) {
    final theme = Theme.of(context);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          size: 16,
          color: theme.colorScheme.onSurfaceVariant,
        ),
        const SizedBox(width: 4),
        Flexible(
          child: Text(
            text,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  IconData _getExamIcon() {
    switch (exam.type) {
      case ExamType.midterm:
        return Icons.edit_note;
      case ExamType.finalExam:
        return Icons.school;
      case ExamType.quiz:
        return Icons.quiz;
      case ExamType.practical:
        return Icons.science;
      case ExamType.oral:
        return Icons.record_voice_over;
    }
  }

  Color _getDaysColor() {
    if (exam.daysUntil == 0) return AppColors.error;
    if (exam.daysUntil <= 3) return AppColors.warning;
    return AppColors.success;
  }

  String _getDaysText(String locale) {
    if (exam.daysUntil == 0) {
      return locale == 'ar' ? 'اليوم!' : 'Today!';
    }
    if (exam.daysUntil == 1) {
      return locale == 'ar' ? 'غدا' : 'Tomorrow';
    }
    return locale == 'ar'
        ? 'متبقي ${exam.daysUntil} يوم'
        : '${exam.daysUntil} days left';
  }
}

/// Horizontal Exam Card (for carousel)
class HorizontalExamCard extends StatelessWidget {
  final ExamModel exam;
  final VoidCallback? onTap;
  final double width;

  const HorizontalExamCard({
    super.key,
    required this.exam,
    this.onTap,
    this.width = 280,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);
    final locale = l10n.locale.languageCode;

    return SizedBox(
      width: width,
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
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.getExamStatusColor(exam.status.name),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        locale == 'ar'
                            ? exam.type.toArabic()
                            : exam.type.toEnglish(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    const Spacer(),
                    ExamStatusBadge(status: exam.status, small: true),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  exam.getCourseName(locale),
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  exam.courseCode,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const Spacer(),
                Row(
                  children: [
                    Icon(
                      Icons.calendar_today_outlined,
                      size: 14,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      l10n.formatDate(exam.examDate),
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

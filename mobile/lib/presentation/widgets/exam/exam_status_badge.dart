import 'package:flutter/material.dart';

import '../../../core/constants/app_colors.dart';
import '../../../data/models/exam_model.dart';

/// Exam Status Badge Widget
class ExamStatusBadge extends StatelessWidget {
  final ExamStatus status;
  final bool small;

  const ExamStatusBadge({
    super.key,
    required this.status,
    this.small = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: small ? 8 : 10,
        vertical: small ? 4 : 6,
      ),
      decoration: BoxDecoration(
        color: _getStatusColor().withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: _getStatusColor().withOpacity(0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: small ? 6 : 8,
            height: small ? 6 : 8,
            decoration: BoxDecoration(
              color: _getStatusColor(),
              shape: BoxShape.circle,
            ),
          ),
          SizedBox(width: small ? 4 : 6),
          Text(
            _getStatusText(context),
            style: TextStyle(
              color: _getStatusColor(),
              fontSize: small ? 10 : 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor() {
    switch (status) {
      case ExamStatus.upcoming:
        return AppColors.examUpcoming;
      case ExamStatus.ongoing:
        return AppColors.examOngoing;
      case ExamStatus.completed:
        return AppColors.examCompleted;
      case ExamStatus.cancelled:
        return AppColors.examCancelled;
    }
  }

  String _getStatusText(BuildContext context) {
    final locale = Localizations.localeOf(context).languageCode;
    return locale == 'ar' ? status.toArabic() : status.toEnglish();
  }
}

/// Exam Type Badge Widget
class ExamTypeBadge extends StatelessWidget {
  final ExamType type;
  final bool small;

  const ExamTypeBadge({
    super.key,
    required this.type,
    this.small = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: small ? 8 : 12,
        vertical: small ? 4 : 6,
      ),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _getTypeIcon(),
            size: small ? 12 : 16,
            color: theme.colorScheme.primary,
          ),
          SizedBox(width: small ? 4 : 6),
          Text(
            _getTypeText(context),
            style: TextStyle(
              color: theme.colorScheme.primary,
              fontSize: small ? 10 : 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  IconData _getTypeIcon() {
    switch (type) {
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

  String _getTypeText(BuildContext context) {
    final locale = Localizations.localeOf(context).languageCode;
    return locale == 'ar' ? type.toArabic() : type.toEnglish();
  }
}

/// Attendance Badge Widget
class AttendanceBadge extends StatelessWidget {
  final bool isMarked;
  final bool small;

  const AttendanceBadge({
    super.key,
    required this.isMarked,
    this.small = false,
  });

  @override
  Widget build(BuildContext context) {
    final locale = Localizations.localeOf(context).languageCode;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: small ? 8 : 10,
        vertical: small ? 4 : 6,
      ),
      decoration: BoxDecoration(
        color: isMarked
            ? AppColors.success.withOpacity(0.1)
            : AppColors.warning.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isMarked
              ? AppColors.success.withOpacity(0.3)
              : AppColors.warning.withOpacity(0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isMarked ? Icons.check_circle : Icons.pending,
            size: small ? 12 : 16,
            color: isMarked ? AppColors.success : AppColors.warning,
          ),
          SizedBox(width: small ? 4 : 6),
          Text(
            isMarked
                ? (locale == 'ar' ? 'تم التسجيل' : 'Checked In')
                : (locale == 'ar' ? 'لم يتم التسجيل' : 'Not Checked In'),
            style: TextStyle(
              color: isMarked ? AppColors.success : AppColors.warning,
              fontSize: small ? 10 : 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

/// Days Remaining Badge Widget
class DaysRemainingBadge extends StatelessWidget {
  final int days;
  final bool small;

  const DaysRemainingBadge({
    super.key,
    required this.days,
    this.small = false,
  });

  @override
  Widget build(BuildContext context) {
    final locale = Localizations.localeOf(context).languageCode;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: small ? 8 : 12,
        vertical: small ? 4 : 6,
      ),
      decoration: BoxDecoration(
        color: _getColor().withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        _getText(locale),
        style: TextStyle(
          color: _getColor(),
          fontSize: small ? 10 : 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Color _getColor() {
    if (days == 0) return AppColors.error;
    if (days <= 3) return AppColors.warning;
    return AppColors.success;
  }

  String _getText(String locale) {
    if (days == 0) {
      return locale == 'ar' ? 'اليوم!' : 'Today!';
    }
    if (days == 1) {
      return locale == 'ar' ? 'غدا' : 'Tomorrow';
    }
    return locale == 'ar' ? 'متبقي $days يوم' : '$days days left';
  }
}

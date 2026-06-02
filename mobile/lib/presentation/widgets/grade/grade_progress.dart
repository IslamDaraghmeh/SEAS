import 'package:flutter/material.dart';

import '../../../core/constants/app_colors.dart';

/// Grade Progress Widget
class GradeProgressWidget extends StatelessWidget {
  final int passed;
  final int failed;
  final double height;
  final bool showLabels;

  const GradeProgressWidget({
    super.key,
    required this.passed,
    required this.failed,
    this.height = 8,
    this.showLabels = true,
  });

  @override
  Widget build(BuildContext context) {
    final total = passed + failed;
    final passRate = total > 0 ? passed / total : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Progress Bar
        ClipRRect(
          borderRadius: BorderRadius.circular(height / 2),
          child: Row(
            children: [
              if (passed > 0)
                Expanded(
                  flex: passed,
                  child: Container(
                    height: height,
                    color: AppColors.success,
                  ),
                ),
              if (failed > 0)
                Expanded(
                  flex: failed,
                  child: Container(
                    height: height,
                    color: AppColors.error,
                  ),
                ),
              if (total == 0)
                Expanded(
                  child: Container(
                    height: height,
                    color: Colors.white.withOpacity(0.2),
                  ),
                ),
            ],
          ),
        ),
        // Labels
        if (showLabels) ...[
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildLabel(
                context,
                AppColors.success,
                Localizations.localeOf(context).languageCode == 'ar'
                    ? 'ناجح: $passed'
                    : 'Passed: $passed',
              ),
              Text(
                '${(passRate * 100).toStringAsFixed(0)}%',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
              _buildLabel(
                context,
                AppColors.error,
                Localizations.localeOf(context).languageCode == 'ar'
                    ? 'راسب: $failed'
                    : 'Failed: $failed',
              ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildLabel(BuildContext context, Color color, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 4),
        Text(
          text,
          style: TextStyle(
            color: Colors.white.withOpacity(0.9),
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}

/// Circular Grade Progress Widget
class CircularGradeProgress extends StatelessWidget {
  final double percentage;
  final double size;
  final double strokeWidth;
  final Color? color;
  final Color? backgroundColor;
  final Widget? child;

  const CircularGradeProgress({
    super.key,
    required this.percentage,
    this.size = 100,
    this.strokeWidth = 8,
    this.color,
    this.backgroundColor,
    this.child,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final gradeColor = color ?? AppColors.getGradeColor(percentage);

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CircularProgressIndicator(
            value: percentage / 100,
            strokeWidth: strokeWidth,
            backgroundColor: backgroundColor ??
                theme.colorScheme.outline.withOpacity(0.2),
            valueColor: AlwaysStoppedAnimation<Color>(gradeColor),
          ),
          if (child != null)
            child!
          else
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '${percentage.toStringAsFixed(0)}%',
                  style: TextStyle(
                    fontSize: size * 0.2,
                    fontWeight: FontWeight.bold,
                    color: gradeColor,
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}

/// Linear Grade Progress Widget
class LinearGradeProgress extends StatelessWidget {
  final double percentage;
  final double height;
  final Color? color;
  final Color? backgroundColor;
  final String? label;
  final bool showPercentage;

  const LinearGradeProgress({
    super.key,
    required this.percentage,
    this.height = 12,
    this.color,
    this.backgroundColor,
    this.label,
    this.showPercentage = true,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final gradeColor = color ?? AppColors.getGradeColor(percentage);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null || showPercentage)
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (label != null)
                  Text(
                    label!,
                    style: theme.textTheme.bodySmall,
                  ),
                if (showPercentage)
                  Text(
                    '${percentage.toStringAsFixed(1)}%',
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: gradeColor,
                    ),
                  ),
              ],
            ),
          ),
        ClipRRect(
          borderRadius: BorderRadius.circular(height / 2),
          child: LinearProgressIndicator(
            value: percentage / 100,
            backgroundColor: backgroundColor ??
                theme.colorScheme.outline.withOpacity(0.2),
            valueColor: AlwaysStoppedAnimation<Color>(gradeColor),
            minHeight: height,
          ),
        ),
      ],
    );
  }
}

/// GPA Progress Widget
class GpaProgressWidget extends StatelessWidget {
  final double gpa;
  final double maxGpa;
  final double size;

  const GpaProgressWidget({
    super.key,
    required this.gpa,
    this.maxGpa = 4.0,
    this.size = 120,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final percentage = (gpa / maxGpa) * 100;
    final color = AppColors.getGradeColor(percentage);

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CircularProgressIndicator(
            value: gpa / maxGpa,
            strokeWidth: 10,
            backgroundColor: theme.colorScheme.outline.withOpacity(0.2),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                gpa.toStringAsFixed(2),
                style: TextStyle(
                  fontSize: size * 0.25,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              Text(
                'GPA',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

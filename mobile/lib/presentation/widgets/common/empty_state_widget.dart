import 'package:flutter/material.dart';

import '../../../core/constants/app_colors.dart';

/// Empty State Widget
class EmptyStateWidget extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;
  final VoidCallback? onActionPressed;
  final String? actionText;
  final Color? iconColor;
  final double iconSize;

  const EmptyStateWidget({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.action,
    this.onActionPressed,
    this.actionText,
    this.iconColor,
    this.iconSize = 80,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: (iconColor ?? theme.colorScheme.primary).withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: iconSize,
                color: iconColor ?? theme.colorScheme.primary.withOpacity(0.6),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(
                subtitle!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (action != null || onActionPressed != null) ...[
              const SizedBox(height: 24),
              action ??
                  ElevatedButton(
                    onPressed: onActionPressed,
                    child: Text(actionText ?? 'Action'),
                  ),
            ],
          ],
        ),
      ),
    );
  }
}

/// No Exams Widget
class NoExamsWidget extends StatelessWidget {
  final bool isArabic;
  final VoidCallback? onRefresh;

  const NoExamsWidget({
    super.key,
    this.isArabic = true,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      icon: Icons.assignment_outlined,
      title: isArabic ? 'لا توجد امتحانات' : 'No Exams',
      subtitle: isArabic
          ? 'لم يتم جدولة أي امتحانات بعد'
          : 'No exams have been scheduled yet',
      iconColor: AppColors.primary,
      onActionPressed: onRefresh,
      actionText: isArabic ? 'تحديث' : 'Refresh',
    );
  }
}

/// No Grades Widget
class NoGradesWidget extends StatelessWidget {
  final bool isArabic;
  final VoidCallback? onRefresh;

  const NoGradesWidget({
    super.key,
    this.isArabic = true,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      icon: Icons.grade_outlined,
      title: isArabic ? 'لا توجد درجات' : 'No Grades',
      subtitle:
          isArabic ? 'لم يتم نشر أي درجات بعد' : 'No grades have been posted yet',
      iconColor: AppColors.secondary,
      onActionPressed: onRefresh,
      actionText: isArabic ? 'تحديث' : 'Refresh',
    );
  }
}

/// No Search Results Widget
class NoSearchResultsWidget extends StatelessWidget {
  final String? query;
  final bool isArabic;
  final VoidCallback? onClear;

  const NoSearchResultsWidget({
    super.key,
    this.query,
    this.isArabic = true,
    this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      icon: Icons.search_off,
      title: isArabic ? 'لا توجد نتائج' : 'No Results',
      subtitle: query != null
          ? (isArabic
              ? 'لم يتم العثور على نتائج لـ "$query"'
              : 'No results found for "$query"')
          : (isArabic
              ? 'حاول البحث بكلمات مختلفة'
              : 'Try searching with different keywords'),
      iconColor: AppColors.accent,
      onActionPressed: onClear,
      actionText: isArabic ? 'مسح البحث' : 'Clear Search',
    );
  }
}

/// No Notifications Widget
class NoNotificationsWidget extends StatelessWidget {
  final bool isArabic;

  const NoNotificationsWidget({
    super.key,
    this.isArabic = true,
  });

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      icon: Icons.notifications_none,
      title: isArabic ? 'لا توجد إشعارات' : 'No Notifications',
      subtitle: isArabic
          ? 'ستظهر الإشعارات الجديدة هنا'
          : 'New notifications will appear here',
      iconColor: AppColors.info,
    );
  }
}

/// Coming Soon Widget
class ComingSoonWidget extends StatelessWidget {
  final String? feature;
  final bool isArabic;

  const ComingSoonWidget({
    super.key,
    this.feature,
    this.isArabic = true,
  });

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      icon: Icons.construction,
      title: isArabic ? 'قريباً' : 'Coming Soon',
      subtitle: feature != null
          ? (isArabic
              ? 'ميزة $feature قيد التطوير'
              : '$feature is under development')
          : (isArabic
              ? 'هذه الميزة قيد التطوير'
              : 'This feature is under development'),
      iconColor: AppColors.warning,
    );
  }
}

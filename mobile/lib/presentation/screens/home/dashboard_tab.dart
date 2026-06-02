import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/localization/app_localizations.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/exam_provider.dart';
import '../../../providers/course_provider.dart';
import '../../widgets/dashboard/upcoming_exams.dart';
import '../../widgets/dashboard/recent_grades.dart';
import '../../widgets/dashboard/summary_card.dart';
import '../../widgets/common/loading_widget.dart';

/// Dashboard Tab
class DashboardTab extends ConsumerWidget {
  const DashboardTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final user = ref.watch(currentUserProvider);
    final examsState = ref.watch(examsProvider);
    final coursesState = ref.watch(coursesProvider);
    final gradeStats = ref.watch(gradeStatisticsProvider);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          await Future.wait([
            ref.read(examsProvider.notifier).refresh(),
            ref.read(coursesProvider.notifier).refresh(),
          ]);
        },
        child: CustomScrollView(
          slivers: [
            // App Bar
            SliverAppBar(
              expandedHeight: 140,
              floating: false,
              pinned: true,
              flexibleSpace: FlexibleSpaceBar(
                titlePadding: const EdgeInsetsDirectional.only(
                  start: 16,
                  bottom: 16,
                ),
                title: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.get('welcome_back'),
                      style: TextStyle(
                        fontSize: 12,
                        color: Theme.of(context)
                            .colorScheme
                            .onSurface
                            .withOpacity(0.7),
                      ),
                    ),
                    Text(
                      user?.getDisplayName(l10n.locale.languageCode) ?? '',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                  ],
                ),
                background: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Theme.of(context).colorScheme.primary.withOpacity(0.1),
                        Theme.of(context).colorScheme.surface,
                      ],
                    ),
                  ),
                ),
              ),
              actions: [
                if (user?.avatar != null)
                  Padding(
                    padding: const EdgeInsets.only(right: 16),
                    child: CircleAvatar(
                      backgroundImage: NetworkImage(user!.avatar!),
                    ),
                  )
                else
                  Padding(
                    padding: const EdgeInsets.only(right: 16),
                    child: CircleAvatar(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      child: Text(
                        user?.initials ?? 'U',
                        style: const TextStyle(color: Colors.white),
                      ),
                    ),
                  ),
              ],
            ),

            // Content
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // Summary Cards Row
                  Row(
                    children: [
                      Expanded(
                        child: SummaryCard(
                          title: l10n.get('upcoming_exams'),
                          value: '${examsState.upcomingExams.length}',
                          icon: Icons.assignment_outlined,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: SummaryCard(
                          title: l10n.get('completed_exams'),
                          value: '${gradeStats.totalGrades}',
                          icon: Icons.check_circle_outlined,
                          color: Theme.of(context).colorScheme.secondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: SummaryCard(
                          title: l10n.get('average_grade'),
                          value: '${gradeStats.averageGrade.toStringAsFixed(1)}%',
                          icon: Icons.trending_up_outlined,
                          color: Theme.of(context).colorScheme.tertiary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: SummaryCard(
                          title: l10n.get('gpa'),
                          value: ref.watch(gpaSummaryProvider)?.cumulativeGpa
                                  .toStringAsFixed(2) ??
                              '-',
                          icon: Icons.school_outlined,
                          color: Theme.of(context).colorScheme.error,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Upcoming Exams Section
                  if (examsState.isLoading && examsState.upcomingExams.isEmpty)
                    const Center(child: LoadingWidget())
                  else
                    UpcomingExamsWidget(
                      exams: examsState.upcomingExams,
                    ),
                  const SizedBox(height: 24),

                  // Recent Grades Section
                  if (coursesState.isLoading && coursesState.recentGrades.isEmpty)
                    const Center(child: LoadingWidget())
                  else
                    RecentGradesWidget(
                      grades: coursesState.recentGrades,
                    ),
                  const SizedBox(height: 24),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/app_localizations.dart';
import '../../../providers/course_provider.dart';
import '../../widgets/grade/grade_card.dart';
import '../../widgets/grade/grade_progress.dart';
import '../../widgets/common/loading_widget.dart';
import '../../widgets/common/error_widget.dart' as app_error;
import '../../widgets/common/empty_state_widget.dart';

/// Grades Tab
class GradesTab extends ConsumerWidget {
  const GradesTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final coursesState = ref.watch(coursesProvider);
    final gradeStats = ref.watch(gradeStatisticsProvider);
    final gpaSummary = ref.watch(gpaSummaryProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.get('grades')),
        actions: [
          IconButton(
            icon: const Icon(Icons.bar_chart_outlined),
            onPressed: () => context.push('/home/grades-chart'),
            tooltip: l10n.get('grades_chart'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(coursesProvider.notifier).refresh(),
        child: coursesState.isLoading && coursesState.grades.isEmpty
            ? const Center(child: LoadingWidget())
            : coursesState.error != null && coursesState.grades.isEmpty
                ? app_error.ErrorDisplayWidget(
                    message: coursesState.error!,
                    onRetry: () =>
                        ref.read(coursesProvider.notifier).loadGrades(),
                  )
                : coursesState.grades.isEmpty
                    ? EmptyStateWidget(
                        icon: Icons.grade_outlined,
                        title: l10n.get('no_grades'),
                        subtitle: l10n.get('no_data'),
                      )
                    : CustomScrollView(
                        slivers: [
                          // Summary Header
                          SliverToBoxAdapter(
                            child: Container(
                              margin: const EdgeInsets.all(16),
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    theme.colorScheme.primary,
                                    theme.colorScheme.primary.withOpacity(0.8),
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Column(
                                children: [
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceAround,
                                    children: [
                                      _buildStatItem(
                                        context,
                                        l10n.get('gpa'),
                                        gpaSummary?.cumulativeGpa
                                                .toStringAsFixed(2) ??
                                            '-',
                                      ),
                                      Container(
                                        width: 1,
                                        height: 40,
                                        color: Colors.white24,
                                      ),
                                      _buildStatItem(
                                        context,
                                        l10n.get('average_grade'),
                                        '${gradeStats.averageGrade.toStringAsFixed(1)}%',
                                      ),
                                      Container(
                                        width: 1,
                                        height: 40,
                                        color: Colors.white24,
                                      ),
                                      _buildStatItem(
                                        context,
                                        l10n.get('total_exams'),
                                        '${gradeStats.totalGrades}',
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 16),
                                  // Pass/Fail Progress
                                  GradeProgressWidget(
                                    passed: gradeStats.passingGrades,
                                    failed: gradeStats.failingGrades,
                                  ),
                                ],
                              ),
                            ),
                          ),

                          // Grades List Header
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                              child: Text(
                                l10n.get('recent_grades'),
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),

                          // Grades List
                          SliverPadding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            sliver: SliverList(
                              delegate: SliverChildBuilderDelegate(
                                (context, index) {
                                  final grade = coursesState.grades[index];
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 12),
                                    child: GradeCard(
                                      grade: grade,
                                      onTap: () => context.push(
                                        '/home/grade/${grade.id}',
                                      ),
                                    ),
                                  );
                                },
                                childCount: coursesState.grades.length,
                              ),
                            ),
                          ),

                          const SliverToBoxAdapter(
                            child: SizedBox(height: 24),
                          ),
                        ],
                      ),
      ),
    );
  }

  Widget _buildStatItem(BuildContext context, String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 24,
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
}

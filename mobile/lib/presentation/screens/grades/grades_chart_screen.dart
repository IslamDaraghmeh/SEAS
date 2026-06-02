import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../providers/course_provider.dart';
import '../../widgets/common/loading_widget.dart';
import '../../widgets/common/empty_state_widget.dart';

/// Grades Chart Screen
class GradesChartScreen extends ConsumerWidget {
  const GradesChartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final coursesState = ref.watch(coursesProvider);
    final gradeStats = ref.watch(gradeStatisticsProvider);
    final theme = Theme.of(context);
    final locale = l10n.locale.languageCode;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.get('grades_chart')),
      ),
      body: coursesState.isLoading && coursesState.grades.isEmpty
          ? const Center(child: LoadingWidget())
          : coursesState.grades.isEmpty
              ? EmptyStateWidget(
                  icon: Icons.bar_chart_outlined,
                  title: l10n.get('no_grades'),
                  subtitle: l10n.get('no_data'),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Bar Chart
                      Text(
                        locale == 'ar'
                            ? 'توزيع الدرجات حسب المادة'
                            : 'Grade Distribution by Course',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        height: 300,
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
                        child: BarChart(
                          BarChartData(
                            alignment: BarChartAlignment.spaceAround,
                            maxY: 100,
                            barTouchData: BarTouchData(
                              enabled: true,
                              touchTooltipData: BarTouchTooltipData(
                                getTooltipItem: (group, groupIndex, rod,
                                    rodIndex) {
                                  final grade = coursesState.grades[groupIndex];
                                  return BarTooltipItem(
                                    '${grade.courseCode}\n${rod.toY.toStringAsFixed(1)}%',
                                    const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  );
                                },
                              ),
                            ),
                            titlesData: FlTitlesData(
                              show: true,
                              bottomTitles: AxisTitles(
                                sideTitles: SideTitles(
                                  showTitles: true,
                                  getTitlesWidget: (value, meta) {
                                    if (value.toInt() >=
                                        coursesState.grades.length) {
                                      return const SizedBox.shrink();
                                    }
                                    return Padding(
                                      padding: const EdgeInsets.only(top: 8),
                                      child: Text(
                                        coursesState.grades[value.toInt()]
                                            .courseCode
                                            .substring(0, 4),
                                        style: const TextStyle(fontSize: 10),
                                      ),
                                    );
                                  },
                                  reservedSize: 32,
                                ),
                              ),
                              leftTitles: AxisTitles(
                                sideTitles: SideTitles(
                                  showTitles: true,
                                  getTitlesWidget: (value, meta) {
                                    return Text(
                                      '${value.toInt()}%',
                                      style: const TextStyle(fontSize: 10),
                                    );
                                  },
                                  reservedSize: 40,
                                ),
                              ),
                              topTitles: const AxisTitles(
                                sideTitles: SideTitles(showTitles: false),
                              ),
                              rightTitles: const AxisTitles(
                                sideTitles: SideTitles(showTitles: false),
                              ),
                            ),
                            borderData: FlBorderData(show: false),
                            barGroups: coursesState.grades
                                .take(8)
                                .toList()
                                .asMap()
                                .entries
                                .map((entry) {
                              return BarChartGroupData(
                                x: entry.key,
                                barRods: [
                                  BarChartRodData(
                                    toY: entry.value.percentage,
                                    color: AppColors.getGradeColor(
                                        entry.value.percentage),
                                    width: 20,
                                    borderRadius: const BorderRadius.vertical(
                                      top: Radius.circular(4),
                                    ),
                                  ),
                                ],
                              );
                            }).toList(),
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Pie Chart
                      Text(
                        locale == 'ar'
                            ? 'نسبة النجاح/الرسوب'
                            : 'Pass/Fail Ratio',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        height: 250,
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
                          children: [
                            Expanded(
                              child: PieChart(
                                PieChartData(
                                  sectionsSpace: 2,
                                  centerSpaceRadius: 40,
                                  sections: [
                                    PieChartSectionData(
                                      value:
                                          gradeStats.passingGrades.toDouble(),
                                      title:
                                          '${gradeStats.passRate.toStringAsFixed(0)}%',
                                      color: AppColors.success,
                                      radius: 60,
                                      titleStyle: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                    PieChartSectionData(
                                      value:
                                          gradeStats.failingGrades.toDouble(),
                                      title:
                                          '${(100 - gradeStats.passRate).toStringAsFixed(0)}%',
                                      color: AppColors.error,
                                      radius: 60,
                                      titleStyle: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLegendItem(
                                  AppColors.success,
                                  locale == 'ar' ? 'ناجح' : 'Passed',
                                  '${gradeStats.passingGrades}',
                                ),
                                const SizedBox(height: 12),
                                _buildLegendItem(
                                  AppColors.error,
                                  locale == 'ar' ? 'راسب' : 'Failed',
                                  '${gradeStats.failingGrades}',
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Line Chart (Trend)
                      Text(
                        locale == 'ar' ? 'اتجاه الدرجات' : 'Grade Trend',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        height: 250,
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
                        child: LineChart(
                          LineChartData(
                            gridData: FlGridData(
                              show: true,
                              drawVerticalLine: false,
                              getDrawingHorizontalLine: (value) {
                                return FlLine(
                                  color: theme.colorScheme.outline
                                      .withOpacity(0.2),
                                  strokeWidth: 1,
                                );
                              },
                            ),
                            titlesData: FlTitlesData(
                              show: true,
                              bottomTitles: AxisTitles(
                                sideTitles: SideTitles(
                                  showTitles: true,
                                  getTitlesWidget: (value, meta) {
                                    return Padding(
                                      padding: const EdgeInsets.only(top: 8),
                                      child: Text(
                                        '${value.toInt() + 1}',
                                        style: const TextStyle(fontSize: 10),
                                      ),
                                    );
                                  },
                                  reservedSize: 24,
                                ),
                              ),
                              leftTitles: AxisTitles(
                                sideTitles: SideTitles(
                                  showTitles: true,
                                  getTitlesWidget: (value, meta) {
                                    return Text(
                                      '${value.toInt()}%',
                                      style: const TextStyle(fontSize: 10),
                                    );
                                  },
                                  reservedSize: 40,
                                ),
                              ),
                              topTitles: const AxisTitles(
                                sideTitles: SideTitles(showTitles: false),
                              ),
                              rightTitles: const AxisTitles(
                                sideTitles: SideTitles(showTitles: false),
                              ),
                            ),
                            borderData: FlBorderData(show: false),
                            minX: 0,
                            maxX: (coursesState.grades.length - 1).toDouble(),
                            minY: 0,
                            maxY: 100,
                            lineBarsData: [
                              LineChartBarData(
                                spots: coursesState.grades
                                    .asMap()
                                    .entries
                                    .map((entry) {
                                  return FlSpot(
                                    entry.key.toDouble(),
                                    entry.value.percentage,
                                  );
                                }).toList(),
                                isCurved: true,
                                color: AppColors.primary,
                                barWidth: 3,
                                dotData: const FlDotData(show: true),
                                belowBarData: BarAreaData(
                                  show: true,
                                  color: AppColors.primary.withOpacity(0.1),
                                ),
                              ),
                              // Average line
                              LineChartBarData(
                                spots: coursesState.grades
                                    .asMap()
                                    .entries
                                    .map((entry) {
                                  return FlSpot(
                                    entry.key.toDouble(),
                                    gradeStats.averageGrade,
                                  );
                                }).toList(),
                                isCurved: false,
                                color: AppColors.warning,
                                barWidth: 2,
                                dotData: const FlDotData(show: false),
                                dashArray: [5, 5],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Center(
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _buildLegendItem(
                              AppColors.primary,
                              locale == 'ar' ? 'الدرجات' : 'Grades',
                              null,
                            ),
                            const SizedBox(width: 24),
                            _buildLegendItem(
                              AppColors.warning,
                              locale == 'ar' ? 'المتوسط' : 'Average',
                              null,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
    );
  }

  Widget _buildLegendItem(Color color, String label, String? value) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(width: 8),
        Text(label),
        if (value != null) ...[
          const SizedBox(width: 8),
          Text(
            '($value)',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ],
      ],
    );
  }
}

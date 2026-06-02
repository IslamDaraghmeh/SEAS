import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../../core/constants/app_colors.dart';
import '../../../data/models/grade_model.dart';

/// Grade Bar Chart Widget
class GradeBarChart extends StatelessWidget {
  final List<GradeModel> grades;
  final double height;
  final bool showLabels;

  const GradeBarChart({
    super.key,
    required this.grades,
    this.height = 200,
    this.showLabels = true,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (grades.isEmpty) {
      return SizedBox(
        height: height,
        child: const Center(child: Text('No data')),
      );
    }

    return SizedBox(
      height: height,
      child: BarChart(
        BarChartData(
          alignment: BarChartAlignment.spaceAround,
          maxY: 100,
          barTouchData: BarTouchData(
            enabled: true,
            touchTooltipData: BarTouchTooltipData(
              getTooltipItem: (group, groupIndex, rod, rodIndex) {
                if (groupIndex >= grades.length) return null;
                final grade = grades[groupIndex];
                return BarTooltipItem(
                  '${grade.courseCode}\n${rod.toY.toStringAsFixed(1)}%',
                  TextStyle(
                    color: theme.colorScheme.onSurface,
                    fontWeight: FontWeight.bold,
                  ),
                );
              },
            ),
          ),
          titlesData: FlTitlesData(
            show: showLabels,
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (value, meta) {
                  if (value.toInt() >= grades.length) {
                    return const SizedBox.shrink();
                  }
                  return Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      grades[value.toInt()].courseCode.length > 4
                          ? grades[value.toInt()].courseCode.substring(0, 4)
                          : grades[value.toInt()].courseCode,
                      style: theme.textTheme.labelSmall,
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
                  if (value % 25 != 0) return const SizedBox.shrink();
                  return Text(
                    '${value.toInt()}%',
                    style: theme.textTheme.labelSmall,
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
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: 25,
            getDrawingHorizontalLine: (value) {
              return FlLine(
                color: theme.colorScheme.outline.withOpacity(0.2),
                strokeWidth: 1,
              );
            },
          ),
          borderData: FlBorderData(show: false),
          barGroups: grades.take(10).toList().asMap().entries.map((entry) {
            return BarChartGroupData(
              x: entry.key,
              barRods: [
                BarChartRodData(
                  toY: entry.value.percentage,
                  color: AppColors.getGradeColor(entry.value.percentage),
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
    );
  }
}

/// Grade Pie Chart Widget
class GradePieChart extends StatelessWidget {
  final int passed;
  final int failed;
  final double size;
  final bool showLegend;

  const GradePieChart({
    super.key,
    required this.passed,
    required this.failed,
    this.size = 150,
    this.showLegend = true,
  });

  @override
  Widget build(BuildContext context) {
    final total = passed + failed;
    if (total == 0) {
      return SizedBox(
        width: size,
        height: size,
        child: const Center(child: Text('No data')),
      );
    }

    final passRate = (passed / total) * 100;

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        SizedBox(
          width: size,
          height: size,
          child: PieChart(
            PieChartData(
              sectionsSpace: 2,
              centerSpaceRadius: size * 0.25,
              sections: [
                PieChartSectionData(
                  value: passed.toDouble(),
                  title: '${passRate.toStringAsFixed(0)}%',
                  color: AppColors.success,
                  radius: size * 0.35,
                  titleStyle: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                PieChartSectionData(
                  value: failed.toDouble(),
                  title: '${(100 - passRate).toStringAsFixed(0)}%',
                  color: AppColors.error,
                  radius: size * 0.35,
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
        if (showLegend) ...[
          const SizedBox(width: 24),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildLegendItem(
                context,
                AppColors.success,
                Localizations.localeOf(context).languageCode == 'ar'
                    ? 'ناجح'
                    : 'Passed',
                '$passed',
              ),
              const SizedBox(height: 12),
              _buildLegendItem(
                context,
                AppColors.error,
                Localizations.localeOf(context).languageCode == 'ar'
                    ? 'راسب'
                    : 'Failed',
                '$failed',
              ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildLegendItem(
    BuildContext context,
    Color color,
    String label,
    String value,
  ) {
    final theme = Theme.of(context);

    return Row(
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
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: theme.textTheme.bodySmall,
            ),
            Text(
              value,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

/// Grade Line Chart Widget
class GradeLineChart extends StatelessWidget {
  final List<GradeModel> grades;
  final double height;
  final double? averageLine;

  const GradeLineChart({
    super.key,
    required this.grades,
    this.height = 200,
    this.averageLine,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (grades.isEmpty) {
      return SizedBox(
        height: height,
        child: const Center(child: Text('No data')),
      );
    }

    return SizedBox(
      height: height,
      child: LineChart(
        LineChartData(
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: 25,
            getDrawingHorizontalLine: (value) {
              return FlLine(
                color: theme.colorScheme.outline.withOpacity(0.2),
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
                      style: theme.textTheme.labelSmall,
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
                  if (value % 25 != 0) return const SizedBox.shrink();
                  return Text(
                    '${value.toInt()}%',
                    style: theme.textTheme.labelSmall,
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
          maxX: (grades.length - 1).toDouble(),
          minY: 0,
          maxY: 100,
          lineTouchData: LineTouchData(
            touchTooltipData: LineTouchTooltipData(
              getTooltipItems: (touchedSpots) {
                return touchedSpots.map((spot) {
                  if (spot.spotIndex >= grades.length) return null;
                  final grade = grades[spot.spotIndex];
                  return LineTooltipItem(
                    '${grade.courseCode}\n${spot.y.toStringAsFixed(1)}%',
                    TextStyle(
                      color: theme.colorScheme.onSurface,
                      fontWeight: FontWeight.bold,
                    ),
                  );
                }).toList();
              },
            ),
          ),
          lineBarsData: [
            // Grade line
            LineChartBarData(
              spots: grades.asMap().entries.map((entry) {
                return FlSpot(
                  entry.key.toDouble(),
                  entry.value.percentage,
                );
              }).toList(),
              isCurved: true,
              color: AppColors.primary,
              barWidth: 3,
              isStrokeCapRound: true,
              dotData: const FlDotData(show: true),
              belowBarData: BarAreaData(
                show: true,
                color: AppColors.primary.withOpacity(0.1),
              ),
            ),
            // Average line (if provided)
            if (averageLine != null)
              LineChartBarData(
                spots: grades.asMap().entries.map((entry) {
                  return FlSpot(entry.key.toDouble(), averageLine!);
                }).toList(),
                isCurved: false,
                color: AppColors.warning,
                barWidth: 2,
                isStrokeCapRound: true,
                dotData: const FlDotData(show: false),
                dashArray: [5, 5],
              ),
          ],
        ),
      ),
    );
  }
}

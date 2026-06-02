import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/app_localizations.dart';
import '../../../providers/exam_provider.dart';
import '../../../providers/course_provider.dart';
import 'dashboard_tab.dart';
import 'exams_tab.dart';
import 'grades_tab.dart';
import 'profile_tab.dart';

/// Home Screen with Bottom Navigation
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _tabs = const [
    DashboardTab(),
    ExamsTab(),
    GradesTab(),
    ProfileTab(),
  ];

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    // Load initial data for all tabs
    ref.read(examsProvider.notifier).loadExams(refresh: true);
    ref.read(examsProvider.notifier).loadUpcomingExams();
    ref.read(coursesProvider.notifier).loadCourses();
    ref.read(coursesProvider.notifier).loadGrades();
    ref.read(coursesProvider.notifier).loadRecentGrades();
    ref.read(coursesProvider.notifier).loadGpaSummary();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _tabs,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.dashboard_outlined),
            selectedIcon: const Icon(Icons.dashboard),
            label: l10n.get('dashboard'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.assignment_outlined),
            selectedIcon: const Icon(Icons.assignment),
            label: l10n.get('exams'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.grade_outlined),
            selectedIcon: const Icon(Icons.grade),
            label: l10n.get('grades'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outlined),
            selectedIcon: const Icon(Icons.person),
            label: l10n.get('profile'),
          ),
        ],
      ),
      floatingActionButton: _currentIndex == 0
          ? FloatingActionButton(
              onPressed: () => context.push('/settings'),
              child: const Icon(Icons.settings),
            )
          : null,
    );
  }
}

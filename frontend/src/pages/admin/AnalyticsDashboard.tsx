import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  UsersIcon,
  AcademicCapIcon,
  BookOpenIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  ScoreDistributionChart,
  VerificationTrendChart,
  CompletionRateChart,
  AlertTrendChart,
  ExamPerformanceChart,
} from '../../components/analytics';
import api from '../../services/api';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalExams: number;
  activeExams: number;
  recentActivity: {
    type: string;
    count: number;
    change: number;
  }[];
  verificationTrends: {
    date: string;
    total: number;
    successful: number;
    failed: number;
  }[];
  alertTrends: {
    date: string;
    total: number;
    bySeverity: Record<string, number>;
  }[];
  scoreDistribution?: {
    range: string;
    count: number;
    percentage: number;
  }[];
  completionRates?: {
    time: string;
    completed: number;
    inProgress: number;
    total: number;
  }[];
  examPerformance?: {
    exam: string;
    examId: string;
    avgScore: number;
    maxScore: number;
    minScore: number;
    passRate: number;
    students: number;
  }[];
}

const AnalyticsDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/analytics/dashboard?days=${period}`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      // Set mock data for demo if API fails
      setStats(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  // Generate mock data for demo purposes
  const getMockData = (): DashboardStats => {
    const verificationTrends = [];
    const alertTrends = [];
    const completionRates = [];

    for (let i = period; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const total = Math.floor(Math.random() * 100) + 50;
      const successful = Math.floor(total * (0.7 + Math.random() * 0.25));

      verificationTrends.push({
        date: dateStr,
        total,
        successful,
        failed: total - successful,
      });

      alertTrends.push({
        date: dateStr,
        total: Math.floor(Math.random() * 20) + 5,
        bySeverity: {
          LOW: Math.floor(Math.random() * 10),
          MEDIUM: Math.floor(Math.random() * 5),
          HIGH: Math.floor(Math.random() * 3),
          CRITICAL: Math.floor(Math.random() * 2),
        },
      });

      const examTotal = Math.floor(Math.random() * 50) + 20;
      completionRates.push({
        time: `Day ${period - i + 1}`,
        completed: Math.floor(examTotal * (0.5 + (i / period) * 0.4)),
        inProgress: Math.floor(Math.random() * 10),
        total: examTotal,
      });
    }

    return {
      totalStudents: 1250,
      totalTeachers: 45,
      totalCourses: 28,
      totalExams: 156,
      activeExams: 8,
      recentActivity: [
        { type: 'exams_created', count: 12, change: 15.5 },
        { type: 'verifications', count: 2345, change: -3.2 },
        { type: 'submissions', count: 456, change: 8.7 },
        { type: 'alerts', count: 23, change: -12.5 },
      ],
      verificationTrends,
      alertTrends,
      scoreDistribution: [
        { range: '0-50', count: 45, percentage: 9 },
        { range: '50-60', count: 78, percentage: 15.6 },
        { range: '60-70', count: 120, percentage: 24 },
        { range: '70-80', count: 145, percentage: 29 },
        { range: '80-90', count: 85, percentage: 17 },
        { range: '90-100', count: 27, percentage: 5.4 },
      ],
      completionRates,
      examPerformance: [
        { exam: 'Midterm CS101', examId: '1', avgScore: 72.5, maxScore: 98, minScore: 35, passRate: 78.5, students: 45 },
        { exam: 'Final Math201', examId: '2', avgScore: 68.3, maxScore: 95, minScore: 28, passRate: 65.2, students: 52 },
        { exam: 'Quiz Physics', examId: '3', avgScore: 81.2, maxScore: 100, minScore: 55, passRate: 88.9, students: 38 },
        { exam: 'Lab Report Bio', examId: '4', avgScore: 76.8, maxScore: 92, minScore: 45, passRate: 82.1, students: 41 },
        { exam: 'Essay English', examId: '5', avgScore: 74.1, maxScore: 96, minScore: 52, passRate: 79.3, students: 35 },
      ],
    };
  };

  const statCards = [
    {
      title: t('analytics.totalStudents') || 'Total Students',
      value: stats?.totalStudents || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      title: t('analytics.totalTeachers') || 'Total Teachers',
      value: stats?.totalTeachers || 0,
      icon: AcademicCapIcon,
      color: 'bg-green-500',
    },
    {
      title: t('analytics.totalCourses') || 'Total Courses',
      value: stats?.totalCourses || 0,
      icon: BookOpenIcon,
      color: 'bg-purple-500',
    },
    {
      title: t('analytics.totalExams') || 'Total Exams',
      value: stats?.totalExams || 0,
      icon: DocumentTextIcon,
      color: 'bg-orange-500',
    },
    {
      title: t('analytics.activeExams') || 'Active Exams',
      value: stats?.activeExams || 0,
      icon: CheckCircleIcon,
      color: 'bg-emerald-500',
    },
  ];

  // Transform alert trends for the chart
  const transformedAlertTrends = stats?.alertTrends?.map(item => ({
    date: item.date,
    low: item.bySeverity?.LOW || 0,
    medium: item.bySeverity?.MEDIUM || 0,
    high: item.bySeverity?.HIGH || 0,
    critical: item.bySeverity?.CRITICAL || 0,
  })) || [];

  if (loading) {
    return (
      <div className="p-6 dark:bg-gray-900 min-h-screen">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('analytics.dashboard') || 'Analytics Dashboard'}
        </h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('common.refresh') || 'Refresh'}
          </Button>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value={7}>{t('analytics.last7Days') || 'Last 7 days'}</option>
            <option value={30}>{t('analytics.last30Days') || 'Last 30 days'}</option>
            <option value={90}>{t('analytics.last90Days') || 'Last 90 days'}</option>
          </select>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((card, index) => (
          <Card key={index} className="p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.value.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('analytics.recentActivity') || 'Recent Activity'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats?.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300 capitalize">
                    {activity.type.replace(/_/g, ' ')}
                  </span>
                  <div
                    className={`flex items-center text-sm ${
                      activity.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {activity.change >= 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(activity.change).toFixed(1)}%
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activity.count.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <VerificationTrendChart
          data={stats?.verificationTrends || []}
          title={t('analytics.verificationTrends') || 'Verification Trends'}
        />
        <AlertTrendChart
          data={transformedAlertTrends}
          title={t('analytics.alertTrends') || 'Alert Trends'}
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ScoreDistributionChart
          data={stats?.scoreDistribution || []}
          title={t('analytics.scoreDistribution') || 'Score Distribution'}
        />
        <CompletionRateChart
          data={stats?.completionRates || []}
          title={t('analytics.completionRate') || 'Exam Completion Rate'}
        />
      </div>

      {/* Exam Performance Chart */}
      <div className="mb-8">
        <ExamPerformanceChart
          data={stats?.examPerformance || []}
          title={t('analytics.examPerformance') || 'Exam Performance Overview'}
        />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

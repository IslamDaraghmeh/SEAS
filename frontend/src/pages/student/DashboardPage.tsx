import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AcademicCapIcon,
  ClockIcon,
  ChartBarIcon,
  CalendarIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import Card, { StatCard, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { PageLoading, SkeletonCard } from '../../components/ui/Loading';
import examService, { Exam, ExamResult } from '../../services/exam.service';
import verificationService from '../../services/verification.service';
import { format, isValid, Locale } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

// Helper function to safely format dates
const formatDate = (dateValue: string | Date | null | undefined, formatStr: string, locale: Locale): string => {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (!isValid(date)) return '-';
  return format(date, formatStr, { locale });
};

const StudentDashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const locale = i18n.language === 'ar' ? ar : enUS;

  // Fetch upcoming exams
  const { data: examsData, isLoading: examsLoading } = useQuery({
    queryKey: ['availableExams'],
    queryFn: () => examService.getAvailableExams({ status: 'PUBLISHED', limit: 5 }),
  });

  // Fetch recent results
  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ['myResults'],
    queryFn: () => examService.getMyResults({ limit: 5 }),
  });

  // Fetch face registration status
  const { data: faceStatus } = useQuery({
    queryKey: ['faceRegistrationStatus'],
    queryFn: () => verificationService.hasRegisteredFace(),
  });

  const upcomingExams = examsData?.data || [];
  const recentResults = resultsData?.data || [];

  // Calculate stats
  const stats = {
    totalExams: recentResults.length,
    averageScore: recentResults.length
      ? Math.round(
          recentResults.reduce((acc, r) => acc + r.percentage, 0) / recentResults.length
        )
      : 0,
    passRate: recentResults.length
      ? Math.round(
          (recentResults.filter((r) => r.passed).length / recentResults.length) * 100
        )
      : 0,
    upcomingCount: upcomingExams.length,
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-l from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {t('dashboard.welcome')}، {user?.firstName}!
        </h1>
        <p className="text-primary-100">
          {t('common.appName')}
        </p>
      </div>

      {/* Face Registration Status */}
      {faceStatus && !faceStatus.isRegistered && (
        <Alert variant="warning">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">
                  {t('verification.faceNotRegistered') || 'Face Not Registered'}
                </p>
                <p className="text-sm text-yellow-700">
                  {t('verification.faceRegistrationRequired') || 'Please register your face to participate in proctored exams.'}
                </p>
              </div>
            </div>
            <Link to="/student/face-registration">
              <Button variant="primary" size="sm" leftIcon={<UserCircleIcon className="h-4 w-4" />}>
                {t('verification.registerNow') || 'Register Now'}
              </Button>
            </Link>
          </div>
        </Alert>
      )}

      {faceStatus && faceStatus.isRegistered && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">
          <CheckCircleIcon className="h-5 w-5" />
          <span>{t('verification.faceRegistered') || 'Face verification is set up'}</span>
          <Link to="/student/face-registration" className="ml-auto text-primary-600 hover:underline">
            {t('common.manage') || 'Manage'}
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.completedExams')}
          value={stats.totalExams}
          icon={<AcademicCapIcon className="h-6 w-6" />}
        />
        <StatCard
          title={t('dashboard.averageScore')}
          value={`${stats.averageScore}%`}
          icon={<ChartBarIcon className="h-6 w-6" />}
        />
        <StatCard
          title={t('dashboard.passRate')}
          value={`${stats.passRate}%`}
          icon={<ChartBarIcon className="h-6 w-6" />}
        />
        <StatCard
          title={t('dashboard.upcomingExams')}
          value={stats.upcomingCount}
          icon={<CalendarIcon className="h-6 w-6" />}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Exams */}
        <Card>
          <CardHeader
            action={
              <Link to="/student/exams">
                <Button variant="ghost" size="sm">
                  {t('common.view')}
                </Button>
              </Link>
            }
          >
            <CardTitle>{t('dashboard.upcomingExams')}</CardTitle>
          </CardHeader>

          {examsLoading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : upcomingExams.length > 0 ? (
            <div className="space-y-3">
              {upcomingExams.map((exam: Exam) => (
                <Link
                  key={exam.id}
                  to={`/student/exams/${exam.id}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{exam.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {exam.courseName}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                      {exam.duration} {t('exam.minutes')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {formatDate(exam.startTime, 'PPp', locale)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      {exam.totalQuestions} {t('exam.totalQuestions')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AcademicCapIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>{t('dashboard.noUpcomingExams')}</p>
            </div>
          )}
        </Card>

        {/* Recent Results */}
        <Card>
          <CardHeader
            action={
              <Link to="/student/results">
                <Button variant="ghost" size="sm">
                  {t('common.view')}
                </Button>
              </Link>
            }
          >
            <CardTitle>{t('dashboard.recentResults')}</CardTitle>
          </CardHeader>

          {resultsLoading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : recentResults.length > 0 ? (
            <div className="space-y-3">
              {recentResults.map((result: ExamResult) => (
                <div
                  key={result.id}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {result.examTitle}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(result.submittedAt, 'PP', locale)}
                      </p>
                    </div>
                    <div className="text-end">
                      <span
                        className={`text-lg font-bold ${
                          result.passed ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {result.percentage}%
                      </span>
                      <p
                        className={`text-xs ${
                          result.passed ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {result.passed ? t('results.passed') : t('results.failed')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      {result.score}/{result.totalMarks} {t('exam.marks')}
                    </span>
                    <span>{result.grade}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>{t('dashboard.noRecentResults')}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboardPage;

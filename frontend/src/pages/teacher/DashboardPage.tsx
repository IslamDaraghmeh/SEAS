import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AcademicCapIcon,
  UsersIcon,
  ChartBarIcon,
  PlusCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import Card, { StatCard, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Loading';
import examService, { Exam } from '../../services/exam.service';
import { format, isValid, Locale } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

// Helper function to safely format dates
const formatDate = (dateValue: string | Date | null | undefined, formatStr: string, locale: Locale): string => {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (!isValid(date)) return '-';
  return format(date, formatStr, { locale });
};

const TeacherDashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const locale = i18n.language === 'ar' ? ar : enUS;

  // Fetch teacher's exams
  const { data: examsData, isLoading: examsLoading } = useQuery({
    queryKey: ['teacherExams'],
    queryFn: () => examService.getTeacherExams({ limit: 10 }),
  });

  const exams = examsData?.data || [];

  // Calculate stats (backend uses uppercase status: DRAFT, PUBLISHED, ACTIVE, COMPLETED)
  const activeExams = exams.filter(
    (e: Exam) => e.status === 'ACTIVE' || e.status === 'PUBLISHED'
  );
  const completedExams = exams.filter((e: Exam) => e.status === 'COMPLETED');
  const draftExams = exams.filter((e: Exam) => e.status === 'DRAFT');

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-l from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {t('dashboard.welcome')}، {user?.firstName}!
            </h1>
            <p className="text-primary-100">{t('common.appName')}</p>
          </div>
          <Link to="/teacher/exams/create">
            <Button
              variant="secondary"
              leftIcon={<PlusCircleIcon className="h-5 w-5" />}
              className="bg-white text-primary-600 hover:bg-primary-50"
            >
              {t('exam.createExam')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.totalExams')}
          value={exams.length}
          icon={<AcademicCapIcon className="h-6 w-6" />}
        />
        <StatCard
          title={t('dashboard.activeExams')}
          value={activeExams.length}
          icon={<EyeIcon className="h-6 w-6" />}
        />
        <StatCard
          title={t('dashboard.completedExams')}
          value={completedExams.length}
          icon={<ChartBarIcon className="h-6 w-6" />}
        />
        <StatCard
          title={t('exam.draft')}
          value={draftExams.length}
          icon={<AcademicCapIcon className="h-6 w-6" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/teacher/exams/create">
          <Card hoverable className="h-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-lg">
                <PlusCircleIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('exam.createExam')}</h3>
                <p className="text-sm text-gray-500">{t('nav.createExam')}</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link to="/teacher/monitoring">
          <Card hoverable className="h-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <EyeIcon className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('monitoring.title')}</h3>
                <p className="text-sm text-gray-500">{t('monitoring.liveMonitoring')}</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link to="/teacher/exams">
          <Card hoverable className="h-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <AcademicCapIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('nav.exams')}</h3>
                <p className="text-sm text-gray-500">{t('teacher.createdExams')}</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Exams */}
      <Card>
        <CardHeader
          action={
            <Link to="/teacher/exams">
              <Button variant="ghost" size="sm">
                {t('common.view')}
              </Button>
            </Link>
          }
        >
          <CardTitle>{t('teacher.createdExams')}</CardTitle>
        </CardHeader>

        {examsLoading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : exams.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                    {t('exam.title')}
                  </th>
                  <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                    {t('exam.course')}
                  </th>
                  <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                    {t('common.status')}
                  </th>
                  <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                    {t('exam.startTime')}
                  </th>
                  <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {exams.slice(0, 5).map((exam: Exam) => (
                  <tr key={exam.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{exam.title}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {exam.courseName}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={exam.status} />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(exam.startTime, 'PPp', locale)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Link to={`/teacher/exams/${exam.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            {t('common.edit')}
                          </Button>
                        </Link>
                        {(exam.status === 'ACTIVE' || exam.status === 'PUBLISHED') && (
                          <Link to={`/teacher/monitoring/${exam.id}`}>
                            <Button variant="ghost" size="sm">
                              {t('nav.monitoring')}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <AcademicCapIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>{t('exam.noExamsAvailable')}</p>
            <Link to="/teacher/exams/create" className="mt-4 inline-block">
              <Button variant="primary">{t('exam.createExam')}</Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};

// Status Badge Component (backend uses uppercase: DRAFT, PUBLISHED, ACTIVE, COMPLETED)
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const { t } = useTranslation();

  const styles: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    PUBLISHED: 'bg-blue-100 text-blue-700',
    ACTIVE: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-purple-100 text-purple-700',
  };

  const statusLabels: Record<string, string> = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ACTIVE: 'ongoing',
    COMPLETED: 'completed',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status] || styles.DRAFT}`}>
      {t(`exam.${statusLabels[status] || 'draft'}`)}
    </span>
  );
};

export default TeacherDashboardPage;

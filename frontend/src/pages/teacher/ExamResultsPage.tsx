import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import Card, { CardHeader, CardTitle, StatCard } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import { PageLoading } from '../../components/ui/Loading';
import examService from '../../services/exam.service';
import toast from 'react-hot-toast';
import { format, isValid } from 'date-fns';

// Helper function to safely format dates
const formatDateSafe = (dateValue: string | Date | null | undefined, formatStr: string): string => {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (!isValid(date)) return '-';
  return format(date, formatStr);
};

const TeacherExamResultsPage: React.FC = () => {
  const { t } = useTranslation();
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Fetch exam details
  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: ['exam', examId],
    queryFn: () => examService.getExamWithQuestions(examId!),
    enabled: !!examId,
  });

  // Fetch exam statistics
  const { data: stats } = useQuery({
    queryKey: ['exam-stats', examId],
    queryFn: () => examService.getExamStatistics(examId!),
    enabled: !!examId,
  });

  // Fetch attempts
  const { data: attemptsData, isLoading: attemptsLoading } = useQuery({
    queryKey: ['exam-attempts', examId, statusFilter, page],
    queryFn: () =>
      examService.getAttemptsForGrading(examId!, {
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit: 20,
      }),
    enabled: !!examId,
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: (format: 'csv' | 'xlsx' | 'pdf') => examService.exportResults(examId!, format),
    onSuccess: (blob, format) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exam-results-${examId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t('exam.exportSuccess') || 'Results exported');
    },
    onError: () => {
      toast.error(t('exam.exportFailed') || 'Failed to export results');
    },
  });

  const isLoading = examLoading || attemptsLoading;

  if (isLoading) {
    return <PageLoading />;
  }

  const attempts = attemptsData?.data || [];
  const totalPages = attemptsData?.meta?.totalPages || 1;

  // Status options
  const statusOptions = [
    { value: 'all', label: t('common.all') || 'All' },
    { value: 'COMPLETED', label: t('exam.completed') },
    { value: 'GRADED', label: t('grading.graded') },
    { value: 'IN_PROGRESS', label: t('exam.inProgress') },
  ];

  // Status badge component
  const StatusBadge: React.FC<{ status: string; needsGrading?: boolean }> = ({
    status,
    needsGrading,
  }) => {
    if (needsGrading) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-700 flex items-center gap-1">
          <ExclamationCircleIcon className="h-3 w-3" />
          {t('grading.needsGrading')}
        </span>
      );
    }

    const styles: Record<string, string> = {
      COMPLETED: 'bg-blue-100 text-blue-700',
      GRADED: 'bg-green-100 text-green-700',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status === 'GRADED' ? t('grading.graded') : status === 'COMPLETED' ? t('exam.completed') : t('exam.inProgress')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
          >
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('exam.results') || 'Exam Results'}
            </h1>
            <p className="text-gray-500">{exam?.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />}
            onClick={() => exportMutation.mutate('csv')}
            isLoading={exportMutation.isPending}
          >
            {t('common.export')} CSV
          </Button>
          <Button
            variant="outline"
            leftIcon={<ArrowDownTrayIcon className="h-5 w-5" />}
            onClick={() => exportMutation.mutate('xlsx')}
            isLoading={exportMutation.isPending}
          >
            {t('common.export')} Excel
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t('exam.totalStudents')}
            value={stats.totalStudents}
            icon={<UsersIcon className="h-6 w-6" />}
          />
          <StatCard
            title={t('exam.submitted')}
            value={stats.submitted}
            icon={<CheckCircleIcon className="h-6 w-6" />}
          />
          <StatCard
            title={t('exam.averageScore')}
            value={`${stats.averageScore.toFixed(1)}%`}
            icon={<ChartBarIcon className="h-6 w-6" />}
          />
          <StatCard
            title={t('dashboard.passRate')}
            value={`${stats.passRate.toFixed(1)}%`}
            icon={<CheckCircleIcon className="h-6 w-6" />}
            trend={stats.passRate >= 50 ? { value: stats.passRate, isPositive: true } : { value: stats.passRate, isPositive: false }}
          />
        </div>
      )}

      {/* Score Distribution */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>{t('exam.scoreDistribution')}</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{stats.highestScore}%</p>
              <p className="text-sm text-gray-500">{t('exam.highestScore')}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{stats.averageScore.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">{t('exam.averageScore')}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{stats.lowestScore}%</p>
              <p className="text-sm text-gray-500">{t('exam.lowestScore')}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input placeholder={t('common.search')} />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </Card>

      {/* Submissions Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                  {t('common.student')}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                  {t('auth.studentId')}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                  {t('exam.score')}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                  {t('exam.submittedAt')}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                  {t('common.status')}
                </th>
                <th className="text-start py-3 px-4 text-sm font-medium text-gray-500">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => (
                <tr
                  key={attempt.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 font-medium">
                          {attempt.student.nameEn?.charAt(0) || 'S'}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {attempt.student.nameEn}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {attempt.student.studentNumber}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">
                      {attempt.score !== null ? `${attempt.score}%` : '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {formatDateSafe(attempt.submittedAt, 'PPp')}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge
                      status={attempt.status}
                      needsGrading={attempt.needsManualGrading}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <Link to={`/teacher/exams/${examId}/grade/${attempt.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<PencilSquareIcon className="h-4 w-4" />}
                      >
                        {attempt.needsManualGrading
                          ? t('grading.grade')
                          : t('common.view')}
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {attempts.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('exam.noSubmissions')}
            </h3>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              {t('common.previous')}
            </Button>
            <span className="text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              {t('common.next')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TeacherExamResultsPage;

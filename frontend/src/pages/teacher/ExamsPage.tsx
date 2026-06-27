import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AcademicCapIcon,
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import { ConfirmModal } from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import { PageLoading, SkeletonCard } from '../../components/ui/Loading';
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

const TeacherExamsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const locale = i18n.language === 'ar' ? ar : enUS;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteExam, setDeleteExam] = useState<Exam | null>(null);

  // Fetch teacher's exams
  const { data: examsData, isLoading } = useQuery({
    queryKey: ['teacherExams'],
    queryFn: () => examService.getTeacherExams(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (examId: string) => examService.deleteExam(examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherExams'] });
      setDeleteExam(null);
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: (examId: string) => examService.publishExam(examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherExams'] });
    },
  });

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: (examId: string) => examService.activateExam(examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherExams'] });
    },
  });

  const exams = examsData?.data || [];

  // Filter exams (with null-safe checks)
  const filteredExams = exams.filter((exam: Exam) => {
    const matchesSearch =
      (exam.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (exam.courseName?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || exam.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Status options (backend uses uppercase: DRAFT, PUBLISHED, ACTIVE, COMPLETED)
  const statusOptions = [
    { value: 'all', label: t('common.all') || 'All' },
    { value: 'DRAFT', label: t('exam.draft') },
    { value: 'PUBLISHED', label: t('exam.published') },
    { value: 'ACTIVE', label: t('exam.ongoing') },
    { value: 'COMPLETED', label: t('exam.completed') },
  ];

  // Status badge component (backend uses uppercase: DRAFT, PUBLISHED, ACTIVE, COMPLETED)
  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      PUBLISHED: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
      ACTIVE: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
      COMPLETED: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
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

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.exams')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('teacher.createdExams')}</p>
        </div>
        <Link to="/teacher/exams/create">
          <Button leftIcon={<PlusCircleIcon className="h-5 w-5" />}>
            {t('exam.createExam')}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Exams List */}
      {filteredExams.length > 0 ? (
        <div className="space-y-4">
          {filteredExams.map((exam: Exam) => (
            <Card key={exam.id}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Exam Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
                      <AcademicCapIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {exam.title}
                        </h3>
                        <StatusBadge status={exam.status} />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{exam.courseName}</p>
                    </div>
                  </div>

                  {/* Exam Details */}
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{exam.totalQuestions} {t('exam.totalQuestions')}</span>
                    <span>{exam.totalMarks} {t('exam.marks')}</span>
                    <span>{exam.duration} {t('exam.minutes')}</span>
                    <span>
                      {formatDate(exam.startTime, 'PPp', locale)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {exam.status === 'DRAFT' && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<ArrowUpTrayIcon className="h-4 w-4" />}
                      onClick={() => publishMutation.mutate(exam.id)}
                      isLoading={publishMutation.isPending}
                    >
                      {t('exam.publish') || 'Publish'}
                    </Button>
                  )}
                  {exam.status === 'PUBLISHED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<PlayIcon className="h-4 w-4" />}
                      onClick={() => activateMutation.mutate(exam.id)}
                      isLoading={activateMutation.isPending}
                    >
                      {t('exam.activate') || 'Activate'}
                    </Button>
                  )}
                  {(exam.status === 'ACTIVE' || exam.status === 'PUBLISHED') && (
                    <Link to={`/teacher/monitoring/${exam.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<EyeIcon className="h-4 w-4" />}
                      >
                        {t('nav.monitoring')}
                      </Button>
                    </Link>
                  )}
                  {exam.status === 'COMPLETED' && (
                    <Link to={`/teacher/exams/${exam.id}/results`}>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<ChartBarIcon className="h-4 w-4" />}
                      >
                        {t('exam.results')}
                      </Button>
                    </Link>
                  )}
                  <Link to={`/teacher/exams/${exam.id}/edit`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<PencilIcon className="h-4 w-4" />}
                    >
                      {t('common.edit')}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<TrashIcon className="h-4 w-4 text-red-500" />}
                    onClick={() => setDeleteExam(exam)}
                    disabled={exam.status === 'ACTIVE'}
                  >
                    <span className="text-red-500">{t('common.delete')}</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <AcademicCapIcon className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('exam.noExamsAvailable')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{t('common.noData')}</p>
            <Link to="/teacher/exams/create">
              <Button leftIcon={<PlusCircleIcon className="h-5 w-5" />}>
                {t('exam.createExam')}
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteExam}
        onClose={() => setDeleteExam(null)}
        onConfirm={() => deleteExam && deleteMutation.mutate(deleteExam.id)}
        title={t('exam.deleteExam')}
        message={`${t('exam.deleteExam')}: ${deleteExam?.title}?`}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};

export default TeacherExamsPage;

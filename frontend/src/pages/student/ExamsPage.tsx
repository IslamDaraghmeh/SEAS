import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AcademicCapIcon,
  ClockIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import { PageLoading, SkeletonCard } from '../../components/ui/Loading';
import examService, { Exam } from '../../services/exam.service';
import verificationService from '../../services/verification.service';
import { format, isAfter, isBefore, isWithinInterval, isValid, Locale } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

// Helper function to safely format dates
const formatDate = (dateValue: string | Date | null | undefined, formatStr: string, locale: Locale): string => {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (!isValid(date)) return '-';
  return format(date, formatStr, { locale });
};

const StudentExamsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ar' ? ar : enUS;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Check face registration status
  const { data: faceStatus, isLoading: faceStatusLoading } = useQuery({
    queryKey: ['faceRegistrationStatus'],
    queryFn: () => verificationService.hasRegisteredFace(),
  });

  const isFaceRegistered = faceStatus?.isRegistered ?? false;

  // Fetch available exams
  const { data: examsData, isLoading } = useQuery({
    queryKey: ['availableExams'],
    queryFn: () => examService.getAvailableExams(),
  });

  const exams = examsData?.data || [];

  // Get exam status
  const getExamStatus = (exam: Exam) => {
    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(exam.endTime);

    if (isBefore(now, start)) return 'scheduled';
    if (isWithinInterval(now, { start, end })) return 'ongoing';
    return 'completed';
  };

  // Filter exams (with null-safe checks)
  const filteredExams = exams.filter((exam: Exam) => {
    const matchesSearch =
      (exam.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (exam.courseName?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const status = getExamStatus(exam);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Status options
  const statusOptions = [
    { value: 'all', label: t('common.all') || 'All' },
    { value: 'scheduled', label: t('exam.scheduled') },
    { value: 'ongoing', label: t('exam.ongoing') },
    { value: 'completed', label: t('exam.completed') },
  ];

  // Status badge component
  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-700',
      ongoing: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded ${
          styles[status as keyof typeof styles]
        }`}
      >
        {t(`exam.${status}`)}
      </span>
    );
  };

  if (isLoading || faceStatusLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Face Registration Required Warning */}
      {!isFaceRegistered && (
        <Alert variant="warning">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-800">
                  {t('verification.faceNotRegistered')}
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  {t('verification.faceRequiredForExams')}
                </p>
              </div>
            </div>
            <Link to="/student/face-registration">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<UserCircleIcon className="h-4 w-4" />}
              >
                {t('verification.registerFace')}
              </Button>
            </Link>
          </div>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.exams')}</h1>
          <p className="text-gray-500 mt-1">
            {filteredExams.length} {t('exam.noExamsAvailable').replace('لا توجد ', '')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
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
        <div className="grid gap-4">
          {filteredExams.map((exam: Exam) => {
            const status = getExamStatus(exam);
            const canStart = status === 'ongoing';

            return (
              <Card key={exam.id} hoverable>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Exam Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary-100 rounded-lg">
                        <AcademicCapIcon className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {exam.title}
                          </h3>
                          <StatusBadge status={status} />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {exam.courseName} | {exam.teacherName}
                        </p>
                      </div>
                    </div>

                    {/* Exam Details */}
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {formatDate(exam.startTime, 'PPp', locale)}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        {exam.duration} {t('exam.minutes')}
                      </span>
                      <span>
                        {exam.totalQuestions} {t('exam.totalQuestions')}
                      </span>
                      <span>
                        {exam.totalMarks} {t('exam.marks')}
                      </span>
                    </div>

                    {/* Instructions Preview */}
                    {exam.instructions && (
                      <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                        {exam.instructions}
                      </p>
                    )}
                  </div>

                  {/* Action */}
                  <div className="flex items-center gap-3">
                    {canStart ? (
                      isFaceRegistered ? (
                        <Link to={`/student/exams/${exam.id}`}>
                          <Button variant="primary">{t('exam.startExam')}</Button>
                        </Link>
                      ) : (
                        <Button variant="primary" disabled title={t('verification.faceRequiredForExams')}>
                          {t('exam.startExam')}
                        </Button>
                      )
                    ) : status === 'scheduled' ? (
                      <Button variant="outline" disabled>
                        {t('exam.examNotStarted')}
                      </Button>
                    ) : (
                      <Button variant="ghost" disabled>
                        {t('exam.examEnded')}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <AcademicCapIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('exam.noExamsAvailable')}
            </h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all'
                ? t('common.noData')
                : t('exam.noExamsAvailable')}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default StudentExamsPage;

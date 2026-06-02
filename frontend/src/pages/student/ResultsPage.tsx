import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import { PageLoading, SkeletonCard } from '../../components/ui/Loading';
import examService, { ExamResult } from '../../services/exam.service';
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

const StudentResultsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ar' ? ar : enUS;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);

  // Check face registration status
  const { data: faceStatus, isLoading: faceStatusLoading } = useQuery({
    queryKey: ['faceRegistrationStatus'],
    queryFn: () => verificationService.hasRegisteredFace(),
  });

  const isFaceRegistered = faceStatus?.isRegistered ?? false;

  // Fetch results
  const { data: resultsData, isLoading } = useQuery({
    queryKey: ['myResults'],
    queryFn: () => examService.getMyResults(),
    enabled: isFaceRegistered,
  });

  const results = resultsData?.data || [];

  // Filter results (with null-safe check)
  const filteredResults = results.filter((result: ExamResult) =>
    (result.examTitle?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // Calculate overall stats
  const stats = {
    total: results.length,
    passed: results.filter((r: ExamResult) => r.passed).length,
    failed: results.filter((r: ExamResult) => !r.passed).length,
    averageScore: results.length
      ? Math.round(
          results.reduce((acc: number, r: ExamResult) => acc + r.percentage, 0) /
            results.length
        )
      : 0,
  };

  // Format time taken
  const formatTimeTaken = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading || faceStatusLoading) {
    return <PageLoading />;
  }

  // Face registration required check
  if (!isFaceRegistered) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('results.title')}</h1>
          <p className="text-gray-500 mt-1">{t('nav.results')}</p>
        </div>

        {/* Face Registration Required */}
        <Card className="text-center">
          <div className="p-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center">
              <UserCircleIcon className="h-12 w-12 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {t('verification.faceNotRegistered')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('verification.faceRequiredForResults')}
            </p>
            <Link to="/student/face-registration">
              <Button
                variant="primary"
                size="lg"
                leftIcon={<UserCircleIcon className="h-5 w-5" />}
              >
                {t('verification.registerFace')}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('results.title')}</h1>
        <p className="text-gray-500 mt-1">{t('nav.results')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary-50 border-primary-200">
          <div className="text-center">
            <p className="text-sm text-primary-600">{t('dashboard.completedExams')}</p>
            <p className="text-3xl font-bold text-primary-700 mt-1">{stats.total}</p>
          </div>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <div className="text-center">
            <p className="text-sm text-green-600">{t('results.passed')}</p>
            <p className="text-3xl font-bold text-green-700 mt-1">{stats.passed}</p>
          </div>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <div className="text-center">
            <p className="text-sm text-red-600">{t('results.failed')}</p>
            <p className="text-3xl font-bold text-red-700 mt-1">{stats.failed}</p>
          </div>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <div className="text-center">
            <p className="text-sm text-blue-600">{t('dashboard.averageScore')}</p>
            <p className="text-3xl font-bold text-blue-700 mt-1">{stats.averageScore}%</p>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card padding="sm">
        <Input
          placeholder={t('common.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Card>

      {/* Results List */}
      {filteredResults.length > 0 ? (
        <div className="space-y-4">
          {filteredResults.map((result: ExamResult) => (
            <Card key={result.id} hoverable onClick={() => setSelectedResult(result)}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Result Info */}
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-lg ${
                      result.passed ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    {result.passed ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircleIcon className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{result.examTitle}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(result.submittedAt, 'PPp', locale)}
                    </p>
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">{t('results.score')}</p>
                    <p
                      className={`text-2xl font-bold ${
                        result.passed ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {result.score}/{result.totalMarks}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">{t('results.percentage')}</p>
                    <p
                      className={`text-2xl font-bold ${
                        result.passed ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {result.percentage}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">{t('results.grade')}</p>
                    <p className="text-2xl font-bold text-primary-600">{result.grade}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      result.passed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {result.passed ? t('results.passed') : t('results.failed')}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-6 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  {result.correctAnswers} {t('results.correctAnswers')}
                </span>
                <span className="flex items-center gap-1">
                  <XCircleIcon className="h-4 w-4 text-red-500" />
                  {result.wrongAnswers} {t('results.wrongAnswers')}
                </span>
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  {formatTimeTaken(result.timeTaken)} {t('results.timeTaken')}
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <ChartBarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('results.noResults')}
            </h3>
            <p className="text-gray-500">{t('common.noData')}</p>
          </div>
        </Card>
      )}

      {/* Result Details Modal */}
      {selectedResult && (
        <Modal
          isOpen={!!selectedResult}
          onClose={() => setSelectedResult(null)}
          title={selectedResult.examTitle}
          size="lg"
        >
          <div className="space-y-6">
            {/* Score Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">{t('results.score')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedResult.score}/{selectedResult.totalMarks}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">{t('results.percentage')}</p>
                <p
                  className={`text-2xl font-bold ${
                    selectedResult.passed ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {selectedResult.percentage}%
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">{t('results.grade')}</p>
                <p className="text-2xl font-bold text-primary-600">
                  {selectedResult.grade}
                </p>
              </div>
            </div>

            {/* Answer Breakdown */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-700">
                    {selectedResult.correctAnswers}
                  </p>
                  <p className="text-sm text-green-600">{t('results.correctAnswers')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <XCircleIcon className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-700">
                    {selectedResult.wrongAnswers}
                  </p>
                  <p className="text-sm text-red-600">{t('results.wrongAnswers')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <ClockIcon className="h-8 w-8 text-gray-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-700">
                    {selectedResult.unanswered}
                  </p>
                  <p className="text-sm text-gray-600">{t('results.unanswered')}</p>
                </div>
              </div>
            </div>

            {/* Time & Date */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">{t('results.timeTaken')}</p>
                  <p className="text-lg font-semibold text-blue-700">
                    {formatTimeTaken(selectedResult.timeTaken)}
                  </p>
                </div>
                <div className="text-end">
                  <p className="text-sm text-blue-600">{t('results.submittedAt')}</p>
                  <p className="text-lg font-semibold text-blue-700">
                    {formatDate(selectedResult.submittedAt, 'PPp', locale)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                leftIcon={<DocumentArrowDownIcon className="h-5 w-5" />}
                onClick={() => {
                  // Download certificate logic
                }}
              >
                {t('results.downloadCertificate')}
              </Button>
              <Button variant="primary" onClick={() => setSelectedResult(null)}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StudentResultsPage;

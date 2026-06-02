import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { Textarea } from '../../components/ui/Input';
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

const TeacherGradingPage: React.FC = () => {
  const { t } = useTranslation();
  const { examId, attemptId } = useParams<{ examId: string; attemptId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [grades, setGrades] = useState<Record<string, { points: number; feedback: string }>>({});

  // Fetch attempt for grading
  const { data: attempt, isLoading } = useQuery({
    queryKey: ['attempt-grading', attemptId],
    queryFn: () => examService.getAttemptForGrading(attemptId!),
    enabled: !!attemptId,
  });

  // Grade answer mutation
  const gradeMutation = useMutation({
    mutationFn: async ({ answerId, points, feedback }: { answerId: string; points: number; feedback?: string }) => {
      await examService.gradeAnswer(attemptId!, answerId, { pointsAwarded: points, feedback });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attempt-grading', attemptId] });
      toast.success(t('grading.answerGraded') || 'Answer graded');
    },
    onError: () => {
      toast.error(t('grading.gradeFailed') || 'Failed to grade answer');
    },
  });

  // Finalize grading mutation
  const finalizeMutation = useMutation({
    mutationFn: () => examService.finalizeGrading(attemptId!),
    onSuccess: () => {
      toast.success(t('grading.finalized') || 'Grading finalized');
      navigate(`/teacher/exams/${examId}/results`);
    },
    onError: () => {
      toast.error(t('grading.finalizeFailed') || 'Failed to finalize grading');
    },
  });

  // Handle grade change
  const handleGradeChange = (answerId: string, field: 'points' | 'feedback', value: string | number) => {
    setGrades((prev) => ({
      ...prev,
      [answerId]: {
        ...prev[answerId],
        [field]: value,
      },
    }));
  };

  // Submit individual grade
  const handleSubmitGrade = (answerId: string, maxPoints: number) => {
    const grade = grades[answerId];
    if (!grade || grade.points === undefined) {
      toast.error(t('grading.enterPoints') || 'Please enter points');
      return;
    }
    if (grade.points < 0 || grade.points > maxPoints) {
      toast.error(t('grading.invalidPoints') || `Points must be between 0 and ${maxPoints}`);
      return;
    }
    gradeMutation.mutate({
      answerId,
      points: grade.points,
      feedback: grade.feedback,
    });
  };

  if (isLoading || !attempt) {
    return <PageLoading />;
  }

  // Get questions that need manual grading (essay, short_answer)
  const manualGradingQuestions = attempt.answers.filter(
    (a) => a.question.type === 'essay' || a.question.type === 'short_answer'
  );

  // Calculate current score
  const totalPoints = attempt.answers.reduce((sum, a) => sum + a.question.marks, 0);
  const gradedPoints = attempt.answers.reduce((sum, a) => sum + (a.pointsAwarded || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
        >
          {t('common.back')}
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('grading.title') || 'Grade Submission'}
          </h1>
          <p className="text-gray-500">{attempt.exam.titleEn}</p>
        </div>
      </div>

      {/* Student Info Card */}
      <Card>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <UserIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('common.student')}</p>
              <p className="font-medium text-gray-900">{attempt.student.nameEn}</p>
              <p className="text-sm text-gray-500">{attempt.student.studentNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('exam.submittedAt')}</p>
              <p className="font-medium text-gray-900">
                {formatDateSafe(attempt.submittedAt, 'PPpp')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('exam.score')}</p>
              <p className="font-medium text-gray-900">
                {gradedPoints} / {totalPoints}
              </p>
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              attempt.status === 'GRADED'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {attempt.status === 'GRADED' ? t('grading.graded') : t('grading.pendingGrading')}
          </div>
        </div>
      </Card>

      {/* Questions to Grade */}
      {manualGradingQuestions.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('grading.questionsToGrade') || 'Questions to Grade'}
          </h2>

          {manualGradingQuestions.map((answer, index) => (
            <Card key={answer.id}>
              <div className="space-y-4">
                {/* Question */}
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full text-primary-700 font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          answer.question.type === 'essay'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {answer.question.type === 'essay' ? t('question.essay') : t('question.shortAnswer')}
                      </span>
                      <span className="text-sm text-gray-500">
                        {answer.question.marks} {t('exam.marks')}
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium">{answer.question.text}</p>
                  </div>
                </div>

                {/* Student Answer */}
                <div className="ml-11">
                  <p className="text-sm text-gray-500 mb-2">{t('grading.studentAnswer')}:</p>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {answer.answerText || <span className="text-gray-400 italic">{t('grading.noAnswer')}</span>}
                    </p>
                  </div>
                </div>

                {/* Grading Form */}
                <div className="ml-11 p-4 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Input
                        label={`${t('grading.points')} (0-${answer.question.marks})`}
                        type="number"
                        min={0}
                        max={answer.question.marks}
                        value={grades[answer.id]?.points ?? answer.pointsAwarded ?? ''}
                        onChange={(e) =>
                          handleGradeChange(answer.id, 'points', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Textarea
                        label={t('grading.feedback')}
                        rows={2}
                        value={grades[answer.id]?.feedback ?? answer.feedback ?? ''}
                        onChange={(e) => handleGradeChange(answer.id, 'feedback', e.target.value)}
                        placeholder={t('grading.feedbackPlaceholder')}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button
                      size="sm"
                      onClick={() => handleSubmitGrade(answer.id, answer.question.marks)}
                      isLoading={gradeMutation.isPending}
                      leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                    >
                      {t('grading.saveGrade')}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-8">
            <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              {t('grading.allAutoGraded') || 'All questions were auto-graded'}
            </h3>
            <p className="text-gray-500 mt-2">
              {t('grading.noManualGrading') || 'No manual grading required for this submission'}
            </p>
          </div>
        </Card>
      )}

      {/* All Answers Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t('grading.allAnswers') || 'All Answers'}</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          {attempt.answers.map((answer, index) => (
            <div
              key={answer.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full text-sm font-medium">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm text-gray-600 truncate max-w-md">
                    {answer.question.text}
                  </p>
                  <span
                    className={`text-xs ${
                      answer.isCorrect === true
                        ? 'text-green-600'
                        : answer.isCorrect === false
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {answer.question.type}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {answer.pointsAwarded ?? '-'} / {answer.question.marks}
                </p>
                {answer.isCorrect !== null && (
                  <span
                    className={`text-xs ${
                      answer.isCorrect ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {answer.isCorrect ? t('common.correct') : t('common.incorrect')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={() => finalizeMutation.mutate()}
          isLoading={finalizeMutation.isPending}
          leftIcon={<CheckCircleIcon className="h-5 w-5" />}
        >
          {t('grading.finalize') || 'Finalize Grading'}
        </Button>
      </div>
    </div>
  );
};

export default TeacherGradingPage;

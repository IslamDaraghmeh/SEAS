import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  VideoCameraIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { PageLoading } from '../../components/ui/Loading';
import { ConfirmModal } from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import QuestionCard from '../../components/exam/QuestionCard';
import ExamTimer from '../../components/exam/ExamTimer';
import VerificationCamera from '../../components/exam/VerificationCamera';
import examService, { ExamWithQuestions, Answer } from '../../services/exam.service';
import verificationService from '../../services/verification.service';
import { studentSocket } from '../../services/student.socket';
import { useAuth } from '../../hooks/useAuth';

const StudentExamPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isRTL = i18n.language === 'ar';

  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number | null>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [examStartTime, setExamStartTime] = useState<Date | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Check face registration status
  const { data: faceStatus, isLoading: faceStatusLoading } = useQuery({
    queryKey: ['faceRegistrationStatus'],
    queryFn: () => verificationService.hasRegisteredFace(),
  });

  const isFaceRegistered = faceStatus?.isRegistered ?? false;

  // Fetch exam data
  const { data: exam, isLoading, error } = useQuery({
    queryKey: ['exam', examId],
    queryFn: () => examService.getExamForTaking(examId!),
    enabled: !!examId && isFaceRegistered,
  });

  // Start exam mutation
  const startExamMutation = useMutation({
    mutationFn: () => examService.startExam(examId!),
    onSuccess: async (data) => {
      setExamStartTime(new Date(data.startedAt));
      setAttemptId(data.attemptId);

      // Connect to WebSocket for monitoring
      if (token && data.attemptId) {
        try {
          await studentSocket.connect(token);
          const joined = await studentSocket.joinExam(data.attemptId, examId!);
          if (joined) {
            setIsSocketConnected(true);
            console.log('Connected to exam monitoring');
          }
        } catch (error) {
          console.error('Failed to connect to exam monitoring:', error);
        }
      }
    },
  });

  // Submit exam mutation
  const submitExamMutation = useMutation({
    mutationFn: (submission: { examId: string; answers: Answer[]; timeTaken: number }) =>
      examService.submitExam(submission),
    onSuccess: () => {
      navigate('/student/results');
    },
  });

  // Start exam on mount
  useEffect(() => {
    if (exam && !examStartTime) {
      startExamMutation.mutate();
    }
  }, [exam]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      studentSocket.leaveExam();
    };
  }, []);

  // Current question
  const currentQuestion = exam?.questions[currentQuestionIndex];

  // Handle answer selection
  const handleAnswerSelect = useCallback(
    (questionId: string, answer: string | number) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: answer,
      }));

      // Find question type for proper answer format
      const question = exam?.questions.find(q => q.id === questionId);
      const questionType = question?.type;

      // Auto-save answer
      examService.saveAnswer(examId!, questionId, answer, questionType).catch(console.error);
    },
    [examId, exam?.questions]
  );

  // Handle flag toggle
  const handleToggleFlag = useCallback((questionId: string) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  }, []);

  // Navigate questions
  const goToQuestion = (index: number) => {
    if (index >= 0 && exam && index < exam.questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // Handle time up
  const handleTimeUp = useCallback(() => {
    handleSubmitExam();
  }, []);

  // Handle submit
  const handleSubmitExam = useCallback(() => {
    if (!exam || !examStartTime) return;

    const timeTaken = Math.floor((Date.now() - examStartTime.getTime()) / 1000);
    const answersList: Answer[] = exam.questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? null,
    }));

    submitExamMutation.mutate({
      examId: exam.id,
      answers: answersList,
      timeTaken,
    });
  }, [exam, examStartTime, answers, submitExamMutation]);

  // Calculate progress
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = exam?.questions.length || 0;
  const progressPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  if (isLoading || faceStatusLoading) {
    return <PageLoading />;
  }

  // Face registration required check
  if (!isFaceRegistered) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="text-center">
          <div className="p-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center">
              <UserCircleIcon className="h-12 w-12 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {t('verification.faceNotRegistered')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('verification.faceRequiredForExams')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/student/face-registration">
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<UserCircleIcon className="h-5 w-5" />}
                >
                  {t('verification.registerFace')}
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/student/exams')}
              >
                {t('common.back')}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="text-center py-12">
        <Alert variant="error" message={t('errors.notFound')} />
        <Button onClick={() => navigate('/student/exams')} className="mt-4">
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Exam Header */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{exam.title}</h1>
            <p className="text-sm text-gray-500">{exam.courseName}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Monitoring Indicator */}
            {exam.requiresVerification && isSocketConnected && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <VideoCameraIcon className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium text-red-600">
                  {t('monitoring.liveCameras') || 'Live'}
                </span>
              </div>
            )}
            {/* Progress */}
            <div className="text-sm text-gray-600">
              <span className="font-medium">{answeredCount}</span> / {totalQuestions}{' '}
              {t('exam.answer')}
            </div>
            {/* Timer */}
            {examStartTime && (
              <ExamTimer
                duration={exam.duration}
                startTime={examStartTime}
                onTimeUp={handleTimeUp}
              />
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question Card */}
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={totalQuestions}
              selectedAnswer={answers[currentQuestion.id] ?? null}
              onAnswerSelect={(answer) =>
                handleAnswerSelect(currentQuestion.id, answer)
              }
              isFlagged={flaggedQuestions.has(currentQuestion.id)}
              onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
            />
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => goToQuestion(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              leftIcon={isRTL ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
            >
              {t('exam.previousQuestion')}
            </Button>

            {currentQuestionIndex === totalQuestions - 1 ? (
              <Button
                variant="primary"
                onClick={() => setShowSubmitModal(true)}
                rightIcon={<PaperAirplaneIcon className="h-5 w-5" />}
              >
                {t('exam.submitExam')}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => goToQuestion(currentQuestionIndex + 1)}
                rightIcon={isRTL ? <ChevronLeftIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
              >
                {t('exam.nextQuestion')}
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Question Navigator */}
          <Card>
            <h3 className="font-medium text-gray-900 mb-4">
              {t('exam.reviewAnswers')}
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((q, index) => {
                const isAnswered = answers[q.id] !== undefined;
                const isFlagged = flaggedQuestions.has(q.id);
                const isCurrent = index === currentQuestionIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(index)}
                    className={`
                      w-10 h-10 rounded-lg font-medium text-sm transition-colors relative
                      ${
                        isCurrent
                          ? 'bg-primary-600 text-white'
                          : isAnswered
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    {index + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -end-1 w-3 h-3 bg-yellow-400 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-green-100 rounded" />
                <span className="text-gray-600">{t('exam.answer')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-gray-100 rounded" />
                <span className="text-gray-600">{t('results.unanswered')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-yellow-400 rounded-full" />
                <span className="text-gray-600">{t('exam.flagQuestion')}</span>
              </div>
            </div>
          </Card>

          {/* Verification Camera - Always visible for proctored exams */}
          {exam.requiresVerification && (
            <div className="space-y-2">
              <VerificationCamera
                examId={exam.id}
                attemptId={attemptId || undefined}
                autoVerify
                verificationInterval={exam.verificationInterval ? exam.verificationInterval * 60 : 300}
                enableStreaming={isSocketConnected}
                streamInterval={3000}
                onVerificationComplete={(success) => {
                  if (!success) {
                    // Handle failed verification
                    console.log('Verification failed');
                    // Report to proctors
                    studentSocket.reportActivity('VERIFICATION_FAILED');
                  }
                }}
              />
              {/* Connection Status */}
              <div className={`text-xs text-center px-2 py-1 rounded ${
                isSocketConnected
                  ? 'bg-green-50 text-green-700'
                  : 'bg-yellow-50 text-yellow-700'
              }`}>
                {isSocketConnected
                  ? t('monitoring.connected') || 'Connected to monitoring'
                  : t('monitoring.connectionFailed') || 'Connecting to monitoring...'}
              </div>
            </div>
          )}

          {/* Warning */}
          <Alert
            variant="warning"
            message={t('verification.verificationWarning')}
            showIcon
          />
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <ConfirmModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleSubmitExam}
        title={t('exam.submitExam')}
        message={`${t('exam.confirmSubmit')} (${answeredCount}/${totalQuestions} ${t('exam.answer')})`}
        confirmText={t('exam.submitExam')}
        cancelText={t('common.cancel')}
        isLoading={submitExamMutation.isPending}
        variant="info"
      />
    </div>
  );
};

export default StudentExamPage;

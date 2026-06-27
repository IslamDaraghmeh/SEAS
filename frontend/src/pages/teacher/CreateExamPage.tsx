import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusCircleIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { Textarea, Select } from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import { PageLoading } from '../../components/ui/Loading';
import examService, { Question } from '../../services/exam.service';
import courseService from '../../services/course.service';

// Validation schema for exam
const examSchema = z.object({
  title: z.string().min(3, 'validation.minLength'),
  description: z.string().optional(),
  courseId: z.string().min(1, 'errors.required'),
  duration: z.number().min(5, 'validation.min').max(300, 'validation.max'),
  startTime: z.string().min(1, 'errors.required'),
  endTime: z.string().min(1, 'errors.required'),
  totalMarks: z.number().min(1, 'validation.min'),
  passingMarks: z.number().min(1, 'validation.min'),
  instructions: z.string().optional(),
  requiresVerification: z.boolean().default(true),
  verificationInterval: z.number().optional(),
});

type ExamFormData = z.infer<typeof examSchema>;

// Question form schema
const questionSchema = z.object({
  text: z.string().min(1, 'errors.required'),
  type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'essay']),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.number()]).optional(),
  marks: z.number().min(1, 'validation.min'),
});

type QuestionFormData = z.infer<typeof questionSchema>;

const CreateExamPage: React.FC = () => {
  const { t } = useTranslation();
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!examId;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<QuestionFormData> | null>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch exam data if editing
  const { data: examData, isLoading: examLoading } = useQuery({
    queryKey: ['exam', examId],
    queryFn: () => examService.getExamWithQuestions(examId!),
    enabled: isEditing,
  });

  // Fetch teacher's courses
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['teacherCourses'],
    queryFn: () => courseService.getMyCourses(),
  });

  // Form for exam details
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      duration: 60,
      totalMarks: 100,
      passingMarks: 50,
      requiresVerification: true,
      verificationInterval: 5,
    },
  });

  // Helper function to format date for datetime-local input
  const formatDateForInput = (dateValue: string | Date | null | undefined): string => {
    if (!dateValue) return '';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      // Format as YYYY-MM-DDTHH:mm for datetime-local input
      return date.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  // Load exam data when editing
  useEffect(() => {
    if (examData) {
      setValue('title', examData.title || '');
      setValue('description', examData.description || '');
      setValue('courseId', examData.courseId || '');
      setValue('duration', examData.duration || 60);
      setValue('startTime', formatDateForInput(examData.startTime));
      setValue('endTime', formatDateForInput(examData.endTime));
      setValue('totalMarks', examData.totalMarks || 100);
      setValue('passingMarks', examData.passingMarks || 50);
      setValue('instructions', examData.instructions || '');
      setValue('requiresVerification', examData.requiresVerification ?? true);
      setValue('verificationInterval', examData.verificationInterval || 5);
      setQuestions(examData.questions || []);
    }
  }, [examData, setValue]);

  // Prepare question data for backend
  const prepareQuestionData = (question: Question, targetExamId: string, order: number) => {
    const questionType = question.type.toUpperCase().replace('_', '_');

    // Handle options based on question type
    let options;
    let correctAnswer;

    if (questionType === 'TRUE_FALSE') {
      // Auto-generate True/False options for true_false questions
      const isTrue = String(question.correctAnswer).toLowerCase() === 'true' || question.correctAnswer === 0;
      options = [
        { textAr: 'صحيح', textEn: 'True', isCorrect: isTrue, order: 0 },
        { textAr: 'خطأ', textEn: 'False', isCorrect: !isTrue, order: 1 },
      ];
    } else if (questionType === 'MULTIPLE_CHOICE') {
      // Filter out empty options and map with isCorrect
      const validOptions = (question.options || []).filter(opt => opt && opt.trim() !== '');
      if (validOptions.length >= 2) {
        options = validOptions.map((opt, idx) => ({
          textAr: opt,
          textEn: opt,
          isCorrect: question.correctAnswer === idx,
          order: idx,
        }));

        // Ensure at least one option is marked as correct
        const hasCorrect = options.some(opt => opt.isCorrect);
        if (!hasCorrect && options.length > 0) {
          options[0].isCorrect = true; // Default to first option if none selected
        }
      }
    } else if (questionType === 'SHORT_ANSWER' || questionType === 'ESSAY') {
      // For text-based questions, use correctAnswer field
      correctAnswer = typeof question.correctAnswer === 'string' ? question.correctAnswer : undefined;
    }

    return {
      examId: targetExamId,
      textAr: question.text,
      textEn: question.text,
      type: questionType,
      points: question.marks || 1,
      order,
      options,
      correctAnswer,
    };
  };

  // Save questions for an exam
  const saveQuestions = async (targetExamId: string, questionsToSave: Question[]) => {
    const errors: string[] = [];

    // Get existing questions if editing
    let existingQuestionIds: string[] = [];
    if (isEditing && examData?.questions) {
      existingQuestionIds = examData.questions.map(q => q.id);
    }

    // Delete removed questions
    for (const existingId of existingQuestionIds) {
      if (!questionsToSave.find(q => q.id === existingId)) {
        try {
          await examService.deleteQuestion(targetExamId, existingId);
        } catch (error: any) {
          console.error('Failed to delete question:', error);
          errors.push(`Failed to delete question: ${error?.response?.data?.message || error.message}`);
        }
      }
    }

    // Add or update questions
    for (let i = 0; i < questionsToSave.length; i++) {
      const question = questionsToSave[i];

      // Validate question before sending
      if (!question.text || question.text.trim() === '') {
        errors.push(`Question ${i + 1}: Text is required`);
        continue;
      }

      const questionType = question.type.toUpperCase();
      if (questionType === 'MULTIPLE_CHOICE') {
        const validOptions = (question.options || []).filter(opt => opt && opt.trim() !== '');
        if (validOptions.length < 2) {
          errors.push(`Question ${i + 1}: Multiple choice questions require at least 2 options`);
          continue;
        }
      }

      const questionData = prepareQuestionData(question, targetExamId, i);

      try {
        if (question.id.startsWith('temp-')) {
          // New question - add it
          await examService.addQuestion(targetExamId, questionData as any);
        } else if (existingQuestionIds.includes(question.id)) {
          // Existing question - update it
          await examService.updateQuestion(targetExamId, question.id, questionData as any);
        } else {
          // New question with non-temp id - add it
          await examService.addQuestion(targetExamId, questionData as any);
        }
      } catch (error: any) {
        console.error('Failed to save question:', error);
        errors.push(`Question ${i + 1}: ${error?.response?.data?.message || error.message || 'Failed to save'}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }
  };

  // Create/Update exam mutation
  const examMutation = useMutation({
    mutationFn: async (data: ExamFormData) => {
      // First create/update the exam
      const savedExam = isEditing
        ? await examService.updateExam(examId!, data as any)
        : await examService.createExam(data as any);

      // Then save questions
      if (questions.length > 0) {
        await saveQuestions(savedExam.id, questions);
      }

      return savedExam;
    },
    onSuccess: () => {
      setAlert({ type: 'success', message: t('common.success') });
      queryClient.invalidateQueries({ queryKey: ['teacherExams'] });
      setTimeout(() => navigate('/teacher/exams'), 1500);
    },
    onError: (error: any) => {
      console.error('Exam save error:', error);
      setAlert({ type: 'error', message: error?.response?.data?.message || t('common.error') });
    },
  });

  // Handle form submit
  const onSubmit = (data: ExamFormData) => {
    examMutation.mutate(data);
  };

  // Question type options
  const questionTypeOptions = [
    { value: 'multiple_choice', label: t('exam.multipleChoice') },
    { value: 'true_false', label: t('exam.trueFalse') },
    { value: 'short_answer', label: t('exam.shortAnswer') },
    { value: 'essay', label: t('exam.essay') },
  ];

  // Add/Edit question
  const handleSaveQuestion = () => {
    if (!currentQuestion || !currentQuestion.text || !currentQuestion.type) return;

    const newQuestion: Question = {
      id: editingQuestionIndex !== null ? questions[editingQuestionIndex].id : `temp-${Date.now()}`,
      examId: examId || '',
      text: currentQuestion.text,
      type: currentQuestion.type,
      options: currentQuestion.options,
      correctAnswer: currentQuestion.correctAnswer,
      marks: currentQuestion.marks || 1,
      order: editingQuestionIndex !== null ? editingQuestionIndex : questions.length,
    };

    if (editingQuestionIndex !== null) {
      const updated = [...questions];
      updated[editingQuestionIndex] = newQuestion;
      setQuestions(updated);
    } else {
      setQuestions([...questions, newQuestion]);
    }

    setCurrentQuestion(null);
    setEditingQuestionIndex(null);
  };

  // Delete question
  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // Edit question
  const handleEditQuestion = (index: number) => {
    setCurrentQuestion(questions[index]);
    setEditingQuestionIndex(index);
  };

  // Course options from API
  const courseOptions = (coursesData?.data || []).map((course) => ({
    value: course.id,
    label: `${course.code} - ${course.nameEn || course.nameAr}`,
  }));

  if (examLoading || coursesLoading) {
    return <PageLoading />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditing ? t('exam.editExam') : t('exam.createExam')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('exam.examDetails')}</p>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <Alert
          variant={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Exam Details Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{t('exam.examDetails')}</CardTitle>
          </CardHeader>

          <div className="space-y-6">
            {/* Title */}
            <Input
              label={t('exam.title')}
              error={errors.title ? t(errors.title.message as string, { min: 3 }) : undefined}
              {...register('title')}
            />

            {/* Description */}
            <Textarea
              label={t('common.description')}
              rows={3}
              {...register('description')}
            />

            {/* Course */}
            <Select
              label={t('exam.course')}
              options={courseOptions}
              error={errors.courseId ? t(errors.courseId.message as string) : undefined}
              {...register('courseId')}
            />

            {/* Duration & Marks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label={`${t('exam.duration')} (${t('exam.minutes')})`}
                type="number"
                error={errors.duration ? t(errors.duration.message as string, { min: 5, max: 300 }) : undefined}
                {...register('duration', { valueAsNumber: true })}
              />
              <Input
                label={t('exam.totalMarks')}
                type="number"
                error={errors.totalMarks ? t(errors.totalMarks.message as string, { min: 1 }) : undefined}
                {...register('totalMarks', { valueAsNumber: true })}
              />
              <Input
                label={t('exam.passingMarks')}
                type="number"
                error={errors.passingMarks ? t(errors.passingMarks.message as string, { min: 1 }) : undefined}
                {...register('passingMarks', { valueAsNumber: true })}
              />
            </div>

            {/* Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('exam.startTime')}
                type="datetime-local"
                error={errors.startTime ? t(errors.startTime.message as string) : undefined}
                {...register('startTime')}
              />
              <Input
                label={t('exam.endTime')}
                type="datetime-local"
                error={errors.endTime ? t(errors.endTime.message as string) : undefined}
                {...register('endTime')}
              />
            </div>

            {/* Instructions */}
            <Textarea
              label={t('exam.instructions')}
              rows={4}
              {...register('instructions')}
            />

            {/* Verification */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                  {...register('requiresVerification')}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('verification.verificationRequired')}</span>
              </label>
              {watch('requiresVerification') && (
                <Input
                  label={`${t('verification.periodicVerification')} (${t('exam.minutes')})`}
                  type="number"
                  className="w-32"
                  {...register('verificationInterval', { valueAsNumber: true })}
                />
              )}
            </div>
          </div>
        </Card>

        {/* Questions Section */}
        <Card className="mt-6">
          <CardHeader
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<PlusCircleIcon className="h-5 w-5" />}
                onClick={() => setCurrentQuestion({ type: 'multiple_choice', marks: 1, options: ['', '', '', ''] })}
              >
                {t('exam.addQuestion')}
              </Button>
            }
          >
            <CardTitle>{t('exam.totalQuestions')}: {questions.length}</CardTitle>
          </CardHeader>

          {/* Questions List */}
          {questions.length > 0 ? (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-bold rounded-full text-sm">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {t(`exam.${question.type}`)} - {question.marks} {t('exam.marks')}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-800 dark:text-gray-200">{question.text}</p>
                  </div>
                  <div className="flex items-center gap-2 ms-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditQuestion(index)}
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuestion(index)}
                    >
                      <TrashIcon className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>{t('common.noData')}</p>
            </div>
          )}
        </Card>

        {/* Question Editor Modal */}
        {currentQuestion && (
          <Card className="mt-6 border-2 border-primary-200">
            <CardHeader>
              <CardTitle>
                {editingQuestionIndex !== null ? t('exam.editQuestion') : t('exam.addQuestion')}
              </CardTitle>
            </CardHeader>

            <div className="space-y-4">
              {/* Question Text */}
              <Textarea
                label={t('exam.questionText')}
                rows={3}
                value={currentQuestion.text || ''}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
              />

              {/* Question Type & Marks */}
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label={t('exam.questionType')}
                  options={questionTypeOptions}
                  value={currentQuestion.type || 'multiple_choice'}
                  onChange={(e) => {
                    const newType = e.target.value as any;
                    setCurrentQuestion({
                      ...currentQuestion,
                      type: newType,
                      options: newType === 'multiple_choice' ? ['', '', '', ''] : undefined,
                      correctAnswer: newType === 'true_false' ? 'true' :
                                    newType === 'multiple_choice' ? 0 : undefined,
                    });
                  }}
                />
                <Input
                  label={t('exam.marks')}
                  type="number"
                  value={currentQuestion.marks || 1}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: parseInt(e.target.value) })}
                />
              </div>

              {/* Options for Multiple Choice */}
              {currentQuestion.type === 'multiple_choice' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('exam.options')}</label>
                  {(currentQuestion.options || ['', '', '', '']).map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={currentQuestion.correctAnswer === index}
                        onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index })}
                        className="w-4 h-4 text-primary-600"
                      />
                      <Input
                        placeholder={`${t('exam.options')} ${index + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(currentQuestion.options || [])];
                          newOptions[index] = e.target.value;
                          setCurrentQuestion({ ...currentQuestion, options: newOptions });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* True/False Options */}
              {currentQuestion.type === 'true_false' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('exam.correctAnswer')}</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="trueFalseAnswer"
                        checked={currentQuestion.correctAnswer === 'true' || currentQuestion.correctAnswer === 0}
                        onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: 'true' })}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-gray-800 dark:text-gray-200">{t('common.true') || 'True'}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="trueFalseAnswer"
                        checked={currentQuestion.correctAnswer === 'false' || currentQuestion.correctAnswer === 1}
                        onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: 'false' })}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-gray-800 dark:text-gray-200">{t('common.false') || 'False'}</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Correct Answer for short answer */}
              {currentQuestion.type === 'short_answer' && (
                <Input
                  label={t('exam.correctAnswer')}
                  value={currentQuestion.correctAnswer as string || ''}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                />
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCurrentQuestion(null);
                    setEditingQuestionIndex(null);
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveQuestion}
                  leftIcon={<CheckCircleIcon className="h-5 w-5" />}
                >
                  {t('common.save')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/teacher/exams')}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            isLoading={examMutation.isPending}
            leftIcon={<ArrowUpTrayIcon className="h-5 w-5" />}
          >
            {isEditing ? t('common.save') : t('exam.createExam')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateExamPage;

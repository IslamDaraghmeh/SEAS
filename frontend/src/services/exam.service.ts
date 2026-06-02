import api, { PaginatedResponse } from './api';

// Types
export interface Question {
  id: string;
  examId: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[];
  correctAnswer?: string | number;
  marks: number;
  order: number;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  duration: number; // in minutes
  startTime: string;
  endTime: string;
  totalQuestions: number;
  totalMarks: number;
  passingMarks: number;
  instructions?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  requiresVerification: boolean;
  verificationInterval?: number; // in minutes
  createdAt: string;
  updatedAt: string;
}

export interface ExamWithQuestions extends Exam {
  questions: Question[];
}

export interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  grade: string;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  timeTaken: number; // in seconds
  submittedAt: string;
  answers: Answer[];
}

export interface Answer {
  questionId: string;
  answer: string | number | null;
  isCorrect?: boolean;
  marksObtained?: number;
}

export interface ExamSubmission {
  examId: string;
  answers: Answer[];
  timeTaken: number;
}

export interface ExamFilters {
  status?: string;
  courseId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Interface for frontend exam form data
export interface ExamFormData {
  title: string;
  description?: string;
  courseId: string;
  duration: number;
  startTime: string;
  endTime: string;
  totalMarks: number;
  passingMarks: number;
  instructions?: string;
  requiresVerification: boolean;
  verificationInterval?: number;
}

// Transform frontend exam data to backend DTO format
function transformExamToBackend(data: ExamFormData) {
  return {
    courseId: data.courseId,
    titleAr: data.title,
    titleEn: data.title,
    descriptionAr: data.description || undefined,
    descriptionEn: data.description || undefined,
    durationMinutes: data.duration,
    totalPoints: data.totalMarks,
    passingScore: data.passingMarks,
    scheduledAt: new Date(data.startTime).toISOString(),
    endTime: data.endTime ? new Date(data.endTime).toISOString() : undefined,
    instructionsAr: data.instructions || undefined,
    instructionsEn: data.instructions || undefined,
    requireVerification: data.requiresVerification,
    // Backend expects seconds, frontend sends minutes - convert and ensure min 10 seconds
    verificationInterval: data.verificationInterval
      ? Math.max(10, data.verificationInterval * 60)
      : undefined,
  };
}

// Transform backend exam response to frontend format
function transformExamFromBackend(data: any): Exam {
  return {
    id: data.id,
    title: data.titleEn || data.titleAr || data.title || '',
    description: data.descriptionEn || data.descriptionAr || data.description || '',
    courseId: data.courseId || '',
    courseName: data.course?.nameEn || data.course?.nameAr || '',
    teacherId: data.course?.teacherId || data.teacherId || '',
    teacherName: data.course?.teacher?.nameEn || data.course?.teacher?.user?.email?.split('@')[0] || '',
    duration: data.durationMinutes || data.duration || 60,
    startTime: data.scheduledAt || data.startTime || '',
    endTime: data.endTime || '',
    totalQuestions: data.questions?.length || data._count?.questions || 0,
    totalMarks: data.totalPoints || data.totalMarks || 100,
    passingMarks: data.passingScore || data.passingMarks || 50,
    instructions: data.instructionsEn || data.instructionsAr || data.instructions || '',
    status: (data.status || 'draft').toUpperCase(),
    requiresVerification: data.requireVerification ?? data.requiresVerification ?? true,
    verificationInterval: data.verificationInterval ? Math.floor(data.verificationInterval / 60) : 5,
    createdAt: data.createdAt || '',
    updatedAt: data.updatedAt || '',
  };
}

// Transform backend question response to frontend format
function transformQuestionFromBackend(data: any): Question {
  // Handle options - can be array of strings or array of objects with text/content
  let options: string[] | undefined;
  if (data.options && Array.isArray(data.options)) {
    options = data.options.map((opt: any) =>
      typeof opt === 'string' ? opt : (opt.text || opt.content || opt.textEn || opt.textAr || '')
    );
  }

  // Handle correctAnswer - can be index or option ID
  let correctAnswer: string | number | undefined;
  if (data.correctAnswer !== undefined && data.correctAnswer !== null) {
    correctAnswer = data.correctAnswer;
  } else if (data.correctOptionId) {
    // Find index of correct option if we have option IDs
    const correctIndex = data.options?.findIndex((opt: any) => opt.id === data.correctOptionId);
    if (correctIndex !== undefined && correctIndex >= 0) {
      correctAnswer = correctIndex;
    }
  }

  return {
    id: data.id,
    examId: data.examId || '',
    text: data.textEn || data.textAr || data.text || '',
    type: data.type?.toLowerCase() || 'multiple_choice',
    options,
    correctAnswer,
    marks: data.points || data.marks || 1,
    order: data.order || 0,
  };
}

/**
 * Exam service for handling exam-related API calls
 */
export const examService = {
  // Student Methods

  /**
   * Get available exams for student
   */
  async getAvailableExams(
    filters?: ExamFilters
  ): Promise<PaginatedResponse<Exam>> {
    const response = await api.get<any>('/exams/available', {
      params: filters,
    });
    // Transform the data from backend format to frontend format
    return {
      ...response.data,
      data: (response.data.data || []).map(transformExamFromBackend),
    };
  },

  /**
   * Get exam details for taking
   */
  async getExamForTaking(examId: string): Promise<ExamWithQuestions> {
    const response = await api.get<any>(`/exams/${examId}/take`);
    const exam = transformExamFromBackend(response.data);
    const questions = (response.data.questions || []).map(transformQuestionFromBackend);
    return {
      ...exam,
      questions,
    };
  },

  /**
   * Start an exam session
   */
  async startExam(examId: string): Promise<{
    id: string; // attemptId
    attemptId: string; // alias for id
    startedAt: string;
    timeRemaining: number;
    exam: any;
    questions: any[];
  }> {
    const response = await api.post<any>(`/exams/${examId}/start`);
    // Add attemptId as alias for id
    return {
      ...response.data,
      attemptId: response.data.id,
    };
  },

  /**
   * Submit exam answers
   */
  async submitExam(submission: ExamSubmission): Promise<ExamResult> {
    // Transform answers to backend format
    // Backend expects: { answers: [{ questionId, selectedOptionId?, textAnswer? }] }
    const transformedAnswers = submission.answers.map(ans => {
      const result: { questionId: string; selectedOptionId?: string; textAnswer?: string } = {
        questionId: ans.questionId,
      };

      if (ans.answer !== null && ans.answer !== undefined) {
        // If answer looks like a UUID (for multiple choice), use selectedOptionId
        // Otherwise use textAnswer
        const answerStr = String(ans.answer);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(answerStr);

        if (isUUID) {
          result.selectedOptionId = answerStr;
        } else {
          result.textAnswer = answerStr;
        }
      }

      return result;
    });

    const response = await api.post<ExamResult>(
      `/exams/${submission.examId}/submit`,
      { answers: transformedAnswers }
    );
    return response.data;
  },

  /**
   * Save answer during exam (auto-save)
   */
  async saveAnswer(
    examId: string,
    questionId: string,
    answer: string | number | null,
    questionType?: string
  ): Promise<void> {
    // Transform answer based on question type
    // For multiple choice: answer is optionId (string UUID)
    // For text answers: answer is text content
    const isMultipleChoice = questionType === 'multiple_choice' || questionType === 'true_false' || questionType === 'MULTIPLE_CHOICE' || questionType === 'TRUE_FALSE';

    const payload: { questionId: string; selectedOptionId?: string; textAnswer?: string } = {
      questionId,
    };

    if (answer !== null && answer !== undefined) {
      if (isMultipleChoice && typeof answer === 'string') {
        payload.selectedOptionId = answer;
      } else {
        payload.textAnswer = String(answer);
      }
    }

    await api.post(`/exams/${examId}/save-answer`, payload);
  },

  /**
   * Get student's exam results
   */
  async getMyResults(filters?: ExamFilters): Promise<PaginatedResponse<ExamResult>> {
    const response = await api.get<PaginatedResponse<ExamResult>>('/exams/results', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get specific result details
   */
  async getResultDetails(resultId: string): Promise<ExamResult> {
    const response = await api.get<ExamResult>(`/exams/results/${resultId}`);
    return response.data;
  },

  // Teacher Methods

  /**
   * Get teacher's exams
   */
  async getTeacherExams(filters?: ExamFilters): Promise<PaginatedResponse<Exam>> {
    const response = await api.get<any>('/exams/teacher', {
      params: filters,
    });
    // Transform the data from backend format to frontend format
    return {
      ...response.data,
      data: (response.data.data || []).map(transformExamFromBackend),
    };
  },

  /**
   * Create new exam
   */
  async createExam(exam: ExamFormData): Promise<Exam> {
    const backendData = transformExamToBackend(exam);
    const response = await api.post<any>('/exams', backendData);
    return transformExamFromBackend(response.data);
  },

  /**
   * Update exam
   */
  async updateExam(examId: string, exam: Partial<ExamFormData>): Promise<Exam> {
    // Transform data but exclude courseId (can't change course after creation)
    const backendData = exam.title ? transformExamToBackend(exam as ExamFormData) : exam;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { courseId, ...updateData } = backendData as any;
    const response = await api.put<any>(`/exams/${examId}`, updateData);
    return transformExamFromBackend(response.data);
  },

  /**
   * Delete exam
   */
  async deleteExam(examId: string): Promise<void> {
    await api.delete(`/exams/${examId}`);
  },

  /**
   * Publish exam
   */
  async publishExam(examId: string): Promise<Exam> {
    const response = await api.post<Exam>(`/exams/${examId}/publish`);
    return response.data;
  },

  /**
   * Get exam with questions (for editing)
   */
  async getExamWithQuestions(examId: string): Promise<ExamWithQuestions> {
    const response = await api.get<any>(`/exams/${examId}/full`);
    const exam = transformExamFromBackend(response.data);
    const questions = (response.data.questions || []).map(transformQuestionFromBackend);
    return {
      ...exam,
      questions,
    };
  },

  // Question Methods

  /**
   * Add question to exam
   */
  async addQuestion(
    examId: string,
    question: Omit<Question, 'id' | 'examId'>
  ): Promise<Question> {
    const response = await api.post<Question>(`/exams/${examId}/questions`, question);
    return response.data;
  },

  /**
   * Update question
   */
  async updateQuestion(
    examId: string,
    questionId: string,
    question: Partial<Question>
  ): Promise<Question> {
    const response = await api.put<Question>(
      `/exams/${examId}/questions/${questionId}`,
      question
    );
    return response.data;
  },

  /**
   * Delete question
   */
  async deleteQuestion(examId: string, questionId: string): Promise<void> {
    await api.delete(`/exams/${examId}/questions/${questionId}`);
  },

  /**
   * Reorder questions
   */
  async reorderQuestions(
    examId: string,
    questionIds: string[]
  ): Promise<void> {
    await api.post(`/exams/${examId}/questions/reorder`, { questionIds });
  },

  // Results Methods (Teacher)

  /**
   * Get exam results (for teacher)
   */
  async getExamResults(
    examId: string,
    filters?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<ExamResult>> {
    const response = await api.get<PaginatedResponse<ExamResult>>(
      `/exams/${examId}/results`,
      { params: filters }
    );
    return response.data;
  },

  /**
   * Export exam results
   */
  async exportResults(
    examId: string,
    format: 'csv' | 'xlsx' | 'pdf'
  ): Promise<Blob> {
    const response = await api.get(`/exams/${examId}/results/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get exam statistics
   */
  async getExamStatistics(
    examId: string
  ): Promise<{
    totalStudents: number;
    submitted: number;
    averageScore: number;
    passRate: number;
    highestScore: number;
    lowestScore: number;
  }> {
    const response = await api.get(`/exams/${examId}/statistics`);
    return response.data;
  },

  // Grading Methods

  /**
   * Get attempt details for grading
   */
  async getAttemptForGrading(attemptId: string): Promise<{
    id: string;
    student: { id: string; nameEn: string; studentNumber: string };
    exam: { id: string; titleEn: string };
    answers: Array<{
      id: string;
      questionId: string;
      question: Question;
      selectedAnswer: string | null;
      answerText: string | null;
      isCorrect: boolean | null;
      pointsAwarded: number | null;
      feedback: string | null;
    }>;
    score: number | null;
    status: string;
    startedAt: string;
    submittedAt: string | null;
  }> {
    const response = await api.get(`/exams/attempts/${attemptId}/grading`);
    return response.data;
  },

  /**
   * Grade a specific answer
   */
  async gradeAnswer(
    attemptId: string,
    answerId: string,
    data: { pointsAwarded: number; feedback?: string }
  ): Promise<void> {
    await api.patch(`/exams/attempts/${attemptId}/answers/${answerId}/grade`, data);
  },

  /**
   * Finalize grading for an attempt
   */
  async finalizeGrading(attemptId: string): Promise<void> {
    await api.post(`/exams/attempts/${attemptId}/finalize`);
  },

  /**
   * Get attempts that need grading for an exam
   */
  async getAttemptsForGrading(
    examId: string,
    filters?: { status?: string; page?: number; limit?: number }
  ): Promise<PaginatedResponse<{
    id: string;
    student: { id: string; nameEn: string; studentNumber: string };
    score: number | null;
    status: string;
    submittedAt: string;
    needsManualGrading: boolean;
  }>> {
    const response = await api.get(`/exams/${examId}/attempts`, { params: filters });
    return response.data;
  },
};

export default examService;

import api from './api';

export interface QuestionBank {
  id: string;
  titleAr: string;
  titleEn: string;
  description?: string;
  courseId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  course?: {
    code: string;
    nameEn: string;
    nameAr: string;
  };
  _count?: {
    questions: number;
  };
}

export interface QuestionTag {
  id: string;
  name: string;
  _count?: {
    questions: number;
  };
}

export interface CreateQuestionBankDto {
  titleAr: string;
  titleEn: string;
  description?: string;
  courseId?: string;
}

export interface QuestionOption {
  id?: string;
  textAr: string;
  textEn: string;
  isCorrect: boolean;
  order?: number;
}

export interface Question {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
  textAr: string;
  textEn: string;
  correctAnswer?: string;
  explanationAr?: string;
  explanationEn?: string;
  hintAr?: string;
  hintEn?: string;
  imageUrl?: string;
  points: number;
  options?: QuestionOption[];
  tags?: Array<{ tag: QuestionTag }>;
}

export interface CreateQuestionDto {
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
  textAr: string;
  textEn: string;
  correctAnswer?: string;
  explanationAr?: string;
  explanationEn?: string;
  hintAr?: string;
  hintEn?: string;
  imageUrl?: string;
  points?: number;
  options?: Array<{
    textAr: string;
    textEn: string;
    isCorrect: boolean;
    order?: number;
  }>;
  tagIds?: string[];
}

class QuestionBankService {
  // Question Banks
  async getAll(courseId?: string): Promise<QuestionBank[]> {
    const params = courseId ? { courseId } : {};
    const response = await api.get('/question-banks', { params });
    return response.data;
  }

  async getById(id: string): Promise<QuestionBank & { questions: Array<{ question: Question }> }> {
    const response = await api.get(`/question-banks/${id}`);
    return response.data;
  }

  async create(data: CreateQuestionBankDto): Promise<QuestionBank> {
    const response = await api.post('/question-banks', data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateQuestionBankDto>): Promise<QuestionBank> {
    const response = await api.put(`/question-banks/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/question-banks/${id}`);
  }

  // Questions in Bank
  async getQuestions(bankId: string, tags?: string[]): Promise<Array<{ question: Question }>> {
    const params = tags?.length ? { tags } : {};
    const response = await api.get(`/question-banks/${bankId}/questions`, { params });
    return response.data;
  }

  async addQuestions(bankId: string, questionIds: string[]): Promise<{ added: number }> {
    const response = await api.post(`/question-banks/${bankId}/questions`, { questionIds });
    return response.data;
  }

  async createQuestion(bankId: string, data: CreateQuestionDto): Promise<Question> {
    const response = await api.post(`/question-banks/${bankId}/questions/new`, data);
    return response.data;
  }

  async removeQuestion(bankId: string, questionId: string): Promise<void> {
    await api.delete(`/question-banks/${bankId}/questions/${questionId}`);
  }

  async getRandomQuestions(bankId: string, count: number, tags?: string[]): Promise<Question[]> {
    const params: Record<string, any> = { count };
    if (tags?.length) params.tags = tags;
    const response = await api.post(`/question-banks/${bankId}/questions/random`, null, { params });
    return response.data;
  }

  async copyFromExam(bankId: string, examId: string): Promise<{ copiedCount: number }> {
    const response = await api.post(`/question-banks/${bankId}/copy-from-exam/${examId}`);
    return response.data;
  }

  // Tags
  async getTags(): Promise<QuestionTag[]> {
    const response = await api.get('/question-banks/tags');
    return response.data;
  }

  async createTag(name: string): Promise<QuestionTag> {
    const response = await api.post('/question-banks/tags', { name });
    return response.data;
  }

  async addTagsToQuestion(questionId: string, tagIds: string[]): Promise<void> {
    await api.post(`/question-banks/questions/${questionId}/tags`, { tagIds });
  }

  async removeTagFromQuestion(questionId: string, tagId: string): Promise<void> {
    await api.delete(`/question-banks/questions/${questionId}/tags/${tagId}`);
  }
}

export const questionBankService = new QuestionBankService();
export default questionBankService;

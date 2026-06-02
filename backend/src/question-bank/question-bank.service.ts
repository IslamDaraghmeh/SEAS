import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateQuestionBankDto {
  titleAr: string;
  titleEn: string;
  description?: string;
  courseId?: string;
}

export interface UpdateQuestionBankDto {
  titleAr?: string;
  titleEn?: string;
  description?: string;
  courseId?: string;
}

export interface AddQuestionsToPoolDto {
  questionIds: string[];
}

export interface CreateQuestionInBankDto {
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

@Injectable()
export class QuestionBankService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateQuestionBankDto) {
    return this.prisma.questionBank.create({
      data: {
        ...data,
        createdBy: userId,
      },
      include: {
        course: { select: { code: true, nameEn: true } },
        _count: { select: { questions: true } },
      },
    });
  }

  async findAll(userId: string, role: string, courseId?: string) {
    const where: Prisma.QuestionBankWhereInput = {};

    // Filter by course if provided
    if (courseId) {
      where.courseId = courseId;
    }

    // Teachers can only see their own banks and banks for their courses
    if (role === 'TEACHER') {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId },
        include: { courses: { select: { id: true } } },
      });

      if (teacher) {
        const courseIds = teacher.courses.map((c) => c.id);
        where.OR = [
          { createdBy: userId },
          { courseId: { in: courseIds } },
        ];
      }
    }

    return this.prisma.questionBank.findMany({
      where,
      include: {
        course: { select: { code: true, nameEn: true, nameAr: true } },
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const bank = await this.prisma.questionBank.findUnique({
      where: { id },
      include: {
        course: { select: { code: true, nameEn: true, nameAr: true } },
        questions: {
          include: {
            question: {
              include: {
                options: true,
                tags: { include: { tag: true } },
              },
            },
          },
        },
      },
    });

    if (!bank) {
      throw new NotFoundException('Question bank not found');
    }

    return bank;
  }

  async update(id: string, data: UpdateQuestionBankDto) {
    const bank = await this.prisma.questionBank.findUnique({ where: { id } });
    if (!bank) {
      throw new NotFoundException('Question bank not found');
    }

    return this.prisma.questionBank.update({
      where: { id },
      data,
      include: {
        course: { select: { code: true, nameEn: true } },
        _count: { select: { questions: true } },
      },
    });
  }

  async delete(id: string) {
    const bank = await this.prisma.questionBank.findUnique({ where: { id } });
    if (!bank) {
      throw new NotFoundException('Question bank not found');
    }

    return this.prisma.questionBank.delete({ where: { id } });
  }

  // Question management within bank
  async addQuestions(bankId: string, data: AddQuestionsToPoolDto) {
    const bank = await this.prisma.questionBank.findUnique({ where: { id: bankId } });
    if (!bank) {
      throw new NotFoundException('Question bank not found');
    }

    // Add questions to bank
    const items = await this.prisma.questionBankItem.createMany({
      data: data.questionIds.map((questionId) => ({
        bankId,
        questionId,
      })),
      skipDuplicates: true,
    });

    return { added: items.count };
  }

  async removeQuestion(bankId: string, questionId: string) {
    return this.prisma.questionBankItem.deleteMany({
      where: { bankId, questionId },
    });
  }

  async getQuestions(bankId: string, tags?: string[]) {
    const where: Prisma.QuestionBankItemWhereInput = { bankId };

    if (tags && tags.length > 0) {
      where.question = {
        tags: {
          some: {
            tagId: { in: tags },
          },
        },
      };
    }

    return this.prisma.questionBankItem.findMany({
      where,
      include: {
        question: {
          include: {
            options: { orderBy: { order: 'asc' } },
            tags: { include: { tag: true } },
          },
        },
      },
    });
  }

  // Create a new question directly in the bank
  async createQuestionInBank(bankId: string, data: CreateQuestionInBankDto) {
    const bank = await this.prisma.questionBank.findUnique({ where: { id: bankId } });
    if (!bank) {
      throw new NotFoundException('Question bank not found');
    }

    const { options, tagIds, ...questionData } = data;

    // Create question
    const question = await this.prisma.question.create({
      data: {
        ...questionData,
        examId: null, // Bank questions don't belong to an exam
        options: options
          ? {
              create: options.map((opt, index) => ({
                ...opt,
                order: opt.order ?? index,
              })),
            }
          : undefined,
        tags: tagIds
          ? {
              create: tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
        bankItems: {
          create: { bankId },
        },
      },
      include: {
        options: true,
        tags: { include: { tag: true } },
      },
    });

    return question;
  }

  // Random question selection for exams
  async getRandomQuestions(bankId: string, count: number, tags?: string[]) {
    const questions = await this.getQuestions(bankId, tags);

    if (questions.length < count) {
      throw new BadRequestException(
        `Not enough questions in bank. Requested: ${count}, Available: ${questions.length}`,
      );
    }

    // Fisher-Yates shuffle
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count).map((item) => item.question);
  }

  // Tag management
  async createTag(name: string) {
    return this.prisma.questionTag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  async getTags() {
    return this.prisma.questionTag.findMany({
      include: {
        _count: { select: { questions: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async addTagsToQuestion(questionId: string, tagIds: string[]) {
    return this.prisma.questionTagMap.createMany({
      data: tagIds.map((tagId) => ({ questionId, tagId })),
      skipDuplicates: true,
    });
  }

  async removeTagFromQuestion(questionId: string, tagId: string) {
    return this.prisma.questionTagMap.delete({
      where: { questionId_tagId: { questionId, tagId } },
    });
  }

  // Copy questions from exam to bank
  async copyFromExam(examId: string, bankId: string) {
    const bank = await this.prisma.questionBank.findUnique({ where: { id: bankId } });
    if (!bank) {
      throw new NotFoundException('Question bank not found');
    }

    const examQuestions = await this.prisma.question.findMany({
      where: { examId },
      include: { options: true },
    });

    let copiedCount = 0;
    for (const q of examQuestions) {
      // Create a copy of the question
      const newQuestion = await this.prisma.question.create({
        data: {
          type: q.type,
          textAr: q.textAr,
          textEn: q.textEn,
          correctAnswer: q.correctAnswer,
          explanationAr: q.explanationAr,
          explanationEn: q.explanationEn,
          hintAr: q.hintAr,
          hintEn: q.hintEn,
          imageUrl: q.imageUrl,
          points: q.points,
          examId: null,
          options: {
            create: q.options.map((opt) => ({
              textAr: opt.textAr,
              textEn: opt.textEn,
              isCorrect: opt.isCorrect,
              order: opt.order,
            })),
          },
          bankItems: {
            create: { bankId },
          },
        },
      });
      copiedCount++;
    }

    return { copiedCount };
  }
}

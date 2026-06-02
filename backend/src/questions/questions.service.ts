import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto';
import { ExamStatus, QuestionType } from '@prisma/client';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async create(createQuestionDto: CreateQuestionDto) {
    const { examId, options, ...questionData } = createQuestionDto;

    // Check if exam exists and is draft
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.status !== ExamStatus.DRAFT) {
      throw new BadRequestException(
        'Can only add questions to draft exams',
      );
    }

    // Validate options for multiple choice/true-false
    if (
      questionData.type === QuestionType.MULTIPLE_CHOICE ||
      questionData.type === QuestionType.TRUE_FALSE
    ) {
      if (!options || options.length < 2) {
        throw new BadRequestException(
          'Multiple choice and true/false questions require at least 2 options',
        );
      }

      const hasCorrectOption = options.some((opt) => opt.isCorrect);
      if (!hasCorrectOption) {
        throw new BadRequestException('At least one option must be marked as correct');
      }
    }

    // Get the next order number
    const lastQuestion = await this.prisma.question.findFirst({
      where: { examId },
      orderBy: { order: 'desc' },
    });

    const order = questionData.order ?? (lastQuestion ? lastQuestion.order + 1 : 0);

    return this.prisma.question.create({
      data: {
        ...questionData,
        examId,
        order,
        options: options
          ? {
              create: options.map((opt, index) => ({
                ...opt,
                order: opt.order ?? index,
              })),
            }
          : undefined,
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async createBulk(examId: string, questions: CreateQuestionDto[]) {
    // Check if exam exists and is draft
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.status !== ExamStatus.DRAFT) {
      throw new BadRequestException('Can only add questions to draft exams');
    }

    // Get the current max order
    const lastQuestion = await this.prisma.question.findFirst({
      where: { examId },
      orderBy: { order: 'desc' },
    });

    let currentOrder = lastQuestion ? lastQuestion.order + 1 : 0;

    const createdQuestions = [];

    for (const questionDto of questions) {
      const { options, ...questionData } = questionDto;

      const question = await this.prisma.question.create({
        data: {
          ...questionData,
          examId,
          order: questionData.order ?? currentOrder++,
          options: options
            ? {
                create: options.map((opt, index) => ({
                  ...opt,
                  order: opt.order ?? index,
                })),
              }
            : undefined,
        },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
        },
      });

      createdQuestions.push(question);
    }

    return createdQuestions;
  }

  async findByExam(examId: string, includeCorrectAnswers = true) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const questions = await this.prisma.question.findMany({
      where: { examId },
      orderBy: { order: 'asc' },
      include: {
        options: {
          orderBy: { order: 'asc' },
          select: includeCorrectAnswers
            ? undefined
            : {
                id: true,
                textAr: true,
                textEn: true,
                order: true,
              },
        },
      },
    });

    if (!includeCorrectAnswers) {
      return questions.map((q) => ({
        ...q,
        correctAnswer: undefined,
      }));
    }

    return questions;
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
        exam: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            status: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: { exam: true },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (question.exam.status !== ExamStatus.DRAFT) {
      throw new BadRequestException('Can only update questions in draft exams');
    }

    const { options, ...questionData } = updateQuestionDto;

    // If options are provided, replace all options
    if (options) {
      // Delete existing options
      await this.prisma.questionOption.deleteMany({
        where: { questionId: id },
      });
    }

    return this.prisma.question.update({
      where: { id },
      data: {
        ...questionData,
        options: options
          ? {
              create: options.map((opt, index) => ({
                textAr: opt.textAr,
                textEn: opt.textEn,
                isCorrect: opt.isCorrect ?? false,
                order: opt.order ?? index,
              })),
            }
          : undefined,
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async remove(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: { exam: true },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (question.exam.status !== ExamStatus.DRAFT) {
      throw new BadRequestException(
        'Can only delete questions from draft exams',
      );
    }

    await this.prisma.question.delete({ where: { id } });

    return { message: 'Question deleted successfully' };
  }

  async reorder(examId: string, questionIds: string[]) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.status !== ExamStatus.DRAFT) {
      throw new BadRequestException(
        'Can only reorder questions in draft exams',
      );
    }

    // Update order for each question
    const updates = questionIds.map((questionId, index) =>
      this.prisma.question.update({
        where: { id: questionId },
        data: { order: index },
      }),
    );

    await this.prisma.$transaction(updates);

    return { message: 'Questions reordered successfully' };
  }
}

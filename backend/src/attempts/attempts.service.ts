import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuestionsService } from '../questions/questions.service';
import {
  StartAttemptDto,
  SubmitAnswerDto,
  SubmitAllAnswersDto,
  GradeAttemptDto,
  QueryAttemptDto,
} from './dto';
import { AttemptStatus, ExamStatus, QuestionType, Prisma } from '@prisma/client';

@Injectable()
export class AttemptsService {
  constructor(
    private prisma: PrismaService,
    private questionsService: QuestionsService,
  ) {}

  async startAttempt(studentId: string, startAttemptDto: StartAttemptDto) {
    const { examId } = startAttemptDto;

    // Check if exam exists and is active
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        course: {
          include: {
            enrollments: {
              where: { studentId },
            },
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.status !== ExamStatus.ACTIVE) {
      throw new BadRequestException('Exam is not active');
    }

    // Check if student is enrolled in the course
    if (exam.course.enrollments.length === 0) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    // Check if student already has an in-progress attempt
    const existingAttempt = await this.prisma.examAttempt.findFirst({
      where: {
        examId,
        studentId,
        status: AttemptStatus.IN_PROGRESS,
      },
    });

    if (existingAttempt) {
      // Return existing attempt instead of creating new one
      return this.getAttemptWithQuestions(existingAttempt.id);
    }

    // Check if student has already submitted
    const submittedAttempt = await this.prisma.examAttempt.findFirst({
      where: {
        examId,
        studentId,
        status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.GRADED] },
      },
    });

    if (submittedAttempt) {
      throw new BadRequestException('You have already submitted this exam');
    }

    // Create new attempt
    const attempt = await this.prisma.examAttempt.create({
      data: {
        examId,
        studentId,
        status: AttemptStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    return this.getAttemptWithQuestions(attempt.id);
  }

  async getAttemptWithQuestions(attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            course: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    // Get questions without correct answers
    const questions = await this.questionsService.findByExam(
      attempt.examId,
      false,
    );

    // Shuffle questions if needed
    let orderedQuestions = questions;
    if (attempt.exam.shuffleQuestions) {
      orderedQuestions = this.shuffleArray([...questions]);
    }

    // Shuffle options if needed
    if (attempt.exam.shuffleOptions) {
      orderedQuestions = orderedQuestions.map((q) => ({
        ...q,
        options: this.shuffleArray([...q.options]),
      }));
    }

    return {
      ...attempt,
      questions: orderedQuestions,
      timeRemaining: this.calculateTimeRemaining(
        attempt.startedAt,
        attempt.exam.durationMinutes,
      ),
    };
  }

  async submitAnswer(
    attemptId: string,
    studentId: string,
    submitAnswerDto: SubmitAnswerDto,
  ) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.studentId !== studentId) {
      throw new ForbiddenException('This is not your exam attempt');
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Exam attempt is not in progress');
    }

    const { questionId, selectedOptionId, textAnswer } = submitAnswerDto;

    // Check if question exists
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { options: true },
    });

    if (!question || question.examId !== attempt.examId) {
      throw new NotFoundException('Question not found in this exam');
    }

    // Upsert answer
    const answer = await this.prisma.examAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      update: {
        selectedOptionId,
        textAnswer,
      },
      create: {
        attemptId,
        questionId,
        selectedOptionId,
        textAnswer,
      },
    });

    return answer;
  }

  async submitAllAnswers(
    attemptId: string,
    studentId: string,
    submitDto: SubmitAllAnswersDto,
  ) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.studentId !== studentId) {
      throw new ForbiddenException('This is not your exam attempt');
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Exam attempt is not in progress');
    }

    // Submit all answers
    for (const answer of submitDto.answers) {
      await this.submitAnswer(attemptId, studentId, answer);
    }

    return { message: 'All answers submitted successfully' };
  }

  async submitAttempt(attemptId: string, studentId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.studentId !== studentId) {
      throw new ForbiddenException('This is not your exam attempt');
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Exam attempt is not in progress');
    }

    // Auto-grade multiple choice and true/false questions
    let totalScore = 0;
    let hasEssayQuestions = false;

    for (const answer of attempt.answers) {
      const question = attempt.exam.questions.find(
        (q) => q.id === answer.questionId,
      );

      if (!question) continue;

      if (
        question.type === QuestionType.MULTIPLE_CHOICE ||
        question.type === QuestionType.TRUE_FALSE
      ) {
        const correctOption = question.options.find((o) => o.isCorrect);
        const isCorrect = answer.selectedOptionId === correctOption?.id;

        await this.prisma.examAnswer.update({
          where: { id: answer.id },
          data: {
            isCorrect,
            pointsAwarded: isCorrect ? question.points : 0,
          },
        });

        if (isCorrect) {
          totalScore += question.points;
        }
      } else if (
        question.type === QuestionType.SHORT_ANSWER &&
        question.correctAnswer
      ) {
        // Simple exact match for short answer
        const isCorrect =
          answer.textAnswer?.toLowerCase().trim() ===
          question.correctAnswer.toLowerCase().trim();

        await this.prisma.examAnswer.update({
          where: { id: answer.id },
          data: {
            isCorrect,
            pointsAwarded: isCorrect ? question.points : 0,
          },
        });

        if (isCorrect) {
          totalScore += question.points;
        }
      } else {
        hasEssayQuestions = true;
      }
    }

    const percentage = (totalScore / attempt.exam.totalPoints) * 100;

    // Update attempt status
    const updatedAttempt = await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: hasEssayQuestions
          ? AttemptStatus.SUBMITTED
          : AttemptStatus.GRADED,
        submittedAt: new Date(),
        gradedAt: hasEssayQuestions ? null : new Date(),
        score: totalScore,
        percentage,
      },
      include: {
        exam: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            totalPoints: true,
            passingScore: true,
          },
        },
      },
    });

    return {
      ...updatedAttempt,
      requiresManualGrading: hasEssayQuestions,
    };
  }

  async gradeAttempt(attemptId: string, gradeDto: GradeAttemptDto) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: true,
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.status !== AttemptStatus.SUBMITTED) {
      throw new BadRequestException('Attempt is not ready for grading');
    }

    // Apply grades
    for (const grade of gradeDto.grades) {
      await this.prisma.examAnswer.update({
        where: { id: grade.answerId },
        data: {
          pointsAwarded: grade.pointsAwarded,
          feedback: grade.feedback,
        },
      });
    }

    // Recalculate total score
    const answers = await this.prisma.examAnswer.findMany({
      where: { attemptId },
    });

    const totalScore = answers.reduce(
      (sum, a) => sum + (a.pointsAwarded || 0),
      0,
    );
    const percentage = (totalScore / attempt.exam.totalPoints) * 100;

    return this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.GRADED,
        gradedAt: new Date(),
        score: totalScore,
        percentage,
      },
    });
  }

  async findAll(query: QueryAttemptDto) {
    const {
      examId,
      studentId,
      status,
      page = 1,
      limit = 10,
      sortBy = 'startedAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ExamAttemptWhereInput = {};

    if (examId) {
      where.examId = examId;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (status) {
      where.status = status;
    }

    const orderBy: Prisma.ExamAttemptOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    const [attempts, total] = await Promise.all([
      this.prisma.examAttempt.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          exam: {
            select: {
              id: true,
              titleAr: true,
              titleEn: true,
              durationMinutes: true,
              totalPoints: true,
              course: {
                select: {
                  id: true,
                  nameAr: true,
                  nameEn: true,
                },
              },
            },
          },
          student: {
            select: {
              id: true,
              studentNumber: true,
              nameAr: true,
              nameEn: true,
            },
          },
        },
      }),
      this.prisma.examAttempt.count({ where }),
    ]);

    return {
      data: attempts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id },
      include: {
        exam: {
          include: {
            course: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
              },
            },
            questions: {
              include: { options: true },
              orderBy: { order: 'asc' },
            },
          },
        },
        student: {
          select: {
            id: true,
            studentNumber: true,
            nameAr: true,
            nameEn: true,
          },
        },
        answers: true,
        verificationLogs: {
          orderBy: { verifiedAt: 'desc' },
          take: 10,
        },
        alerts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    return attempt;
  }

  async getStudentAttempts(studentId: string) {
    return this.prisma.examAttempt.findMany({
      where: { studentId },
      include: {
        exam: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            totalPoints: true,
            passingScore: true,
            course: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
              },
            },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  private calculateTimeRemaining(startedAt: Date, durationMinutes: number): number {
    const endTime = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
    const now = new Date();
    const remaining = Math.max(0, endTime.getTime() - now.getTime());
    return Math.floor(remaining / 1000); // Return seconds
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // ============= GRADING METHODS =============

  async findByExam(examId: string, query: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ExamAttemptWhereInput = { examId };
    if (status) {
      where.status = status as AttemptStatus;
    }

    const [attempts, total] = await Promise.all([
      this.prisma.examAttempt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              nameEn: true,
              studentNumber: true,
            },
          },
          answers: {
            include: {
              question: true,
            },
          },
        },
      }),
      this.prisma.examAttempt.count({ where }),
    ]);

    // Determine which attempts need manual grading
    const data = attempts.map((attempt) => {
      const hasEssayAnswers = attempt.answers.some(
        (a) =>
          a.question.type === QuestionType.ESSAY ||
          (a.question.type === QuestionType.SHORT_ANSWER && !a.question.correctAnswer),
      );
      const hasUngradedAnswers = attempt.answers.some(
        (a) =>
          (a.question.type === QuestionType.ESSAY ||
            a.question.type === QuestionType.SHORT_ANSWER) &&
          a.pointsAwarded === null,
      );

      return {
        id: attempt.id,
        student: attempt.student,
        score: attempt.percentage,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
        needsManualGrading: hasEssayAnswers && hasUngradedAnswers,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getForGrading(attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        student: {
          select: {
            id: true,
            nameEn: true,
            studentNumber: true,
          },
        },
        exam: {
          select: {
            id: true,
            titleEn: true,
            totalPoints: true,
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
          orderBy: {
            question: {
              order: 'asc',
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    // Transform to frontend-friendly format
    return {
      id: attempt.id,
      student: attempt.student,
      exam: attempt.exam,
      answers: attempt.answers.map((answer) => ({
        id: answer.id,
        questionId: answer.questionId,
        question: {
          id: answer.question.id,
          text: answer.question.textEn || answer.question.textAr,
          type: answer.question.type.toLowerCase(),
          marks: answer.question.points,
          options: answer.question.options.map((o) => o.textEn || o.textAr),
        },
        selectedAnswer: answer.selectedOptionId,
        answerText: answer.textAnswer,
        isCorrect: answer.isCorrect,
        pointsAwarded: answer.pointsAwarded,
        feedback: answer.feedback,
      })),
      score: attempt.score,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
    };
  }

  async gradeAnswer(
    attemptId: string,
    answerId: string,
    data: { pointsAwarded: number; feedback?: string },
  ) {
    const answer = await this.prisma.examAnswer.findFirst({
      where: {
        id: answerId,
        attemptId,
      },
      include: {
        question: true,
      },
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    if (data.pointsAwarded < 0 || data.pointsAwarded > answer.question.points) {
      throw new BadRequestException(
        `Points must be between 0 and ${answer.question.points}`,
      );
    }

    await this.prisma.examAnswer.update({
      where: { id: answerId },
      data: {
        pointsAwarded: data.pointsAwarded,
        feedback: data.feedback,
        isCorrect: data.pointsAwarded > 0,
      },
    });

    return { success: true };
  }

  async finalizeGrading(attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: true,
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    // Calculate total score
    const totalScore = attempt.answers.reduce(
      (sum, a) => sum + (a.pointsAwarded || 0),
      0,
    );
    const percentage = (totalScore / attempt.exam.totalPoints) * 100;

    await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.GRADED,
        gradedAt: new Date(),
        score: totalScore,
        percentage,
      },
    });

    return { success: true };
  }
}

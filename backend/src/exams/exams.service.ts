import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto, UpdateExamDto, QueryExamDto } from './dto';
import { ExamStatus, Prisma } from '@prisma/client';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async create(createExamDto: CreateExamDto) {
    const { courseId, ...examData } = createExamDto;

    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.prisma.exam.create({
      data: {
        ...examData,
        courseId,
        scheduledAt: new Date(examData.scheduledAt),
        endTime: examData.endTime ? new Date(examData.endTime) : null,
      },
      include: {
        course: {
          select: {
            id: true,
            codeAr: true,
            codeEn: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryExamDto) {
    const {
      search,
      courseId,
      status,
      page = 1,
      limit = 10,
      sortBy = 'scheduledAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ExamWhereInput = {};

    // Search filter
    if (search) {
      where.OR = [
        { titleAr: { contains: search, mode: 'insensitive' } },
        { titleEn: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Course filter
    if (courseId) {
      where.courseId = courseId;
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Build orderBy
    const orderBy: Prisma.ExamOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    const [exams, total] = await Promise.all([
      this.prisma.exam.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          course: {
            select: {
              id: true,
              codeAr: true,
              codeEn: true,
              nameAr: true,
              nameEn: true,
            },
          },
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
      }),
      this.prisma.exam.count({ where }),
    ]);

    return {
      data: exams,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            codeAr: true,
            codeEn: true,
            nameAr: true,
            nameEn: true,
            teacher: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
              },
            },
          },
        },
        questions: {
          orderBy: { order: 'asc' },
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    return exam;
  }

  async findByCourse(courseId: string, query: QueryExamDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.findAll({ ...query, courseId });
  }

  async findByTeacher(teacherId: string, query: QueryExamDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const courses = await this.prisma.course.findMany({
      where: { teacherId },
      select: { id: true },
    });

    const courseIds = courses.map((c) => c.id);

    const {
      search,
      status,
      page = 1,
      limit = 10,
      sortBy = 'scheduledAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ExamWhereInput = {
      courseId: { in: courseIds },
    };

    if (search) {
      where.OR = [
        { titleAr: { contains: search, mode: 'insensitive' } },
        { titleEn: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const orderBy: Prisma.ExamOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    const [exams, total] = await Promise.all([
      this.prisma.exam.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          course: {
            select: {
              id: true,
              codeAr: true,
              codeEn: true,
              nameAr: true,
              nameEn: true,
            },
          },
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
      }),
      this.prisma.exam.count({ where }),
    ]);

    return {
      data: exams,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findForStudent(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get student's enrolled courses
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      select: { courseId: true },
    });

    const courseIds = enrollments.map((e) => e.courseId);

    // Get published and active exams for enrolled courses
    const exams = await this.prisma.exam.findMany({
      where: {
        courseId: { in: courseIds },
        status: { in: [ExamStatus.PUBLISHED, ExamStatus.ACTIVE] },
      },
      include: {
        course: {
          select: {
            id: true,
            codeAr: true,
            codeEn: true,
            nameAr: true,
            nameEn: true,
          },
        },
        attempts: {
          where: { studentId },
          select: {
            id: true,
            status: true,
            score: true,
            percentage: true,
            startedAt: true,
            submittedAt: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return exams;
  }

  async findAvailableForStudent(studentId: string, query: QueryExamDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get student's enrolled courses
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      select: { courseId: true },
    });

    const courseIds = enrollments.map((e) => e.courseId);

    const {
      status,
      page = 1,
      limit = 10,
      sortBy = 'scheduledAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ExamWhereInput = {
      courseId: { in: courseIds },
      status: status
        ? (status as ExamStatus)
        : { in: [ExamStatus.PUBLISHED, ExamStatus.ACTIVE] },
    };

    const orderBy: Prisma.ExamOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    const [exams, total] = await Promise.all([
      this.prisma.exam.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          course: {
            select: {
              id: true,
              codeAr: true,
              codeEn: true,
              nameAr: true,
              nameEn: true,
            },
          },
          attempts: {
            where: { studentId },
            select: {
              id: true,
              status: true,
              score: true,
              percentage: true,
              startedAt: true,
              submittedAt: true,
            },
          },
          _count: {
            select: {
              questions: true,
            },
          },
        },
      }),
      this.prisma.exam.count({ where }),
    ]);

    return {
      data: exams,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findStudentResults(studentId: string, query: QueryExamDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [attempts, total] = await Promise.all([
      this.prisma.examAttempt.findMany({
        where: {
          studentId,
          status: { in: ['SUBMITTED', 'GRADED'] },
        },
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          exam: {
            include: {
              course: {
                select: {
                  id: true,
                  codeAr: true,
                  codeEn: true,
                  nameAr: true,
                  nameEn: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.examAttempt.count({
        where: {
          studentId,
          status: { in: ['SUBMITTED', 'GRADED'] },
        },
      }),
    ]);

    return {
      data: attempts.map((attempt) => ({
        id: attempt.id,
        examId: attempt.examId,
        examTitle: attempt.exam.titleEn || attempt.exam.titleAr,
        courseName: attempt.exam.course.nameEn || attempt.exam.course.nameAr,
        score: attempt.score,
        totalPoints: attempt.exam.totalPoints,
        percentage: attempt.percentage,
        passed: (attempt.percentage || 0) >= attempt.exam.passingScore,
        submittedAt: attempt.submittedAt,
        gradedAt: attempt.gradedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, updateExamDto: UpdateExamDto) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Can't update completed or cancelled exams
    if (
      exam.status === ExamStatus.COMPLETED ||
      exam.status === ExamStatus.CANCELLED
    ) {
      throw new BadRequestException('Cannot update completed or cancelled exam');
    }

    const data: any = { ...updateExamDto };

    if (updateExamDto.scheduledAt) {
      data.scheduledAt = new Date(updateExamDto.scheduledAt);
    }

    if (updateExamDto.endTime) {
      data.endTime = new Date(updateExamDto.endTime);
    }

    return this.prisma.exam.update({
      where: { id },
      data,
      include: {
        course: {
          select: {
            id: true,
            codeAr: true,
            codeEn: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Don't allow deletion if there are attempts
    if (exam._count.attempts > 0) {
      throw new BadRequestException(
        'Cannot delete exam with existing attempts. Cancel the exam instead.',
      );
    }

    await this.prisma.exam.delete({ where: { id } });

    return { message: 'Exam deleted successfully' };
  }

  async publish(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        _count: { select: { questions: true } },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.status !== ExamStatus.DRAFT) {
      throw new BadRequestException('Only draft exams can be published');
    }

    if (exam._count.questions === 0) {
      throw new BadRequestException(
        'Cannot publish exam without questions',
      );
    }

    return this.prisma.exam.update({
      where: { id },
      data: { status: ExamStatus.PUBLISHED },
      include: {
        course: {
          select: {
            id: true,
            codeAr: true,
            codeEn: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });
  }

  async activate(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.status !== ExamStatus.PUBLISHED) {
      throw new BadRequestException('Only published exams can be activated');
    }

    return this.prisma.exam.update({
      where: { id },
      data: { status: ExamStatus.ACTIVE },
    });
  }

  async complete(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.status !== ExamStatus.ACTIVE) {
      throw new BadRequestException('Only active exams can be completed');
    }

    return this.prisma.exam.update({
      where: { id },
      data: { status: ExamStatus.COMPLETED },
    });
  }

  async cancel(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.status === ExamStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed exam');
    }

    return this.prisma.exam.update({
      where: { id },
      data: { status: ExamStatus.CANCELLED },
    });
  }

  async getStatistics(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        attempts: {
          where: {
            status: { in: ['SUBMITTED', 'GRADED'] },
          },
          select: {
            score: true,
            percentage: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const completedAttempts = exam.attempts;
    const totalAttempts = exam._count.attempts;

    if (completedAttempts.length === 0) {
      return {
        totalAttempts,
        completedAttempts: 0,
        averageScore: null,
        averagePercentage: null,
        highestScore: null,
        lowestScore: null,
        passRate: null,
      };
    }

    const scores = completedAttempts.map((a) => a.score || 0);
    const percentages = completedAttempts.map((a) => a.percentage || 0);

    const passedCount = percentages.filter(
      (p) => p >= exam.passingScore,
    ).length;

    return {
      totalAttempts,
      completedAttempts: completedAttempts.length,
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      averagePercentage:
        percentages.reduce((a, b) => a + b, 0) / percentages.length,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      passRate: (passedCount / completedAttempts.length) * 100,
    };
  }

  // ============= STUDENT EXAM TAKING METHODS =============

  async getExamForStudent(examId: string, studentId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        course: {
          select: {
            id: true,
            codeAr: true,
            codeEn: true,
            nameAr: true,
            nameEn: true,
          },
        },
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            textAr: true,
            textEn: true,
            type: true,
            points: true,
            order: true,
            options: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                textAr: true,
                textEn: true,
                order: true,
                // Don't expose isCorrect to students
              },
            },
          },
        },
        attempts: {
          where: { studentId },
          select: {
            id: true,
            status: true,
            startedAt: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Check if student is enrolled in the course
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId: exam.courseId,
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    // Check exam status
    if (exam.status !== ExamStatus.PUBLISHED && exam.status !== ExamStatus.ACTIVE) {
      throw new ForbiddenException('This exam is not available');
    }

    return {
      ...exam,
      hasExistingAttempt: exam.attempts.length > 0,
      existingAttempt: exam.attempts[0] || null,
    };
  }

  async submitExamWithAnswers(
    examId: string,
    studentId: string,
    submitDto: { answers: Array<{ questionId: string; selectedOptionId?: string; textAnswer?: string }> },
  ) {
    // Find the student's active attempt for this exam
    const attempt = await this.prisma.examAttempt.findFirst({
      where: {
        examId,
        studentId,
        status: 'IN_PROGRESS',
      },
      include: {
        exam: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('No active attempt found for this exam');
    }

    // Save all answers
    for (const answer of submitDto.answers) {
      const question = attempt.exam.questions.find(
        (q) => q.id === answer.questionId,
      );
      if (!question) continue;

      // Determine if answer is correct (for MCQ and true/false)
      let isCorrect = false;
      let pointsAwarded = 0;

      if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
        const correctOption = question.options.find((o) => o.isCorrect);
        isCorrect = correctOption?.id === answer.selectedOptionId;
        pointsAwarded = isCorrect ? question.points : 0;
      }

      await this.prisma.examAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId: attempt.id,
            questionId: answer.questionId,
          },
        },
        update: {
          selectedOptionId: answer.selectedOptionId || null,
          textAnswer: answer.textAnswer || null,
          isCorrect,
          pointsAwarded,
        },
        create: {
          attemptId: attempt.id,
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId || null,
          textAnswer: answer.textAnswer || null,
          isCorrect,
          pointsAwarded,
        },
      });
    }

    // Calculate total score
    const answers = await this.prisma.examAnswer.findMany({
      where: { attemptId: attempt.id },
    });

    const totalScore = answers.reduce((sum, a) => sum + (a.pointsAwarded || 0), 0);
    const percentage = (totalScore / attempt.exam.totalPoints) * 100;

    // Update attempt as submitted
    const updatedAttempt = await this.prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        score: totalScore,
        percentage,
      },
      include: {
        exam: {
          select: {
            titleAr: true,
            titleEn: true,
            totalPoints: true,
            passingScore: true,
          },
        },
      },
    });

    return {
      id: updatedAttempt.id,
      examId: updatedAttempt.examId,
      examTitle: updatedAttempt.exam.titleEn || updatedAttempt.exam.titleAr,
      score: totalScore,
      totalPoints: updatedAttempt.exam.totalPoints,
      percentage,
      passed: percentage >= updatedAttempt.exam.passingScore,
      submittedAt: updatedAttempt.submittedAt,
    };
  }

  async saveAnswer(
    examId: string,
    studentId: string,
    answerDto: { questionId: string; selectedOptionId?: string; textAnswer?: string },
  ) {
    // Find the student's active attempt for this exam
    const attempt = await this.prisma.examAttempt.findFirst({
      where: {
        examId,
        studentId,
        status: 'IN_PROGRESS',
      },
    });

    if (!attempt) {
      throw new NotFoundException('No active attempt found for this exam');
    }

    // Save/update the answer
    await this.prisma.examAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: attempt.id,
          questionId: answerDto.questionId,
        },
      },
      update: {
        selectedOptionId: answerDto.selectedOptionId || null,
        textAnswer: answerDto.textAnswer || null,
      },
      create: {
        attemptId: attempt.id,
        questionId: answerDto.questionId,
        selectedOptionId: answerDto.selectedOptionId || null,
        textAnswer: answerDto.textAnswer || null,
      },
    });

    return { success: true };
  }

  async getExamResults(examId: string, query: QueryExamDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [attempts, total] = await Promise.all([
      this.prisma.examAttempt.findMany({
        where: {
          examId,
          status: { in: ['SUBMITTED', 'GRADED'] },
        },
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          student: {
            include: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.examAttempt.count({
        where: {
          examId,
          status: { in: ['SUBMITTED', 'GRADED'] },
        },
      }),
    ]);

    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: { totalPoints: true, passingScore: true },
    });

    return {
      data: attempts.map((attempt) => ({
        id: attempt.id,
        studentId: attempt.studentId,
        studentNumber: attempt.student.studentNumber,
        studentEmail: attempt.student.user.email,
        studentName: attempt.student.nameEn || attempt.student.nameAr,
        score: attempt.score,
        totalPoints: exam?.totalPoints,
        percentage: attempt.percentage,
        passed: (attempt.percentage || 0) >= (exam?.passingScore || 50),
        submittedAt: attempt.submittedAt,
        gradedAt: attempt.gradedAt,
        status: attempt.status,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async exportResults(examId: string, format: string) {
    const results = await this.getExamResults(examId, { page: 1, limit: 1000 });

    if (format === 'json') {
      return results.data;
    }

    // For CSV format
    if (format === 'csv') {
      const headers = [
        'Student Number',
        'Email',
        'Name',
        'Score',
        'Total Points',
        'Percentage',
        'Passed',
        'Submitted At',
      ];
      const rows = results.data.map((r) => [
        r.studentNumber,
        r.studentEmail,
        r.studentName,
        r.score,
        r.totalPoints,
        r.percentage?.toFixed(2),
        r.passed ? 'Yes' : 'No',
        r.submittedAt,
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      return { csv, filename: `exam-${examId}-results.csv` };
    }

    return results.data;
  }
}

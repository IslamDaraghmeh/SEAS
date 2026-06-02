import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AttemptStatus, ExamStatus } from '@prisma/client';

export interface StudentStatus {
  attemptId: string;
  studentId: string;
  studentNumber: string;
  studentName: string;
  status: AttemptStatus;
  isOnline: boolean;
  lastVerification?: {
    isVerified: boolean;
    matchScore: number;
    timestamp: string;
  };
  alertCount: number;
  unresolvedAlerts: number;
  progress: number; // Percentage of questions answered
  timeRemaining: number; // Seconds
}

export interface ExamMonitoringData {
  examId: string;
  examTitle: string;
  status: ExamStatus;
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  totalAlerts: number;
  unresolvedAlerts: number;
  students: StudentStatus[];
}

@Injectable()
export class MonitoringService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getExamMonitoringData(examId: string): Promise<ExamMonitoringData> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        course: {
          include: {
            enrollments: {
              include: {
                student: true,
              },
            },
          },
        },
        attempts: {
          include: {
            student: true,
            answers: true,
            alerts: true,
            verificationLogs: {
              orderBy: { verifiedAt: 'desc' },
              take: 1,
            },
          },
        },
        questions: true,
      },
    });

    if (!exam) {
      throw new Error('Exam not found');
    }

    const totalQuestions = exam.questions.length;
    const students: StudentStatus[] = [];

    let activeCount = 0;
    let completedCount = 0;
    let totalAlerts = 0;
    let unresolvedAlerts = 0;

    for (const attempt of exam.attempts) {
      const student = attempt.student;
      const isOnline = await this.isStudentOnline(attempt.id);

      // Calculate progress
      const answeredCount = attempt.answers.length;
      const progress = totalQuestions > 0
        ? Math.round((answeredCount / totalQuestions) * 100)
        : 0;

      // Calculate time remaining
      const endTime = new Date(
        attempt.startedAt.getTime() + exam.durationMinutes * 60 * 1000,
      );
      const timeRemaining = Math.max(
        0,
        Math.floor((endTime.getTime() - Date.now()) / 1000),
      );

      // Get latest verification
      const latestVerification = attempt.verificationLogs[0];
      const lastVerification = latestVerification
        ? {
            isVerified: latestVerification.isVerified,
            matchScore: latestVerification.matchScore,
            timestamp: latestVerification.verifiedAt.toISOString(),
          }
        : undefined;

      // Count alerts
      const attemptAlerts = attempt.alerts.length;
      const attemptUnresolvedAlerts = attempt.alerts.filter(
        (a) => !a.isResolved,
      ).length;

      totalAlerts += attemptAlerts;
      unresolvedAlerts += attemptUnresolvedAlerts;

      if (attempt.status === AttemptStatus.IN_PROGRESS) {
        activeCount++;
      } else if (
        attempt.status === AttemptStatus.SUBMITTED ||
        attempt.status === AttemptStatus.GRADED
      ) {
        completedCount++;
      }

      students.push({
        attemptId: attempt.id,
        studentId: student.id,
        studentNumber: student.studentNumber,
        studentName: student.nameEn,
        status: attempt.status,
        isOnline,
        lastVerification,
        alertCount: attemptAlerts,
        unresolvedAlerts: attemptUnresolvedAlerts,
        progress,
        timeRemaining,
      });
    }

    return {
      examId: exam.id,
      examTitle: exam.titleEn,
      status: exam.status,
      totalStudents: exam.course.enrollments.length,
      activeStudents: activeCount,
      completedStudents: completedCount,
      totalAlerts,
      unresolvedAlerts,
      students,
    };
  }

  async setStudentOnline(attemptId: string, socketId: string) {
    await this.redis.set(
      `monitoring:online:${attemptId}`,
      socketId,
      3600, // 1 hour TTL
    );
  }

  async setStudentOffline(attemptId: string) {
    await this.redis.del(`monitoring:online:${attemptId}`);
  }

  async isStudentOnline(attemptId: string): Promise<boolean> {
    const socketId = await this.redis.get(`monitoring:online:${attemptId}`);
    return !!socketId;
  }

  async getActiveExams(): Promise<any[]> {
    const exams = await this.prisma.exam.findMany({
      where: {
        status: ExamStatus.ACTIVE,
      },
      include: {
        course: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    const result = [];

    for (const exam of exams) {
      const activeAttempts = await this.prisma.examAttempt.count({
        where: {
          examId: exam.id,
          status: AttemptStatus.IN_PROGRESS,
        },
      });

      const unresolvedAlerts = await this.prisma.examAlert.count({
        where: {
          attempt: { examId: exam.id },
          isResolved: false,
        },
      });

      result.push({
        id: exam.id,
        titleAr: exam.titleAr,
        titleEn: exam.titleEn,
        course: exam.course,
        totalAttempts: exam._count.attempts,
        activeAttempts,
        unresolvedAlerts,
        scheduledAt: exam.scheduledAt,
        endTime: exam.endTime,
      });
    }

    return result;
  }

  async logStudentActivity(
    attemptId: string,
    activity: {
      type: string;
      timestamp: Date;
      metadata?: Record<string, any>;
    },
  ) {
    // Store activity in Redis for real-time access
    const key = `monitoring:activity:${attemptId}`;
    const activities = await this.redis.get(key);
    const activityList = activities ? JSON.parse(activities) : [];

    activityList.push(activity);

    // Keep only last 100 activities
    if (activityList.length > 100) {
      activityList.shift();
    }

    await this.redis.set(key, JSON.stringify(activityList), 7200); // 2 hours TTL
  }

  async getStudentActivity(attemptId: string) {
    const key = `monitoring:activity:${attemptId}`;
    const activities = await this.redis.get(key);
    return activities ? JSON.parse(activities) : [];
  }

  async getActiveStudents(examId: string): Promise<StudentStatus[]> {
    const attempts = await this.prisma.examAttempt.findMany({
      where: {
        examId,
        status: AttemptStatus.IN_PROGRESS,
      },
      include: {
        student: true,
        answers: true,
        alerts: {
          where: { isResolved: false },
        },
        verificationLogs: {
          orderBy: { verifiedAt: 'desc' },
          take: 1,
        },
        exam: {
          include: {
            questions: true,
          },
        },
      },
    });

    const students: StudentStatus[] = [];

    for (const attempt of attempts) {
      const isOnline = await this.isStudentOnline(attempt.id);
      const totalQuestions = attempt.exam.questions.length;
      const answeredCount = attempt.answers.length;
      const progress = totalQuestions > 0
        ? Math.round((answeredCount / totalQuestions) * 100)
        : 0;

      const endTime = new Date(
        attempt.startedAt.getTime() + attempt.exam.durationMinutes * 60 * 1000,
      );
      const timeRemaining = Math.max(
        0,
        Math.floor((endTime.getTime() - Date.now()) / 1000),
      );

      const latestVerification = attempt.verificationLogs[0];
      const lastVerification = latestVerification
        ? {
            isVerified: latestVerification.isVerified,
            matchScore: latestVerification.matchScore,
            timestamp: latestVerification.verifiedAt.toISOString(),
          }
        : undefined;

      students.push({
        attemptId: attempt.id,
        studentId: attempt.student.id,
        studentNumber: attempt.student.studentNumber,
        studentName: attempt.student.nameEn,
        status: attempt.status,
        isOnline,
        lastVerification,
        alertCount: attempt.alerts.length,
        unresolvedAlerts: attempt.alerts.length,
        progress,
        timeRemaining,
      });
    }

    return students;
  }
}

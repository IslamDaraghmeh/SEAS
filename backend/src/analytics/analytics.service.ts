import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';

export interface ExamAnalytics {
  examId: string;
  examTitle: string;
  totalStudents: number;
  submittedCount: number;
  completionRate: number;
  averageScore: number;
  medianScore: number;
  highestScore: number;
  lowestScore: number;
  passingRate: number;
  scoreDistribution: { range: string; count: number }[];
  averageTimeSpent: number; // in minutes
  verificationStats: {
    totalVerifications: number;
    successfulVerifications: number;
    failedVerifications: number;
    successRate: number;
  };
  alertStats: {
    total: number;
    byType: { type: string; count: number }[];
    bySeverity: { severity: string; count: number }[];
  };
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalExams: number;
  activeExams: number;
  recentActivity: {
    type: string;
    count: number;
    change: number; // percentage change from previous period
  }[];
  verificationTrends: {
    date: string;
    total: number;
    successful: number;
    failed: number;
  }[];
  alertTrends: {
    date: string;
    total: number;
    bySeverity: Record<string, number>;
  }[];
}

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async getExamAnalytics(examId: string): Promise<ExamAnalytics> {
    // Try cache first
    const cached = await this.cache.getExamStats<ExamAnalytics>(examId);
    if (cached) return cached;

    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: { titleEn: true, passingScore: true },
    });

    const attempts = await this.prisma.examAttempt.findMany({
      where: { examId },
      include: {
        verificationLogs: true,
        alerts: true,
      },
    });

    const submittedAttempts = attempts.filter(
      (a) => a.status === 'SUBMITTED' || a.status === 'GRADED',
    );

    const scores = submittedAttempts
      .filter((a) => a.percentage !== null)
      .map((a) => a.percentage as number)
      .sort((a, b) => a - b);

    // Calculate score distribution
    const scoreRanges = [
      { range: '0-10', min: 0, max: 10 },
      { range: '11-20', min: 11, max: 20 },
      { range: '21-30', min: 21, max: 30 },
      { range: '31-40', min: 31, max: 40 },
      { range: '41-50', min: 41, max: 50 },
      { range: '51-60', min: 51, max: 60 },
      { range: '61-70', min: 61, max: 70 },
      { range: '71-80', min: 71, max: 80 },
      { range: '81-90', min: 81, max: 90 },
      { range: '91-100', min: 91, max: 100 },
    ];

    const scoreDistribution = scoreRanges.map((range) => ({
      range: range.range,
      count: scores.filter((s) => s >= range.min && s <= range.max).length,
    }));

    // Calculate verification stats
    const allVerifications = attempts.flatMap((a) => a.verificationLogs);
    const successfulVerifications = allVerifications.filter((v) => v.isVerified).length;

    // Calculate alert stats
    const allAlerts = attempts.flatMap((a) => a.alerts);
    const alertsByType = this.groupBy(allAlerts, 'type');
    const alertsBySeverity = this.groupBy(allAlerts, 'severity');

    // Calculate average time spent
    const timesSpent = submittedAttempts
      .filter((a) => a.startedAt && a.submittedAt)
      .map((a) => {
        const start = new Date(a.startedAt!).getTime();
        const end = new Date(a.submittedAt!).getTime();
        return (end - start) / 1000 / 60; // minutes
      });

    const averageTimeSpent =
      timesSpent.length > 0
        ? timesSpent.reduce((a, b) => a + b, 0) / timesSpent.length
        : 0;

    const analytics: ExamAnalytics = {
      examId,
      examTitle: exam?.titleEn || '',
      totalStudents: attempts.length,
      submittedCount: submittedAttempts.length,
      completionRate:
        attempts.length > 0
          ? (submittedAttempts.length / attempts.length) * 100
          : 0,
      averageScore:
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0,
      medianScore:
        scores.length > 0
          ? scores[Math.floor(scores.length / 2)]
          : 0,
      highestScore: scores.length > 0 ? scores[scores.length - 1] : 0,
      lowestScore: scores.length > 0 ? scores[0] : 0,
      passingRate:
        scores.length > 0
          ? (scores.filter((s) => s >= (exam?.passingScore || 50)).length /
              scores.length) *
            100
          : 0,
      scoreDistribution,
      averageTimeSpent,
      verificationStats: {
        totalVerifications: allVerifications.length,
        successfulVerifications,
        failedVerifications: allVerifications.length - successfulVerifications,
        successRate:
          allVerifications.length > 0
            ? (successfulVerifications / allVerifications.length) * 100
            : 0,
      },
      alertStats: {
        total: allAlerts.length,
        byType: Object.entries(alertsByType).map(([type, items]) => ({
          type,
          count: items.length,
        })),
        bySeverity: Object.entries(alertsBySeverity).map(([severity, items]) => ({
          severity,
          count: items.length,
        })),
      },
    };

    // Cache for 2 minutes
    await this.cache.setExamStats(examId, analytics, 120);

    return analytics;
  }

  async getCourseAnalytics(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        exams: { select: { id: true } },
        enrollments: { select: { id: true } },
      },
    });

    if (!course) return null;

    const examAnalytics = await Promise.all(
      course.exams.map((exam) => this.getExamAnalytics(exam.id)),
    );

    return {
      courseId,
      totalExams: course.exams.length,
      totalStudents: course.enrollments.length,
      exams: examAnalytics,
      averageCourseScore:
        examAnalytics.length > 0
          ? examAnalytics.reduce((acc, e) => acc + e.averageScore, 0) /
            examAnalytics.length
          : 0,
    };
  }

  async getDashboardStats(days = 30): Promise<DashboardStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const previousStartDate = new Date();
    previousStartDate.setDate(previousStartDate.getDate() - days * 2);

    const [
      totalStudents,
      totalTeachers,
      totalCourses,
      totalExams,
      activeExams,
      currentPeriodAttempts,
      previousPeriodAttempts,
      verificationsByDay,
      alertsByDay,
    ] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.teacher.count(),
      this.prisma.course.count(),
      this.prisma.exam.count(),
      this.prisma.exam.count({ where: { status: 'ACTIVE' } }),
      this.prisma.examAttempt.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.examAttempt.count({
        where: {
          createdAt: { gte: previousStartDate, lt: startDate },
        },
      }),
      this.prisma.verificationLog.groupBy({
        by: ['verifiedAt'],
        _count: true,
        where: { verifiedAt: { gte: startDate } },
      }),
      this.prisma.examAlert.groupBy({
        by: ['createdAt', 'severity'],
        _count: true,
        where: { createdAt: { gte: startDate } },
      }),
    ]);

    // Calculate activity change
    const attemptChange =
      previousPeriodAttempts > 0
        ? ((currentPeriodAttempts - previousPeriodAttempts) /
            previousPeriodAttempts) *
          100
        : 0;

    // Process verification trends (group by day)
    const verificationTrends = this.processVerificationTrends(verificationsByDay);

    // Process alert trends
    const alertTrends = this.processAlertTrends(alertsByDay);

    return {
      totalStudents,
      totalTeachers,
      totalCourses,
      totalExams,
      activeExams,
      recentActivity: [
        {
          type: 'attempts',
          count: currentPeriodAttempts,
          change: attemptChange,
        },
      ],
      verificationTrends,
      alertTrends,
    };
  }

  async getVerificationAnalytics(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate) where.verifiedAt = { gte: startDate };
    if (endDate) where.verifiedAt = { ...where.verifiedAt, lte: endDate };

    const [total, successful, byScore] = await Promise.all([
      this.prisma.verificationLog.count({ where }),
      this.prisma.verificationLog.count({ where: { ...where, isVerified: true } }),
      this.prisma.verificationLog.groupBy({
        by: ['isVerified'],
        _avg: { matchScore: true, livenessScore: true },
        where,
      }),
    ]);

    return {
      total,
      successful,
      failed: total - successful,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      averageMatchScore:
        byScore.find((b) => b.isVerified)?._avg?.matchScore || 0,
      averageLivenessScore:
        byScore.find((b) => b.isVerified)?._avg?.livenessScore || 0,
    };
  }

  private groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
    return arr.reduce(
      (acc, item) => {
        const k = String(item[key]);
        if (!acc[k]) acc[k] = [];
        acc[k].push(item);
        return acc;
      },
      {} as Record<string, T[]>,
    );
  }

  private processVerificationTrends(data: any[]): any[] {
    // Group by date and calculate stats
    const byDate: Record<string, { total: number; successful: number; failed: number }> = {};

    data.forEach((item) => {
      const date = new Date(item.verifiedAt).toISOString().split('T')[0];
      if (!byDate[date]) {
        byDate[date] = { total: 0, successful: 0, failed: 0 };
      }
      byDate[date].total += item._count;
    });

    return Object.entries(byDate)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private processAlertTrends(data: any[]): any[] {
    const byDate: Record<string, { total: number; bySeverity: Record<string, number> }> = {};

    data.forEach((item) => {
      const date = new Date(item.createdAt).toISOString().split('T')[0];
      if (!byDate[date]) {
        byDate[date] = { total: 0, bySeverity: {} };
      }
      byDate[date].total += item._count;
      byDate[date].bySeverity[item.severity] =
        (byDate[date].bySeverity[item.severity] || 0) + item._count;
    });

    return Object.entries(byDate)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

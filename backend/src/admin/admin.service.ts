import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExamStatus, AttemptStatus } from '@prisma/client';

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalExams: number;
  activeExams: number;
  completedExams: number;
  passRate: number;
  recentActivity: RecentActivity[];
}

export interface RecentActivity {
  id: string;
  type: 'student_registered' | 'teacher_registered' | 'exam_created' | 'exam_completed';
  description: string;
  timestamp: Date;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(): Promise<DashboardStats> {
    // Get total counts
    const [
      totalStudents,
      totalTeachers,
      totalCourses,
      totalExams,
      activeExams,
      completedExams,
    ] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.teacher.count(),
      this.prisma.course.count({ where: { isActive: true } }),
      this.prisma.exam.count(),
      this.prisma.exam.count({
        where: {
          status: ExamStatus.ACTIVE,
        },
      }),
      this.prisma.exam.count({
        where: {
          status: ExamStatus.COMPLETED,
        },
      }),
    ]);

    // Calculate pass rate from exam attempts
    const attempts = await this.prisma.examAttempt.findMany({
      where: {
        status: AttemptStatus.GRADED,
      },
      select: {
        score: true,
        exam: {
          select: {
            passingScore: true,
          },
        },
      },
    });

    let passRate = 0;
    if (attempts.length > 0) {
      const passedCount = attempts.filter(
        (a) => a.score !== null && a.exam.passingScore !== null && a.score >= a.exam.passingScore,
      ).length;
      passRate = Math.round((passedCount / attempts.length) * 100);
    }

    // Get recent activity
    const recentActivity = await this.getRecentActivity();

    return {
      totalStudents,
      totalTeachers,
      totalCourses,
      totalExams,
      activeExams,
      completedExams,
      passRate,
      recentActivity,
    };
  }

  private async getRecentActivity(): Promise<RecentActivity[]> {
    const activities: RecentActivity[] = [];

    // Get recent students
    const recentStudents = await this.prisma.student.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nameEn: true,
        createdAt: true,
      },
    });

    activities.push(
      ...recentStudents.map((s) => ({
        id: `student-${s.id}`,
        type: 'student_registered' as const,
        description: `New student registered: ${s.nameEn}`,
        timestamp: s.createdAt,
      })),
    );

    // Get recent teachers
    const recentTeachers = await this.prisma.teacher.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nameEn: true,
        createdAt: true,
      },
    });

    activities.push(
      ...recentTeachers.map((t) => ({
        id: `teacher-${t.id}`,
        type: 'teacher_registered' as const,
        description: `New teacher registered: ${t.nameEn}`,
        timestamp: t.createdAt,
      })),
    );

    // Get recent exams
    const recentExams = await this.prisma.exam.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        titleEn: true,
        status: true,
        createdAt: true,
      },
    });

    activities.push(
      ...recentExams.map((e) => ({
        id: `exam-${e.id}`,
        type: e.status === ExamStatus.COMPLETED ? 'exam_completed' as const : 'exam_created' as const,
        description: e.status === ExamStatus.COMPLETED
          ? `Exam completed: ${e.titleEn}`
          : `New exam created: ${e.titleEn}`,
        timestamp: e.createdAt,
      })),
    );

    // Sort by timestamp and return top 10
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  }
}

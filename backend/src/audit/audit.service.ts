import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface AuditLogData {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

export interface AuditQueryParams {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          userEmail: data.userEmail,
          userRole: data.userRole,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          details: data.details as Prisma.InputJsonValue,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          success: data.success ?? true,
          errorMessage: data.errorMessage,
        },
      });
    } catch (error) {
      // Log error but don't throw - audit logging should not break the app
      console.error('Failed to write audit log:', error);
    }
  }

  async logLogin(
    userId: string,
    email: string,
    role: string,
    ipAddress?: string,
    userAgent?: string,
    success = true,
    errorMessage?: string,
  ): Promise<void> {
    await this.log({
      userId,
      userEmail: email,
      userRole: role,
      action: 'LOGIN',
      resource: 'auth',
      ipAddress,
      userAgent,
      success,
      errorMessage,
    });
  }

  async logLogout(
    userId: string,
    email: string,
    role: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.log({
      userId,
      userEmail: email,
      userRole: role,
      action: 'LOGOUT',
      resource: 'auth',
      ipAddress,
    });
  }

  async logPasswordChange(
    userId: string,
    email: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.log({
      userId,
      userEmail: email,
      action: 'PASSWORD_CHANGE',
      resource: 'auth',
      ipAddress,
    });
  }

  async logFaceRegistration(
    userId: string,
    studentId: string,
    success: boolean,
    errorMessage?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'FACE_REGISTER',
      resource: 'verification',
      resourceId: studentId,
      success,
      errorMessage,
    });
  }

  async logFaceVerification(
    userId: string,
    attemptId: string,
    matchScore: number,
    success: boolean,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'FACE_VERIFY',
      resource: 'verification',
      resourceId: attemptId,
      details: { matchScore },
      success,
    });
  }

  async logExamStart(
    userId: string,
    examId: string,
    attemptId: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'EXAM_START',
      resource: 'exam',
      resourceId: attemptId,
      details: { examId },
      ipAddress,
    });
  }

  async logExamSubmit(
    userId: string,
    examId: string,
    attemptId: string,
    score?: number,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'EXAM_SUBMIT',
      resource: 'exam',
      resourceId: attemptId,
      details: { examId, score },
    });
  }

  async logGradeChange(
    teacherId: string,
    attemptId: string,
    questionId: string,
    oldPoints: number | null,
    newPoints: number,
  ): Promise<void> {
    await this.log({
      userId: teacherId,
      action: 'GRADE_CHANGE',
      resource: 'exam_answer',
      resourceId: attemptId,
      details: { questionId, oldPoints, newPoints },
    });
  }

  async logExport(
    userId: string,
    exportType: string,
    resource: string,
    resourceId?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'EXPORT',
      resource,
      resourceId,
      details: { exportType },
    });
  }

  async logCreate(
    userId: string,
    resource: string,
    resourceId: string,
    details?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'CREATE',
      resource,
      resourceId,
      details,
    });
  }

  async logUpdate(
    userId: string,
    resource: string,
    resourceId: string,
    changes?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'UPDATE',
      resource,
      resourceId,
      details: changes,
    });
  }

  async logDelete(
    userId: string,
    resource: string,
    resourceId: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'DELETE',
      resource,
      resourceId,
    });
  }

  async findAll(params: AuditQueryParams) {
    const {
      userId,
      action,
      resource,
      startDate,
      endDate,
      success,
      page = 1,
      limit = 50,
    } = params;

    const where: Prisma.AuditLogWhereInput = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (success !== undefined) where.success = success;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAuditStats(startDate?: Date, endDate?: Date) {
    const where: Prisma.AuditLogWhereInput = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [
      totalLogs,
      loginAttempts,
      failedLogins,
      examStarts,
      examSubmits,
      verifications,
      failedVerifications,
    ] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.count({ where: { ...where, action: 'LOGIN' } }),
      this.prisma.auditLog.count({
        where: { ...where, action: 'LOGIN', success: false },
      }),
      this.prisma.auditLog.count({ where: { ...where, action: 'EXAM_START' } }),
      this.prisma.auditLog.count({
        where: { ...where, action: 'EXAM_SUBMIT' },
      }),
      this.prisma.auditLog.count({
        where: { ...where, action: 'FACE_VERIFY' },
      }),
      this.prisma.auditLog.count({
        where: { ...where, action: 'FACE_VERIFY', success: false },
      }),
    ]);

    return {
      totalLogs,
      loginAttempts,
      failedLogins,
      examStarts,
      examSubmits,
      verifications,
      failedVerifications,
    };
  }
}

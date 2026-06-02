import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { QUEUE_NAMES } from '../queue.constants';
import { ExportJobData } from '../queue.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import * as fs from 'fs';
import * as path from 'path';

@Processor(QUEUE_NAMES.EXPORT)
export class ExportProcessor {
  private exportDir = path.join(process.cwd(), 'exports');

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {
    // Ensure export directory exists
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  @Process('export')
  async handleExport(job: Job<ExportJobData>) {
    const { type, format, filters, userId, email } = job.data;

    try {
      await job.progress(10);

      let data: any[];
      let filename: string;
      let content: string;

      switch (type) {
        case 'verification-logs':
          data = await this.getVerificationLogs(filters);
          filename = `verification-logs-${Date.now()}`;
          break;
        case 'exam-results':
          data = await this.getExamResults(filters);
          filename = `exam-results-${Date.now()}`;
          break;
        case 'analytics':
          data = await this.getAnalyticsData(filters);
          filename = `analytics-${Date.now()}`;
          break;
        case 'student-report':
          data = await this.getStudentReport(filters);
          filename = `student-report-${Date.now()}`;
          break;
        default:
          throw new Error(`Unknown export type: ${type}`);
      }

      await job.progress(50);

      // Generate file based on format
      switch (format) {
        case 'csv':
          content = this.generateCSV(data);
          filename += '.csv';
          break;
        case 'xlsx':
          // For XLSX, we'd need a library like xlsx or exceljs
          // For now, fallback to CSV
          content = this.generateCSV(data);
          filename += '.csv';
          break;
        case 'pdf':
          // For PDF, we'd need a library like pdfkit or puppeteer
          // For now, create a simple text summary
          content = this.generateTextReport(data);
          filename += '.txt';
          break;
        default:
          content = this.generateCSV(data);
          filename += '.csv';
      }

      await job.progress(80);

      // Save file
      const filePath = path.join(this.exportDir, filename);
      fs.writeFileSync(filePath, content);

      await job.progress(90);

      // Store export metadata in Redis for download
      const exportKey = `export:${job.id}`;
      await this.redis.setJson(exportKey, {
        filePath,
        filename,
        userId,
        email,
        type,
        format,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      }, 86400); // Expire after 24 hours

      await job.progress(100);

      return {
        success: true,
        filename,
        filePath,
        recordCount: data.length,
      };
    } catch (error) {
      console.error('Export processing error:', error);
      throw error;
    }
  }

  private async getVerificationLogs(filters: Record<string, any>) {
    const where: any = {};

    if (filters.examId) {
      where.attempt = { examId: filters.examId };
    }
    if (filters.startDate) {
      where.verifiedAt = { gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      where.verifiedAt = { ...where.verifiedAt, lte: new Date(filters.endDate) };
    }

    return this.prisma.verificationLog.findMany({
      where,
      include: {
        attempt: {
          include: {
            student: { select: { nameEn: true, studentNumber: true } },
            exam: { select: { titleEn: true } },
          },
        },
      },
      orderBy: { verifiedAt: 'desc' },
      take: 10000, // Limit for safety
    });
  }

  private async getExamResults(filters: Record<string, any>) {
    const where: any = { status: 'GRADED' };

    if (filters.examId) where.examId = filters.examId;
    if (filters.courseId) where.exam = { courseId: filters.courseId };

    return this.prisma.examAttempt.findMany({
      where,
      include: {
        student: { select: { nameEn: true, studentNumber: true, phone: true } },
        exam: { select: { titleEn: true, totalPoints: true } },
      },
      orderBy: { submittedAt: 'desc' },
      take: 10000,
    });
  }

  private async getAnalyticsData(filters: Record<string, any>) {
    // Aggregate analytics data
    const examId = filters.examId;

    const [attempts, verifications, alerts] = await Promise.all([
      this.prisma.examAttempt.findMany({
        where: examId ? { examId } : {},
        select: {
          score: true,
          percentage: true,
          status: true,
          startedAt: true,
          submittedAt: true,
        },
      }),
      this.prisma.verificationLog.groupBy({
        by: ['isVerified'],
        _count: true,
        where: examId ? { attempt: { examId } } : {},
      }),
      this.prisma.examAlert.groupBy({
        by: ['type', 'severity'],
        _count: true,
        where: examId ? { attempt: { examId } } : {},
      }),
    ]);

    return [
      { section: 'Attempts', data: attempts },
      { section: 'Verifications', data: verifications },
      { section: 'Alerts', data: alerts },
    ];
  }

  private async getStudentReport(filters: Record<string, any>) {
    const studentId = filters.studentId;
    if (!studentId) throw new Error('Student ID required');

    return this.prisma.examAttempt.findMany({
      where: { studentId },
      include: {
        exam: { select: { titleEn: true, totalPoints: true, durationMinutes: true } },
        verificationLogs: { select: { isVerified: true, matchScore: true } },
        alerts: { select: { type: true, severity: true, message: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private generateCSV(data: any[]): string {
    if (data.length === 0) return '';

    // Flatten nested objects for CSV
    const flattenedData = data.map(item => this.flattenObject(item));

    // Get all unique headers
    const headers = [...new Set(flattenedData.flatMap(item => Object.keys(item)))];

    // Generate CSV content
    const rows = flattenedData.map(item =>
      headers.map(header => {
        const value = item[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  private generateTextReport(data: any[]): string {
    let report = `Export Report\nGenerated: ${new Date().toISOString()}\n`;
    report += `Total Records: ${data.length}\n\n`;
    report += JSON.stringify(data, null, 2);
    return report;
  }

  private flattenObject(obj: any, prefix = ''): Record<string, any> {
    const result: Record<string, any> = {};

    for (const key of Object.keys(obj)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}_${key}` : key;

      if (value === null || value === undefined) {
        result[newKey] = '';
      } else if (Array.isArray(value)) {
        result[newKey] = value.length;
      } else if (typeof value === 'object' && !(value instanceof Date)) {
        Object.assign(result, this.flattenObject(value, newKey));
      } else if (value instanceof Date) {
        result[newKey] = value.toISOString();
      } else {
        result[newKey] = value;
      }
    }

    return result;
  }

  @OnQueueActive()
  onActive(job: Job<ExportJobData>) {
    console.log(`Processing export job ${job.id}: ${job.data.type} as ${job.data.format}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job<ExportJobData>, result: any) {
    console.log(`Export job ${job.id} completed. File: ${result?.filename}`);
  }

  @OnQueueFailed()
  onFailed(job: Job<ExportJobData>, error: Error) {
    console.error(`Export job ${job.id} failed:`, error.message);
  }
}

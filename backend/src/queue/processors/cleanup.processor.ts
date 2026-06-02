import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { QUEUE_NAMES } from '../queue.constants';
import { CleanupJobData } from '../queue.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import * as fs from 'fs';
import * as path from 'path';

@Processor(QUEUE_NAMES.CLEANUP)
export class CleanupProcessor {
  private exportDir = path.join(process.cwd(), 'exports');
  private tempDir = path.join(process.cwd(), 'temp');

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Process('cleanup')
  async handleCleanup(job: Job<CleanupJobData>) {
    const { type, olderThan } = job.data;

    try {
      await job.progress(10);

      let result: { deleted: number; type: string };

      switch (type) {
        case 'expired-tokens':
          result = await this.cleanExpiredTokens();
          break;
        case 'old-logs':
          result = await this.cleanOldLogs(olderThan || 365);
          break;
        case 'old-verifications':
          result = await this.cleanOldVerifications(olderThan || 90);
          break;
        case 'temp-files':
          result = await this.cleanTempFiles(olderThan || 1);
          break;
        default:
          throw new Error(`Unknown cleanup type: ${type}`);
      }

      await job.progress(100);

      return {
        success: true,
        ...result,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Cleanup processing error:', error);
      throw error;
    }
  }

  private async cleanExpiredTokens(): Promise<{ deleted: number; type: string }> {
    const now = new Date();

    // Clean expired refresh tokens from database
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          { revokedAt: { not: null } },
        ],
      },
    });

    // Clean expired tokens from Redis blacklist
    const blacklistKeys = await this.redis.keys('token:blacklist:*');
    // Redis keys will auto-expire, but we can manually clean if needed

    console.log(`Cleaned ${result.count} expired refresh tokens`);

    return { deleted: result.count, type: 'expired-tokens' };
  }

  private async cleanOldLogs(olderThanDays: number): Promise<{ deleted: number; type: string }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    console.log(`Cleaned ${result.count} audit logs older than ${olderThanDays} days`);

    return { deleted: result.count, type: 'old-logs' };
  }

  private async cleanOldVerifications(olderThanDays: number): Promise<{ deleted: number; type: string }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Delete old verification logs
    const logsResult = await this.prisma.verificationLog.deleteMany({
      where: {
        verifiedAt: { lt: cutoffDate },
      },
    });

    // Delete old face captures
    const capturesResult = await this.prisma.faceCapture.deleteMany({
      where: {
        capturedAt: { lt: cutoffDate },
      },
    });

    // Delete old resolved alerts
    const alertsResult = await this.prisma.examAlert.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isResolved: true,
      },
    });

    const totalDeleted = logsResult.count + capturesResult.count + alertsResult.count;
    console.log(`Cleaned ${totalDeleted} old verification records (logs: ${logsResult.count}, captures: ${capturesResult.count}, alerts: ${alertsResult.count})`);

    return { deleted: totalDeleted, type: 'old-verifications' };
  }

  private async cleanTempFiles(olderThanDays: number): Promise<{ deleted: number; type: string }> {
    let deletedCount = 0;
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

    // Clean export directory
    if (fs.existsSync(this.exportDir)) {
      const files = fs.readdirSync(this.exportDir);
      for (const file of files) {
        const filePath = path.join(this.exportDir, file);
        const stats = fs.statSync(filePath);
        if (stats.mtime.getTime() < cutoffTime) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    }

    // Clean temp directory
    if (fs.existsSync(this.tempDir)) {
      const files = fs.readdirSync(this.tempDir);
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        if (stats.mtime.getTime() < cutoffTime) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    }

    console.log(`Cleaned ${deletedCount} temporary files older than ${olderThanDays} days`);

    return { deleted: deletedCount, type: 'temp-files' };
  }

  @OnQueueActive()
  onActive(job: Job<CleanupJobData>) {
    console.log(`Processing cleanup job ${job.id}: ${job.data.type}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job<CleanupJobData>, result: any) {
    console.log(`Cleanup job ${job.id} completed. Deleted ${result?.deleted} items`);
  }

  @OnQueueFailed()
  onFailed(job: Job<CleanupJobData>, error: Error) {
    console.error(`Cleanup job ${job.id} failed:`, error.message);
  }
}

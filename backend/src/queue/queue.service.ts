import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { QUEUE_NAMES } from './queue.constants';

export interface VerificationJobData {
  attemptId: string;
  image: string;
  studentId: string;
  timestamp: string;
}

export interface ExportJobData {
  type: 'verification-logs' | 'exam-results' | 'analytics' | 'student-report';
  format: 'csv' | 'xlsx' | 'pdf';
  filters: Record<string, any>;
  userId: string;
  email: string;
}

export interface NotificationJobData {
  type: 'email' | 'push' | 'sms';
  recipient: string;
  template: string;
  data: Record<string, any>;
}

export interface CleanupJobData {
  type: 'expired-tokens' | 'old-logs' | 'old-verifications' | 'temp-files';
  olderThan?: number; // days
}

export interface JobStatus {
  id: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  progress: number;
  data: any;
  result?: any;
  error?: string;
  createdAt: Date;
  processedAt?: Date;
  finishedAt?: Date;
}

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(QUEUE_NAMES.VERIFICATION)
    private verificationQueue: Queue<VerificationJobData>,
    @InjectQueue(QUEUE_NAMES.EXPORT)
    private exportQueue: Queue<ExportJobData>,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION)
    private notificationQueue: Queue<NotificationJobData>,
    @InjectQueue(QUEUE_NAMES.CLEANUP)
    private cleanupQueue: Queue<CleanupJobData>,
  ) {}

  // Verification Queue Methods
  async addVerificationJob(data: VerificationJobData): Promise<Job<VerificationJobData>> {
    return this.verificationQueue.add('verify', data, {
      priority: 1, // High priority
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  // Export Queue Methods
  async addExportJob(data: ExportJobData): Promise<Job<ExportJobData>> {
    return this.exportQueue.add('export', data, {
      priority: 5, // Lower priority than verification
      attempts: 2,
    });
  }

  // Notification Queue Methods
  async addNotificationJob(data: NotificationJobData): Promise<Job<NotificationJobData>> {
    return this.notificationQueue.add('notify', data, {
      priority: 3,
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 5000,
      },
    });
  }

  // Cleanup Queue Methods
  async addCleanupJob(data: CleanupJobData): Promise<Job<CleanupJobData>> {
    return this.cleanupQueue.add('cleanup', data, {
      priority: 10, // Lowest priority
      attempts: 1,
    });
  }

  // Schedule recurring cleanup jobs
  async scheduleCleanupJobs(): Promise<void> {
    // Clean expired tokens daily
    await this.cleanupQueue.add(
      'cleanup',
      { type: 'expired-tokens' },
      {
        repeat: {
          cron: '0 2 * * *', // 2 AM daily
        },
      },
    );

    // Clean old verification logs weekly (keep 90 days)
    await this.cleanupQueue.add(
      'cleanup',
      { type: 'old-verifications', olderThan: 90 },
      {
        repeat: {
          cron: '0 3 * * 0', // 3 AM on Sundays
        },
      },
    );

    // Clean old audit logs monthly (keep 365 days)
    await this.cleanupQueue.add(
      'cleanup',
      { type: 'old-logs', olderThan: 365 },
      {
        repeat: {
          cron: '0 4 1 * *', // 4 AM on 1st of each month
        },
      },
    );
  }

  // Job Status Methods
  async getJobStatus(queueName: string, jobId: string): Promise<JobStatus | null> {
    const queue = this.getQueueByName(queueName);
    if (!queue) return null;

    const job = await queue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();

    return {
      id: job.id.toString(),
      status: state as JobStatus['status'],
      progress: job.progress() as number,
      data: job.data,
      result: job.returnvalue,
      error: job.failedReason,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
    };
  }

  async getQueueStats(queueName: string) {
    const queue = this.getQueueByName(queueName);
    if (!queue) return null;

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      name: queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  async getAllQueueStats() {
    const queues = Object.values(QUEUE_NAMES);
    const stats = await Promise.all(queues.map((name) => this.getQueueStats(name)));
    return stats;
  }

  private getQueueByName(name: string): Queue | null {
    switch (name) {
      case QUEUE_NAMES.VERIFICATION:
        return this.verificationQueue;
      case QUEUE_NAMES.EXPORT:
        return this.exportQueue;
      case QUEUE_NAMES.NOTIFICATION:
        return this.notificationQueue;
      case QUEUE_NAMES.CLEANUP:
        return this.cleanupQueue;
      default:
        return null;
    }
  }
}

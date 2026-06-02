import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QUEUE_NAMES } from '../queue.constants';
import { VerificationJobData } from '../queue.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Processor(QUEUE_NAMES.VERIFICATION)
export class VerificationProcessor {
  private imageProcessingUrl: string;

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private configService: ConfigService,
  ) {
    this.imageProcessingUrl = this.configService.get<string>(
      'IMAGE_PROCESSING_URL',
      'http://image-processing:8000',
    );
  }

  @Process('verify')
  async handleVerification(job: Job<VerificationJobData>) {
    const { attemptId, image, studentId, timestamp } = job.data;

    try {
      // Update job progress
      await job.progress(10);

      // Get student's face template
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        select: { faceTemplate: true, nameEn: true, studentNumber: true },
      });

      if (!student?.faceTemplate) {
        throw new Error('Face template not found for student');
      }

      await job.progress(20);

      // Call image processing service for verification
      const response = await fetch(`${this.imageProcessingUrl}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          template: student.faceTemplate.toString('base64'),
        }),
      });

      await job.progress(70);

      if (!response.ok) {
        throw new Error(`Image processing service error: ${response.statusText}`);
      }

      const result = await response.json();

      await job.progress(80);

      // Create verification log
      const verificationLog = await this.prisma.verificationLog.create({
        data: {
          attemptId,
          matchScore: result.matchScore || 0,
          livenessScore: result.livenessScore || 0,
          blinkDetected: result.blinkDetected || false,
          headPoseValid: result.headPoseValid || true,
          spoofScore: result.spoofScore || 0,
          isVerified: result.verified || false,
          failureReason: result.verified ? null : result.reason,
          metadata: {
            processedAt: new Date().toISOString(),
            jobId: job.id,
          },
        },
      });

      await job.progress(90);

      // Get attempt info for event
      const attempt = await this.prisma.examAttempt.findUnique({
        where: { id: attemptId },
        include: { exam: { select: { id: true, titleEn: true } } },
      });

      // Emit verification result event
      const eventData = {
        verificationId: verificationLog.id,
        attemptId,
        examId: attempt?.exam.id,
        studentId,
        studentNumber: student.studentNumber,
        studentName: student.nameEn,
        isVerified: result.verified,
        matchScore: result.matchScore || 0,
        livenessScore: result.livenessScore || 0,
        timestamp,
        capturedImage: result.verified ? undefined : image, // Only include image for failed verifications
        attemptInfo: {
          startedAt: attempt?.startedAt,
          examTitle: attempt?.exam.titleEn,
        },
      };

      if (result.verified) {
        this.eventEmitter.emit('verification.result', eventData);
      } else {
        this.eventEmitter.emit('verification.result', eventData);
        this.eventEmitter.emit('verification.failed', eventData);

        // Create alert for failed verification
        await this.prisma.examAlert.create({
          data: {
            attemptId,
            type: 'FACE_MISMATCH',
            severity: result.matchScore < 0.5 ? 'HIGH' : 'MEDIUM',
            message: `Verification failed for ${student.nameEn} (${student.studentNumber})`,
            metadata: {
              matchScore: result.matchScore,
              reason: result.reason,
              verificationLogId: verificationLog.id,
            },
          },
        });
      }

      await job.progress(100);

      return {
        success: true,
        verificationLogId: verificationLog.id,
        verified: result.verified,
        matchScore: result.matchScore,
      };
    } catch (error) {
      // Log error for debugging
      console.error('Verification processing error:', error);
      throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job<VerificationJobData>) {
    console.log(`Processing verification job ${job.id} for attempt ${job.data.attemptId}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job<VerificationJobData>, result: any) {
    console.log(`Verification job ${job.id} completed. Verified: ${result?.verified}`);
  }

  @OnQueueFailed()
  onFailed(job: Job<VerificationJobData>, error: Error) {
    console.error(`Verification job ${job.id} failed:`, error.message);
  }
}

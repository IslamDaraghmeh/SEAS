import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { VerificationProcessor } from './processors/verification.processor';
import { ExportProcessor } from './processors/export.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { CleanupProcessor } from './processors/cleanup.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { QUEUE_NAMES } from './queue.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD', ''),
        },
        defaultJobOptions: {
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 50, // Keep last 50 failed jobs
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.VERIFICATION },
      { name: QUEUE_NAMES.EXPORT },
      { name: QUEUE_NAMES.NOTIFICATION },
      { name: QUEUE_NAMES.CLEANUP },
    ),
    PrismaModule,
    RedisModule,
  ],
  providers: [
    QueueService,
    VerificationProcessor,
    ExportProcessor,
    NotificationProcessor,
    CleanupProcessor,
  ],
  exports: [QueueService, BullModule],
})
export class QueueModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { CoursesModule } from './courses/courses.module';
import { ExamsModule } from './exams/exams.module';
import { QuestionsModule } from './questions/questions.module';
import { AttemptsModule } from './attempts/attempts.module';
import { VerificationModule } from './verification/verification.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { QueueModule } from './queue/queue.module';
import { CacheModule } from './cache/cache.module';
import { QuestionBankModule } from './question-bank/question-bank.module';
import { WebRTCModule } from './webrtc/webrtc.module';
import { ChatModule } from './chat/chat.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SanitizePipe } from './common/pipes/sanitize.pipe';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Event Emitter for cross-module communication
    EventEmitterModule.forRoot(),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Core Services
    PrismaModule,
    RedisModule,

    // Feature Modules
    AuthModule,
    StudentsModule,
    TeachersModule,
    CoursesModule,
    ExamsModule,
    QuestionsModule,
    AttemptsModule,
    VerificationModule,
    MonitoringModule,
    HealthModule,
    AdminModule,
    AuditModule,
    QueueModule,
    CacheModule,
    QuestionBankModule,
    WebRTCModule,
    ChatModule,
    AnalyticsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_PIPE,
      useClass: SanitizePipe,
    },
  ],
})
export class AppModule {}

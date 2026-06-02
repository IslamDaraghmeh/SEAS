import { Module } from '@nestjs/common';
import { MonitoringGateway } from './monitoring.gateway';
import { MonitoringService } from './monitoring.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, RedisModule, AuthModule],
  providers: [MonitoringGateway, MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}

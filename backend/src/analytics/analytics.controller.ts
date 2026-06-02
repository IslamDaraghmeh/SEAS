import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getDashboardStats(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.analyticsService.getDashboardStats(days);
  }

  @Get('exams/:examId')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Get exam analytics' })
  getExamAnalytics(@Param('examId') examId: string) {
    return this.analyticsService.getExamAnalytics(examId);
  }

  @Get('courses/:courseId')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Get course analytics' })
  getCourseAnalytics(@Param('courseId') courseId: string) {
    return this.analyticsService.getCourseAnalytics(courseId);
  }

  @Get('verification')
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Get verification analytics' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getVerificationAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getVerificationAnalytics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}

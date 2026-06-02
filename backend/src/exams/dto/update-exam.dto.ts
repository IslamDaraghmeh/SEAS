import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ExamStatus } from '@prisma/client';

export class UpdateExamDto {
  @ApiPropertyOptional({
    example: 'امتحان نصف الفصل',
    description: 'Exam title in Arabic',
  })
  @IsString()
  @IsOptional()
  titleAr?: string;

  @ApiPropertyOptional({
    example: 'Midterm Exam',
    description: 'Exam title in English',
  })
  @IsString()
  @IsOptional()
  titleEn?: string;

  @ApiPropertyOptional({
    example: 'امتحان يغطي الوحدات 1-5',
    description: 'Exam description in Arabic',
  })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiPropertyOptional({
    example: 'Exam covering chapters 1-5',
    description: 'Exam description in English',
  })
  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @ApiPropertyOptional({
    example: 60,
    description: 'Exam duration in minutes',
  })
  @IsInt()
  @Min(1, { message: 'Duration must be at least 1 minute' })
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Total exam points',
  })
  @IsInt()
  @Min(1, { message: 'Total points must be at least 1' })
  @IsOptional()
  totalPoints?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Passing score percentage',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  passingScore?: number;

  @ApiPropertyOptional({
    example: '2024-06-15T09:00:00Z',
    description: 'Scheduled start time',
  })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional({
    example: '2024-06-15T11:00:00Z',
    description: 'Scheduled end time',
  })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({
    enum: ExamStatus,
    description: 'Exam status',
  })
  @IsEnum(ExamStatus)
  @IsOptional()
  status?: ExamStatus;

  @ApiPropertyOptional({
    example: true,
    description: 'Shuffle questions order',
  })
  @IsBoolean()
  @IsOptional()
  shuffleQuestions?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Shuffle answer options',
  })
  @IsBoolean()
  @IsOptional()
  shuffleOptions?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Require face verification',
  })
  @IsBoolean()
  @IsOptional()
  requireVerification?: boolean;

  @ApiPropertyOptional({
    example: 60,
    description: 'Verification interval in seconds',
  })
  @IsInt()
  @Min(10)
  @IsOptional()
  verificationInterval?: number;

  @ApiPropertyOptional({
    example: 'Room A-101',
    description: 'Exam location/room',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    example: 'No calculators allowed',
    description: 'Exam instructions in Arabic',
  })
  @IsString()
  @IsOptional()
  instructionsAr?: string;

  @ApiPropertyOptional({
    example: 'No calculators allowed',
    description: 'Exam instructions in English',
  })
  @IsString()
  @IsOptional()
  instructionsEn?: string;
}

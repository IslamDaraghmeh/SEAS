import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { AttemptStatus } from '@prisma/client';

export class QueryAttemptDto {
  @ApiPropertyOptional({
    description: 'Filter by exam ID',
  })
  @IsUUID()
  @IsOptional()
  examId?: string;

  @ApiPropertyOptional({
    description: 'Filter by student ID',
  })
  @IsUUID()
  @IsOptional()
  studentId?: string;

  @ApiPropertyOptional({
    enum: AttemptStatus,
    description: 'Filter by status',
  })
  @IsEnum(AttemptStatus)
  @IsOptional()
  status?: AttemptStatus;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'startedAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'startedAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

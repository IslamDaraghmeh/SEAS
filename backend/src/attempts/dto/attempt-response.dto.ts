import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttemptStatus } from '@prisma/client';

export class AttemptResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  examId: string;

  @ApiProperty()
  studentId: string;

  @ApiProperty({ enum: AttemptStatus })
  status: AttemptStatus;

  @ApiPropertyOptional()
  score?: number;

  @ApiPropertyOptional()
  percentage?: number;

  @ApiProperty()
  startedAt: Date;

  @ApiPropertyOptional()
  submittedAt?: Date;

  @ApiPropertyOptional()
  gradedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AttemptWithExamDto extends AttemptResponseDto {
  @ApiProperty()
  exam: {
    id: string;
    titleAr: string;
    titleEn: string;
    durationMinutes: number;
    totalPoints: number;
    course: {
      id: string;
      nameAr: string;
      nameEn: string;
    };
  };
}

export class AttemptWithAnswersDto extends AttemptResponseDto {
  @ApiProperty()
  answers: {
    id: string;
    questionId: string;
    selectedOptionId?: string;
    textAnswer?: string;
    pointsAwarded?: number;
    isCorrect?: boolean;
  }[];
}

export class AttemptListResponseDto {
  @ApiProperty({ type: [AttemptWithExamDto] })
  data: AttemptWithExamDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

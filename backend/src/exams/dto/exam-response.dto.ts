import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExamStatus } from '@prisma/client';

export class ExamResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  titleAr: string;

  @ApiProperty()
  titleEn: string;

  @ApiPropertyOptional()
  descriptionAr?: string;

  @ApiPropertyOptional()
  descriptionEn?: string;

  @ApiProperty()
  durationMinutes: number;

  @ApiProperty()
  totalPoints: number;

  @ApiProperty()
  passingScore: number;

  @ApiProperty()
  scheduledAt: Date;

  @ApiPropertyOptional()
  endTime?: Date;

  @ApiProperty({ enum: ExamStatus })
  status: ExamStatus;

  @ApiProperty()
  shuffleQuestions: boolean;

  @ApiProperty()
  shuffleOptions: boolean;

  @ApiProperty()
  requireVerification: boolean;

  @ApiPropertyOptional()
  verificationInterval?: number;

  @ApiPropertyOptional()
  location?: string;

  @ApiPropertyOptional()
  instructionsAr?: string;

  @ApiPropertyOptional()
  instructionsEn?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  course: {
    id: string;
    codeAr: string;
    codeEn: string;
    nameAr: string;
    nameEn: string;
  };
}

export class ExamListResponseDto {
  @ApiProperty({ type: [ExamResponseDto] })
  data: ExamResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class ExamWithQuestionsResponseDto extends ExamResponseDto {
  @ApiProperty()
  questions: {
    id: string;
    textAr: string;
    textEn: string;
    type: string;
    points: number;
    order: number;
    options: any[];
  }[];

  @ApiProperty()
  _count: {
    questions: number;
    attempts: number;
  };
}

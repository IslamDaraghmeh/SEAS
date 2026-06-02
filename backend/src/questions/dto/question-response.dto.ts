import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType } from '@prisma/client';

export class OptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  textAr: string;

  @ApiProperty()
  textEn: string;

  @ApiProperty()
  isCorrect: boolean;

  @ApiProperty()
  order: number;
}

export class QuestionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  textAr: string;

  @ApiProperty()
  textEn: string;

  @ApiProperty({ enum: QuestionType })
  type: QuestionType;

  @ApiProperty()
  points: number;

  @ApiProperty()
  order: number;

  @ApiPropertyOptional()
  hintAr?: string;

  @ApiPropertyOptional()
  hintEn?: string;

  @ApiPropertyOptional()
  explanationAr?: string;

  @ApiPropertyOptional()
  explanationEn?: string;

  @ApiPropertyOptional()
  correctAnswer?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [OptionResponseDto] })
  options: OptionResponseDto[];
}

// Response without correct answers (for students during exam)
export class QuestionForStudentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  textAr: string;

  @ApiProperty()
  textEn: string;

  @ApiProperty({ enum: QuestionType })
  type: QuestionType;

  @ApiProperty()
  points: number;

  @ApiProperty()
  order: number;

  @ApiPropertyOptional()
  hintAr?: string;

  @ApiPropertyOptional()
  hintEn?: string;

  @ApiProperty()
  options: {
    id: string;
    textAr: string;
    textEn: string;
    order: number;
  }[];
}

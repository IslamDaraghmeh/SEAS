import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType } from '@prisma/client';

export class UpdateOptionDto {
  @ApiPropertyOptional()
  id?: string;

  @ApiPropertyOptional({
    example: 'الإجابة أ',
    description: 'Option text in Arabic',
  })
  @IsString()
  @IsOptional()
  textAr?: string;

  @ApiPropertyOptional({
    example: 'Answer A',
    description: 'Option text in English',
  })
  @IsString()
  @IsOptional()
  textEn?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this option is correct',
  })
  @IsBoolean()
  @IsOptional()
  isCorrect?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Display order',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional({
    example: 'ما هو ناتج 2 + 2؟',
    description: 'Question text in Arabic',
  })
  @IsString()
  @IsOptional()
  textAr?: string;

  @ApiPropertyOptional({
    example: 'What is 2 + 2?',
    description: 'Question text in English',
  })
  @IsString()
  @IsOptional()
  textEn?: string;

  @ApiPropertyOptional({
    enum: QuestionType,
    description: 'Question type',
  })
  @IsEnum(QuestionType)
  @IsOptional()
  type?: QuestionType;

  @ApiPropertyOptional({
    example: 10,
    description: 'Points for this question',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  points?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Display order',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({
    example: 'تلميح: فكر في العملية الأساسية',
    description: 'Hint in Arabic',
  })
  @IsString()
  @IsOptional()
  hintAr?: string;

  @ApiPropertyOptional({
    example: 'Hint: Think about basic operations',
    description: 'Hint in English',
  })
  @IsString()
  @IsOptional()
  hintEn?: string;

  @ApiPropertyOptional({
    example: 'الجواب هو 4 لأن...',
    description: 'Explanation in Arabic',
  })
  @IsString()
  @IsOptional()
  explanationAr?: string;

  @ApiPropertyOptional({
    example: 'The answer is 4 because...',
    description: 'Explanation in English',
  })
  @IsString()
  @IsOptional()
  explanationEn?: string;

  @ApiPropertyOptional({
    type: [UpdateOptionDto],
    description: 'Answer options (replaces existing options)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOptionDto)
  @IsOptional()
  options?: UpdateOptionDto[];

  @ApiPropertyOptional({
    example: '4',
    description: 'Correct answer (for short answer/essay)',
  })
  @IsString()
  @IsOptional()
  correctAnswer?: string;
}

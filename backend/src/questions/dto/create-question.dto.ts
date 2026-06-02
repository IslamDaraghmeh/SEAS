import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType } from '@prisma/client';

export class CreateOptionDto {
  @ApiProperty({
    example: 'الإجابة أ',
    description: 'Option text in Arabic',
  })
  @IsString()
  @IsNotEmpty()
  textAr: string;

  @ApiProperty({
    example: 'Answer A',
    description: 'Option text in English',
  })
  @IsString()
  @IsNotEmpty()
  textEn: string;

  @ApiProperty({
    example: true,
    description: 'Whether this option is correct',
  })
  @IsBoolean()
  isCorrect: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Display order',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class CreateQuestionDto {
  @ApiProperty({
    example: 'uuid-here',
    description: 'Exam ID',
  })
  @IsUUID()
  @IsNotEmpty({ message: 'Exam ID is required' })
  examId: string;

  @ApiProperty({
    example: 'ما هو ناتج 2 + 2؟',
    description: 'Question text in Arabic',
  })
  @IsString()
  @IsNotEmpty({ message: 'Arabic text is required' })
  textAr: string;

  @ApiProperty({
    example: 'What is 2 + 2?',
    description: 'Question text in English',
  })
  @IsString()
  @IsNotEmpty({ message: 'English text is required' })
  textEn: string;

  @ApiProperty({
    enum: QuestionType,
    example: QuestionType.MULTIPLE_CHOICE,
    description: 'Question type',
  })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({
    example: 10,
    description: 'Points for this question',
  })
  @IsInt()
  @Min(1, { message: 'Points must be at least 1' })
  points: number;

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
    type: [CreateOptionDto],
    description: 'Answer options (for multiple choice/true false)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  @IsOptional()
  options?: CreateOptionDto[];

  @ApiPropertyOptional({
    example: '4',
    description: 'Correct answer (for short answer/essay)',
  })
  @IsString()
  @IsOptional()
  correctAnswer?: string;
}

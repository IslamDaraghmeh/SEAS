import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SubmitAnswerDto {
  @ApiProperty({
    example: 'uuid-here',
    description: 'Question ID',
  })
  @IsUUID()
  @IsNotEmpty({ message: 'Question ID is required' })
  questionId: string;

  @ApiPropertyOptional({
    example: 'uuid-here',
    description: 'Selected option ID (for multiple choice)',
  })
  @IsUUID()
  @IsOptional()
  selectedOptionId?: string;

  @ApiPropertyOptional({
    example: 'The answer is 4',
    description: 'Text answer (for short answer/essay)',
  })
  @IsString()
  @IsOptional()
  textAnswer?: string;
}

export class SubmitAllAnswersDto {
  @ApiProperty({
    type: [SubmitAnswerDto],
    description: 'All answers to submit',
  })
  answers: SubmitAnswerDto[];
}

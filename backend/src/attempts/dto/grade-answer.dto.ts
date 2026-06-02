import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class GradeAnswerDto {
  @ApiProperty({
    example: 'uuid-here',
    description: 'Answer ID',
  })
  @IsUUID()
  @IsNotEmpty({ message: 'Answer ID is required' })
  answerId: string;

  @ApiProperty({
    example: 10,
    description: 'Points awarded',
  })
  @IsInt()
  @Min(0)
  pointsAwarded: number;

  @ApiPropertyOptional({
    example: 'Good explanation but missing key point',
    description: 'Feedback for the answer',
  })
  @IsString()
  @IsOptional()
  feedback?: string;
}

export class GradeAttemptDto {
  @ApiProperty({
    type: [GradeAnswerDto],
    description: 'Grades for essay/short answer questions',
  })
  grades: GradeAnswerDto[];
}

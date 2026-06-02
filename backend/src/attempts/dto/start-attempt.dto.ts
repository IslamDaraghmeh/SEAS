import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class StartAttemptDto {
  @ApiProperty({
    example: 'uuid-here',
    description: 'Exam ID',
  })
  @IsUUID()
  @IsNotEmpty({ message: 'Exam ID is required' })
  examId: string;
}

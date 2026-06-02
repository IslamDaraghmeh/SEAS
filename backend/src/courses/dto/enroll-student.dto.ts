import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class EnrollStudentDto {
  @ApiProperty({
    type: [String],
    description: 'Array of student IDs to enroll',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  studentIds: string[];
}

export class UnenrollStudentDto {
  @ApiProperty({
    type: [String],
    description: 'Array of student IDs to unenroll',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  studentIds: string[];
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class FaceEnrollDto {
  @ApiProperty({
    example: 'uuid-here',
    description: 'Student ID',
  })
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    example: 'base64-encoded-image',
    description: 'Face image in base64 format',
  })
  @IsString()
  @IsNotEmpty()
  imageData: string;
}

export class FaceEnrollResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  studentId: string;

  @ApiProperty()
  enrolledAt: Date;
}

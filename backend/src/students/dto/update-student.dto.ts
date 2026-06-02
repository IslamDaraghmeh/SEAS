import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateStudentDto {
  @ApiPropertyOptional({
    example: 'أحمد محمد',
    description: 'Student name in Arabic',
  })
  @IsString()
  @IsOptional()
  nameAr?: string;

  @ApiPropertyOptional({
    example: 'Ahmad Mohammad',
    description: 'Student name in English',
  })
  @IsString()
  @IsOptional()
  nameEn?: string;

  @ApiPropertyOptional({
    example: '+970599123456',
    description: 'Student phone number',
  })
  @IsString()
  @IsOptional()
  phone?: string;
}

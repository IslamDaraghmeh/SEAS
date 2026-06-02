import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTeacherDto {
  @ApiPropertyOptional({
    example: 'د. أحمد محمد',
    description: 'Teacher name in Arabic',
  })
  @IsString()
  @IsOptional()
  nameAr?: string;

  @ApiPropertyOptional({
    example: 'Dr. Ahmad Mohammad',
    description: 'Teacher name in English',
  })
  @IsString()
  @IsOptional()
  nameEn?: string;

  @ApiPropertyOptional({
    example: 'قسم هندسة الحاسوب',
    description: 'Department name',
  })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({
    example: '+970599123456',
    description: 'Teacher phone number',
  })
  @IsString()
  @IsOptional()
  phone?: string;
}

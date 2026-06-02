import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';

export class UpdateCourseDto {
  @ApiPropertyOptional({
    example: 'CS101',
    description: 'Course code in Arabic',
  })
  @IsString()
  @IsOptional()
  codeAr?: string;

  @ApiPropertyOptional({
    example: 'CS101',
    description: 'Course code in English',
  })
  @IsString()
  @IsOptional()
  codeEn?: string;

  @ApiPropertyOptional({
    example: 'مقدمة في علم الحاسوب',
    description: 'Course name in Arabic',
  })
  @IsString()
  @IsOptional()
  nameAr?: string;

  @ApiPropertyOptional({
    example: 'Introduction to Computer Science',
    description: 'Course name in English',
  })
  @IsString()
  @IsOptional()
  nameEn?: string;

  @ApiPropertyOptional({
    example: 'مقدمة شاملة في علم الحاسوب',
    description: 'Course description in Arabic',
  })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiPropertyOptional({
    example: 'Comprehensive introduction to computer science',
    description: 'Course description in English',
  })
  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @ApiPropertyOptional({
    example: 'uuid-here',
    description: 'Teacher ID',
  })
  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @ApiPropertyOptional({
    example: '2024-1',
    description: 'Academic semester',
  })
  @IsString()
  @IsOptional()
  semester?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Course active status',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

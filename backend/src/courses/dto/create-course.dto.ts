import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsInt, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCourseDto {
  @ApiProperty({
    example: 'CS101',
    description: 'Unique course code',
  })
  @IsString()
  @IsNotEmpty({ message: 'Course code is required' })
  code: string;

  @ApiPropertyOptional({
    example: 'حسب101',
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

  @ApiProperty({
    example: 'مقدمة في علم الحاسوب',
    description: 'Course name in Arabic',
  })
  @IsString()
  @IsNotEmpty({ message: 'Arabic name is required' })
  nameAr: string;

  @ApiProperty({
    example: 'Introduction to Computer Science',
    description: 'Course name in English',
  })
  @IsString()
  @IsNotEmpty({ message: 'English name is required' })
  nameEn: string;

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

  @ApiProperty({
    example: 'uuid-here',
    description: 'Teacher ID',
  })
  @IsUUID()
  @IsNotEmpty({ message: 'Teacher ID is required' })
  teacherId: string;

  @ApiProperty({
    example: '2024-1',
    description: 'Academic semester',
  })
  @IsString()
  @IsNotEmpty({ message: 'Semester is required' })
  semester: string;

  @ApiPropertyOptional({
    example: '2026',
    description: 'Academic year',
  })
  @IsString()
  @IsOptional()
  academicYear?: string;

  @ApiPropertyOptional({
    example: 3,
    description: 'Credit hours',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  creditHours?: number;
}

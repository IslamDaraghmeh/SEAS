import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateTeacherDto {
  @ApiProperty({
    example: 'د. أحمد محمد',
    description: 'Teacher name in Arabic',
  })
  @IsString()
  @IsNotEmpty({ message: 'Arabic name is required' })
  nameAr: string;

  @ApiProperty({
    example: 'Dr. Ahmad Mohammad',
    description: 'Teacher name in English',
  })
  @IsString()
  @IsNotEmpty({ message: 'English name is required' })
  nameEn: string;

  @ApiProperty({
    example: 'teacher@aaup.edu',
    description: 'Teacher email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password (min 6 characters)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

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

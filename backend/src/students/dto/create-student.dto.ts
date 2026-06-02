import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({
    example: '2021123456',
    description: 'Student university number',
  })
  @IsString()
  @IsNotEmpty({ message: 'Student number is required' })
  studentNumber: string;

  @ApiProperty({
    example: 'أحمد محمد',
    description: 'Student name in Arabic',
  })
  @IsString()
  @IsNotEmpty({ message: 'Arabic name is required' })
  nameAr: string;

  @ApiProperty({
    example: 'Ahmad Mohammad',
    description: 'Student name in English',
  })
  @IsString()
  @IsNotEmpty({ message: 'English name is required' })
  nameEn: string;

  @ApiProperty({
    example: 'student@aaup.edu',
    description: 'Student email address',
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
    example: '+970599123456',
    description: 'Student phone number',
  })
  @IsString()
  @IsOptional()
  phone?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

class StudentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  studentNumber: string;

  @ApiProperty()
  nameAr: string;

  @ApiProperty()
  nameEn: string;

  @ApiPropertyOptional()
  faceEnrolledAt?: Date;
}

class TeacherDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nameAr: string;

  @ApiProperty()
  nameEn: string;

  @ApiPropertyOptional()
  department?: string;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  lastLoginAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: StudentDto })
  student?: StudentDto;

  @ApiPropertyOptional({ type: TeacherDto })
  teacher?: TeacherDto;
}

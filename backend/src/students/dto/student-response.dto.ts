import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StudentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  studentNumber: string;

  @ApiProperty()
  nameAr: string;

  @ApiProperty()
  nameEn: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  faceEnrolledAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    isActive: boolean;
  };
}

export class StudentListResponseDto {
  @ApiProperty({ type: [StudentResponseDto] })
  data: StudentResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { AlertType, AlertSeverity } from '@prisma/client';

export class CreateAlertDto {
  @ApiProperty({
    example: 'uuid-here',
    description: 'Exam attempt ID',
  })
  @IsUUID()
  @IsNotEmpty()
  attemptId: string;

  @ApiProperty({
    enum: AlertType,
    example: AlertType.FACE_MISMATCH,
    description: 'Type of alert',
  })
  @IsEnum(AlertType)
  type: AlertType;

  @ApiProperty({
    enum: AlertSeverity,
    example: AlertSeverity.HIGH,
    description: 'Alert severity',
  })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiProperty({
    example: 'Face mismatch detected at 10:15 AM',
    description: 'Alert message',
  })
  @IsString()
  @IsNotEmpty({ message: 'Alert message is required' })
  message: string;

  @ApiPropertyOptional({
    example: 'base64-encoded-image',
    description: 'Screenshot at time of alert',
  })
  @IsString()
  @IsOptional()
  screenshot?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class AlertResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  attemptId: string;

  @ApiProperty({ enum: AlertType })
  type: AlertType;

  @ApiProperty({ enum: AlertSeverity })
  severity: AlertSeverity;

  @ApiPropertyOptional()
  message?: string;

  @ApiProperty()
  isResolved: boolean;

  @ApiPropertyOptional()
  resolvedAt?: Date;

  @ApiPropertyOptional()
  resolvedBy?: string;

  @ApiProperty()
  createdAt: Date;
}

export class ResolveAlertDto {
  @ApiPropertyOptional({
    example: 'Student verified manually',
    description: 'Resolution notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

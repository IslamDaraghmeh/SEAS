import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class VerificationResultDto {
  @ApiProperty({
    example: 'uuid-here',
    description: 'Exam attempt ID',
  })
  @IsUUID()
  @IsNotEmpty()
  attemptId: string;

  @ApiProperty({
    example: 0.95,
    description: 'Face match score (0-1)',
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  matchScore: number;

  @ApiProperty({
    example: 0.98,
    description: 'Liveness detection score (0-1)',
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  livenessScore: number;

  @ApiProperty({
    example: true,
    description: 'Whether blink was detected',
  })
  @IsBoolean()
  blinkDetected: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether head pose is valid',
  })
  @IsBoolean()
  headPoseValid: boolean;

  @ApiProperty({
    example: 0.05,
    description: 'Anti-spoofing score (lower is better)',
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  spoofScore: number;

  @ApiProperty({
    example: true,
    description: 'Overall verification result',
  })
  @IsBoolean()
  isVerified: boolean;

  @ApiPropertyOptional({
    example: 'base64-encoded-image',
    description: 'Captured frame (base64)',
  })
  @IsString()
  @IsOptional()
  frameData?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class VerificationLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  attemptId: string;

  @ApiProperty()
  matchScore: number;

  @ApiProperty()
  livenessScore: number;

  @ApiProperty()
  blinkDetected: boolean;

  @ApiProperty()
  headPoseValid: boolean;

  @ApiProperty()
  spoofScore: number;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  verifiedAt: Date;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsEnum, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export enum ChallengeType {
  FRONT_SELFIE = 'front_selfie',
  TURN_LEFT = 'turn_left',
  TURN_RIGHT = 'turn_right',
  NOD = 'nod',
  BLINK = 'blink',
  LIP_MOVEMENT = 'lip_movement',
}

export class VerifyChallengeDto {
  @ApiProperty({
    description: 'Type of challenge to verify',
    enum: ChallengeType,
  })
  @IsEnum(ChallengeType)
  challengeType: ChallengeType;

  @ApiProperty({
    description: 'Base64 encoded images (single for static, sequence for motion)',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({
    description: 'Expected direction for pose challenges',
    required: false,
  })
  @IsOptional()
  @IsString()
  expectedDirection?: string;
}

export class ChallengeResultDto {
  @ApiProperty({ description: 'Whether the API call was successful' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Type of challenge that was verified' })
  @IsString()
  challengeType: string;

  @ApiProperty({ description: 'Whether the challenge was passed' })
  @IsBoolean()
  passed: boolean;

  @ApiProperty({ description: 'Confidence score (0-1)' })
  @IsNumber()
  confidence: number;

  @ApiProperty({ description: 'Challenge-specific details', required: false })
  @IsOptional()
  details?: Record<string, any>;

  @ApiProperty({ description: 'Error message if any', required: false })
  @IsOptional()
  @IsString()
  error?: string;
}

export class VerifyLipMovementDto {
  @ApiProperty({
    description: 'Sequence of base64 encoded images',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  images: string[];
}

export class LipMovementResultDto {
  @ApiProperty({ description: 'Whether the API call was successful' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Whether lip movement was detected' })
  @IsBoolean()
  movementDetected: boolean;

  @ApiProperty({ description: 'Confidence score (0-1)' })
  @IsNumber()
  confidence: number;

  @ApiProperty({ description: 'MAR change value', required: false })
  @IsOptional()
  @IsNumber()
  marChange?: number;

  @ApiProperty({ description: 'Number of frames analyzed', required: false })
  @IsOptional()
  @IsNumber()
  framesAnalyzed?: number;
}

export class VerifyNodDto {
  @ApiProperty({
    description: 'Sequence of base64 encoded images',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  images: string[];
}

export class NodResultDto {
  @ApiProperty({ description: 'Whether the API call was successful' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Whether head nod was detected' })
  @IsBoolean()
  nodDetected: boolean;

  @ApiProperty({ description: 'Pitch range in degrees' })
  @IsNumber()
  pitchRange: number;

  @ApiProperty({ description: 'Confidence score (0-1)' })
  @IsNumber()
  confidence: number;

  @ApiProperty({ description: 'Number of frames analyzed', required: false })
  @IsOptional()
  @IsNumber()
  framesAnalyzed?: number;
}

export class VerifyBlinkDto {
  @ApiProperty({
    description: 'Sequence of base64 encoded images',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  images: string[];
}

export class BlinkResultDto {
  @ApiProperty({ description: 'Whether the API call was successful' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Whether blink was detected' })
  @IsBoolean()
  blinkDetected: boolean;

  @ApiProperty({ description: 'Number of blinks detected' })
  @IsNumber()
  blinkCount: number;

  @ApiProperty({ description: 'Confidence score (0-1)' })
  @IsNumber()
  confidence: number;

  @ApiProperty({ description: 'Minimum EAR value', required: false })
  @IsOptional()
  @IsNumber()
  minEar?: number;
}

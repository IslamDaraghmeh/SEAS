import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

@Injectable()
export class AuthService {
  private readonly TOKEN_BLOCKLIST_PREFIX = 'token:blocked:';
  private readonly bcryptRounds: number;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    this.bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(user: User): Promise<TokenResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<TokenResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await this.hashPassword(registerDto.password);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email.toLowerCase(),
        passwordHash,
        role: registerDto.role || UserRole.STUDENT,
      },
    });

    return this.login(user);
  }

  async logout(userId: string, accessToken: string): Promise<void> {
    // Add access token to blocklist
    try {
      const decoded = this.jwtService.decode(accessToken) as { exp: number };
      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.redisService.set(
            `${this.TOKEN_BLOCKLIST_PREFIX}${accessToken}`,
            'blocked',
            ttl,
          );
        }
      }
    } catch (error) {
      // Token might be invalid, continue with logout
    }

    // Revoke all refresh tokens for user
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (!storedToken.user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const payload: JwtPayload = {
      sub: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async isTokenBlocked(token: string): Promise<boolean> {
    return this.redisService.exists(`${this.TOKEN_BLOCKLIST_PREFIX}${token}`);
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: true,
        teacher: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.bcryptRounds);
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');

    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '30d',
    );
    const expiresAt = new Date();

    // Parse duration (e.g., '30d', '7d')
    const match = refreshExpiresIn.match(/^(\d+)([dhms])$/);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];

      switch (unit) {
        case 'd':
          expiresAt.setDate(expiresAt.getDate() + value);
          break;
        case 'h':
          expiresAt.setHours(expiresAt.getHours() + value);
          break;
        case 'm':
          expiresAt.setMinutes(expiresAt.getMinutes() + value);
          break;
        case 's':
          expiresAt.setSeconds(expiresAt.getSeconds() + value);
          break;
      }
    } else {
      // Default to 30 days
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  // ============= PROFILE MANAGEMENT =============

  async updateProfile(
    userId: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      nameAr?: string;
      nameEn?: string;
      phone?: string;
      department?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { student: true, teacher: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Build update data
    const profileData: any = {};

    // Handle nameEn - either from nameEn directly or from firstName/lastName
    if (updateData.nameEn) {
      profileData.nameEn = updateData.nameEn;
    } else if (updateData.firstName || updateData.lastName) {
      profileData.nameEn = [updateData.firstName, updateData.lastName]
        .filter(Boolean)
        .join(' ');
    }

    // Handle nameAr
    if (updateData.nameAr) {
      profileData.nameAr = updateData.nameAr;
    }

    // Handle phone
    if (updateData.phone !== undefined) {
      profileData.phone = updateData.phone;
    }

    // Update student or teacher profile based on role
    if (user.student) {
      await this.prisma.student.update({
        where: { id: user.student.id },
        data: profileData,
      });
    } else if (user.teacher) {
      // Add department for teacher
      if (updateData.department !== undefined) {
        profileData.department = updateData.department;
      }
      await this.prisma.teacher.update({
        where: { id: user.teacher.id },
        data: profileData,
      });
    }

    return { success: true, message: 'Profile updated successfully' };
  }

  async updateAvatar(userId: string, file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // In a real implementation, you would upload to S3 or similar
    // For now, we'll just return a placeholder URL
    const avatarUrl = `/uploads/avatars/${userId}-${Date.now()}.${file.originalname.split('.').pop()}`;

    // Store avatar URL in user metadata or profile
    // This is a simplified implementation
    return { avatarUrl, message: 'Avatar uploaded successfully' };
  }

  // ============= PASSWORD MANAGEMENT =============

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true, message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Store reset token (expires in 1 hour)
    await this.redisService.set(
      `password-reset:${resetTokenHash}`,
      user.id,
      3600,
    );

    // In production, you would send an email here with the reset link
    // For development, we'll log the token
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return { success: true, message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const userId = await this.redisService.get(`password-reset:${tokenHash}`);

    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await this.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Delete the used token
    await this.redisService.del(`password-reset:${tokenHash}`);

    // Revoke all refresh tokens for security
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { success: true, message: 'Password reset successfully' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await this.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true, message: 'Password changed successfully' };
  }
}

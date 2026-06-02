import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

export const THROTTLE_CONFIG_KEY = 'throttle_config';

export interface ThrottleConfig {
  ttl: number;
  limit: number;
  errorMessage?: string;
}

interface ThrottlerLimitDetail {
  ttl: number;
  limit: number;
  key: string;
  tracker: string;
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

/**
 * Custom throttler guard with per-user rate limiting and custom error messages
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use user ID for authenticated requests, IP for anonymous
    const user = req.user;
    if (user?.sub || user?.id) {
      return `user:${user.sub || user.id}`;
    }
    return `ip:${req.ip}`;
  }

  protected async getErrorMessage(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<string> {
    const config = this.reflector.get<ThrottleConfig>(
      THROTTLE_CONFIG_KEY,
      context.getHandler(),
    );
    return (
      config?.errorMessage ||
      'Too many requests. Please try again later.'
    );
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const errorMessage = await this.getErrorMessage(context, throttlerLimitDetail);
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: errorMessage,
        error: 'Too Many Requests',
        retryAfter: throttlerLimitDetail.ttl,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

/**
 * Rate limit configurations for different endpoint types
 */
export const RateLimits = {
  // Authentication endpoints - strict limits
  AUTH_LOGIN: {
    ttl: 900, // 15 minutes
    limit: 5,
    errorMessage: 'Too many login attempts. Please try again in 15 minutes.',
  },
  AUTH_REGISTER: {
    ttl: 3600, // 1 hour
    limit: 3,
    errorMessage: 'Too many registration attempts. Please try again later.',
  },
  AUTH_PASSWORD_RESET: {
    ttl: 3600, // 1 hour
    limit: 3,
    errorMessage: 'Too many password reset attempts. Please try again later.',
  },

  // Verification endpoints
  VERIFICATION: {
    ttl: 60, // 1 minute
    limit: 10,
    errorMessage: 'Too many verification attempts. Please slow down.',
  },
  FACE_REGISTER: {
    ttl: 300, // 5 minutes
    limit: 5,
    errorMessage: 'Too many face registration attempts. Please try again later.',
  },

  // Export endpoints
  EXPORT: {
    ttl: 60, // 1 minute
    limit: 5,
    errorMessage: 'Too many export requests. Please wait before requesting another export.',
  },

  // General API endpoints
  DEFAULT: {
    ttl: 60, // 1 minute
    limit: 100,
    errorMessage: 'Too many requests. Please try again later.',
  },
  STRICT: {
    ttl: 60, // 1 minute
    limit: 30,
    errorMessage: 'Rate limit exceeded. Please try again later.',
  },
};

/**
 * Decorator to apply custom rate limiting to a route
 */
import { SetMetadata, applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

export const CustomThrottle = (config: ThrottleConfig) =>
  applyDecorators(
    SetMetadata(THROTTLE_CONFIG_KEY, config),
    Throttle({ default: { ttl: config.ttl * 1000, limit: config.limit } }),
  );

// Pre-configured throttle decorators
export const ThrottleLogin = () => CustomThrottle(RateLimits.AUTH_LOGIN);
export const ThrottleRegister = () => CustomThrottle(RateLimits.AUTH_REGISTER);
export const ThrottlePasswordReset = () =>
  CustomThrottle(RateLimits.AUTH_PASSWORD_RESET);
export const ThrottleVerification = () =>
  CustomThrottle(RateLimits.VERIFICATION);
export const ThrottleFaceRegister = () =>
  CustomThrottle(RateLimits.FACE_REGISTER);
export const ThrottleExport = () => CustomThrottle(RateLimits.EXPORT);
export const ThrottleStrict = () => CustomThrottle(RateLimits.STRICT);

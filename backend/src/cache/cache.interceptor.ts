import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { CACHE_KEY, CACHE_EVICT_KEY, CacheConfig, CacheEvictConfig } from './cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private cacheService: CacheService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cacheConfig = this.reflector.get<CacheConfig>(
      CACHE_KEY,
      context.getHandler(),
    );
    const evictConfig = this.reflector.get<CacheEvictConfig>(
      CACHE_EVICT_KEY,
      context.getHandler(),
    );

    const request = context.switchToHttp().getRequest();

    // Handle cache eviction
    if (evictConfig) {
      return next.handle().pipe(
        tap(async () => {
          const resourceId = request.params?.id;
          if (evictConfig.allEntries) {
            await this.cacheService.deleteByPattern(`${evictConfig.key}:*`);
          } else if (resourceId) {
            await this.cacheService.delete(`${evictConfig.key}:${resourceId}`);
          }
        }),
      );
    }

    // Handle caching
    if (cacheConfig) {
      const cacheKey = this.generateCacheKey(cacheConfig.key, request);

      // Check cache
      const cachedResult = await this.cacheService.get(cacheKey);
      if (cachedResult !== null) {
        return of(cachedResult);
      }

      // Execute and cache result
      return next.handle().pipe(
        tap(async (result) => {
          if (result !== null && result !== undefined) {
            await this.cacheService.set(cacheKey, result, cacheConfig.ttl);
          }
        }),
      );
    }

    return next.handle();
  }

  private generateCacheKey(prefix: string, request: any): string {
    const parts = [prefix];

    // Add route params to key
    if (request.params) {
      const paramValues = Object.values(request.params).filter(Boolean);
      parts.push(...paramValues as string[]);
    }

    // Add relevant query params to key
    if (request.query) {
      const relevantParams = ['page', 'limit', 'sort', 'filter', 'status'];
      const queryParts = relevantParams
        .filter((key) => request.query[key])
        .map((key) => `${key}:${request.query[key]}`);
      if (queryParts.length > 0) {
        parts.push(queryParts.join(','));
      }
    }

    return parts.join(':');
  }
}

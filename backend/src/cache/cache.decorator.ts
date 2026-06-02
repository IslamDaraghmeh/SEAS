import { SetMetadata, applyDecorators } from '@nestjs/common';

export const CACHE_KEY = 'cache_config';
export const CACHE_EVICT_KEY = 'cache_evict_config';

export interface CacheConfig {
  key: string;
  ttl: number; // seconds
  keyGenerator?: (...args: any[]) => string;
}

export interface CacheEvictConfig {
  key: string;
  allEntries?: boolean;
}

/**
 * Cache decorator for caching method results
 * @param key - Cache key prefix (e.g., 'exam', 'question')
 * @param ttl - Time to live in seconds
 */
export const Cacheable = (key: string, ttl: number) =>
  SetMetadata<string, CacheConfig>(CACHE_KEY, { key, ttl });

/**
 * Cache eviction decorator
 * @param key - Cache key prefix to evict
 * @param allEntries - If true, evict all entries with this prefix
 */
export const CacheEvict = (key: string, allEntries = false) =>
  SetMetadata<string, CacheEvictConfig>(CACHE_EVICT_KEY, { key, allEntries });

/**
 * Combine cache eviction with method execution
 */
export const CachePut = (key: string, ttl: number) =>
  applyDecorators(
    Cacheable(key, ttl),
    CacheEvict(key),
  );

// Pre-configured cache decorators with sensible TTLs
export const CacheExam = () => Cacheable('exam', 300); // 5 minutes
export const CacheQuestions = () => Cacheable('questions', 600); // 10 minutes
export const CacheStudent = () => Cacheable('student', 300); // 5 minutes
export const CacheVerification = () => Cacheable('verification', 60); // 1 minute
export const CacheStats = () => Cacheable('stats', 120); // 2 minutes

export const EvictExam = () => CacheEvict('exam', true);
export const EvictQuestions = () => CacheEvict('questions', true);
export const EvictStudent = () => CacheEvict('student', true);
export const EvictVerification = () => CacheEvict('verification', true);

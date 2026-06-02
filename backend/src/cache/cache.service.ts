import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface CacheOptions {
  ttl?: number; // seconds
  prefix?: string;
}

@Injectable()
export class CacheService {
  private readonly defaultTTL = 300; // 5 minutes
  private readonly keyPrefix = 'cache:';

  constructor(private redis: RedisService) {}

  /**
   * Generate a cache key from prefix and identifiers
   */
  generateKey(prefix: string, ...identifiers: (string | number)[]): string {
    return `${this.keyPrefix}${prefix}:${identifiers.join(':')}`;
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = key.startsWith(this.keyPrefix) ? key : `${this.keyPrefix}${key}`;
    return this.redis.getJson<T>(fullKey);
  }

  /**
   * Set cached value
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const fullKey = key.startsWith(this.keyPrefix) ? key : `${this.keyPrefix}${key}`;
    await this.redis.setJson(fullKey, value, ttl || this.defaultTTL);
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    const fullKey = key.startsWith(this.keyPrefix) ? key : `${this.keyPrefix}${key}`;
    await this.redis.del(fullKey);
  }

  /**
   * Delete all cached values matching a pattern
   */
  async deleteByPattern(pattern: string): Promise<void> {
    const fullPattern = pattern.startsWith(this.keyPrefix)
      ? pattern
      : `${this.keyPrefix}${pattern}`;
    await this.redis.delByPattern(fullPattern);
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    const fullKey = key.startsWith(this.keyPrefix) ? key : `${this.keyPrefix}${key}`;
    return this.redis.exists(fullKey);
  }

  /**
   * Get or set cached value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidate all cache entries for a resource type
   */
  async invalidateResource(resourceType: string): Promise<void> {
    await this.deleteByPattern(`${resourceType}:*`);
  }

  // ============= Exam Caching =============

  async getExam<T>(examId: string): Promise<T | null> {
    return this.get<T>(`exam:${examId}`);
  }

  async setExam<T>(examId: string, exam: T, ttl = 300): Promise<void> {
    await this.set(`exam:${examId}`, exam, ttl);
  }

  async invalidateExam(examId: string): Promise<void> {
    await this.delete(`exam:${examId}`);
    await this.deleteByPattern(`exam:${examId}:*`);
  }

  // ============= Questions Caching =============

  async getQuestions<T>(examId: string): Promise<T | null> {
    return this.get<T>(`questions:${examId}`);
  }

  async setQuestions<T>(examId: string, questions: T, ttl = 600): Promise<void> {
    await this.set(`questions:${examId}`, questions, ttl);
  }

  async invalidateQuestions(examId: string): Promise<void> {
    await this.delete(`questions:${examId}`);
  }

  // ============= Verification Status Caching =============

  async getVerificationStatus<T>(attemptId: string): Promise<T | null> {
    return this.get<T>(`verification:${attemptId}`);
  }

  async setVerificationStatus<T>(attemptId: string, status: T, ttl = 60): Promise<void> {
    await this.set(`verification:${attemptId}`, status, ttl);
  }

  async invalidateVerificationStatus(attemptId: string): Promise<void> {
    await this.delete(`verification:${attemptId}`);
  }

  // ============= Student List Caching =============

  async getStudentList<T>(courseId: string): Promise<T | null> {
    return this.get<T>(`students:${courseId}`);
  }

  async setStudentList<T>(courseId: string, students: T, ttl = 300): Promise<void> {
    await this.set(`students:${courseId}`, students, ttl);
  }

  async invalidateStudentList(courseId: string): Promise<void> {
    await this.delete(`students:${courseId}`);
  }

  // ============= Statistics Caching =============

  async getExamStats<T>(examId: string): Promise<T | null> {
    return this.get<T>(`stats:exam:${examId}`);
  }

  async setExamStats<T>(examId: string, stats: T, ttl = 120): Promise<void> {
    await this.set(`stats:exam:${examId}`, stats, ttl);
  }

  async invalidateExamStats(examId: string): Promise<void> {
    await this.delete(`stats:exam:${examId}`);
  }

  // ============= Monitoring Data Caching =============

  async getMonitoringData<T>(examId: string): Promise<T | null> {
    return this.get<T>(`monitoring:${examId}`);
  }

  async setMonitoringData<T>(examId: string, data: T, ttl = 30): Promise<void> {
    await this.set(`monitoring:${examId}`, data, ttl);
  }

  async invalidateMonitoringData(examId: string): Promise<void> {
    await this.delete(`monitoring:${examId}`);
  }

  // ============= Course Caching =============

  async getCourse<T>(courseId: string): Promise<T | null> {
    return this.get<T>(`course:${courseId}`);
  }

  async setCourse<T>(courseId: string, course: T, ttl = 300): Promise<void> {
    await this.set(`course:${courseId}`, course, ttl);
  }

  async invalidateCourse(courseId: string): Promise<void> {
    await this.delete(`course:${courseId}`);
    await this.invalidateStudentList(courseId);
  }
}

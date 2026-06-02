import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class SanitizePipe implements PipeTransform {
  private readonly htmlTagPattern = /<[^>]*>/g;
  private readonly scriptPattern =
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  private readonly onEventPattern = /on\w+\s*=/gi;
  private readonly sqlInjectionPattern =
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/gi;

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }

    if (value === null || value === undefined) {
      return value;
    }

    return this.sanitizeValue(value);
  }

  private sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item));
    }

    if (typeof value === 'object' && value !== null) {
      const sanitized: Record<string, any> = {};
      for (const key of Object.keys(value)) {
        // Skip binary/buffer fields
        if (value[key] instanceof Buffer || value[key] instanceof Uint8Array) {
          sanitized[key] = value[key];
          continue;
        }
        // Skip base64 encoded images
        if (
          key.toLowerCase().includes('image') ||
          key.toLowerCase().includes('frame') ||
          key.toLowerCase().includes('template')
        ) {
          sanitized[key] = value[key];
          continue;
        }
        sanitized[key] = this.sanitizeValue(value[key]);
      }
      return sanitized;
    }

    return value;
  }

  private sanitizeString(str: string): string {
    // Remove script tags and their content
    let sanitized = str.replace(this.scriptPattern, '');

    // Remove other HTML tags
    sanitized = sanitized.replace(this.htmlTagPattern, '');

    // Remove event handlers
    sanitized = sanitized.replace(this.onEventPattern, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Check for potential SQL injection (just log warning, don't modify)
    if (this.sqlInjectionPattern.test(sanitized)) {
      console.warn(
        'Potential SQL injection attempt detected:',
        sanitized.substring(0, 100),
      );
    }

    return sanitized;
  }
}

@Injectable()
export class FileNameSanitizePipe implements PipeTransform {
  private readonly dangerousChars = /[<>:"/\\|?*\x00-\x1f]/g;
  private readonly pathTraversal = /\.\./g;

  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value !== 'string') {
      return value;
    }

    return this.sanitizeFileName(value);
  }

  private sanitizeFileName(fileName: string): string {
    // Remove path traversal attempts
    let sanitized = fileName.replace(this.pathTraversal, '');

    // Remove dangerous characters
    sanitized = sanitized.replace(this.dangerousChars, '');

    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '');

    // Limit length
    if (sanitized.length > 255) {
      const ext = sanitized.split('.').pop() || '';
      sanitized = sanitized.substring(0, 255 - ext.length - 1) + '.' + ext;
    }

    if (!sanitized) {
      throw new BadRequestException('Invalid file name');
    }

    return sanitized;
  }
}

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  private readonly maxSize = 10 * 1024 * 1024; // 10MB

  transform(value: any, metadata: ArgumentMetadata) {
    if (!value) {
      return value;
    }

    // For file uploads
    if (value.mimetype) {
      this.validateMimeType(value.mimetype);
      this.validateSize(value.size);
    }

    // For base64 encoded images
    if (typeof value === 'string' && value.startsWith('data:image/')) {
      const mimeMatch = value.match(/data:(image\/[^;]+);/);
      if (mimeMatch) {
        this.validateMimeType(mimeMatch[1]);
      }
      // Estimate base64 size (roughly 4/3 of original)
      const estimatedSize = (value.length * 3) / 4;
      this.validateSize(estimatedSize);
    }

    return value;
  }

  private validateMimeType(mimeType: string): void {
    if (!this.allowedMimeTypes.includes(mimeType.toLowerCase())) {
      throw new BadRequestException(
        `Invalid image type. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }
  }

  private validateSize(size: number): void {
    if (size > this.maxSize) {
      throw new BadRequestException(
        `Image size exceeds maximum allowed size of ${this.maxSize / 1024 / 1024}MB`,
      );
    }
  }
}

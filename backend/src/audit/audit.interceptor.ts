import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { AUDIT_KEY, AuditMetadata } from './audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMetadata = this.reflector.get<AuditMetadata>(
      AUDIT_KEY,
      context.getHandler(),
    );

    // If no @Audit decorator, skip logging
    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ipAddress =
      request.ip ||
      request.headers['x-forwarded-for'] ||
      request.connection?.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap(async (response) => {
        // Log successful operation
        const resourceId = auditMetadata.getResourceId
          ? auditMetadata.getResourceId(request, response)
          : request.params?.id || response?.id;

        const details = auditMetadata.getDetails
          ? auditMetadata.getDetails(request, response)
          : this.extractDetails(request, auditMetadata.action);

        await this.auditService.log({
          userId: user?.sub || user?.id,
          userEmail: user?.email,
          userRole: user?.role,
          action: auditMetadata.action,
          resource: auditMetadata.resource,
          resourceId,
          details,
          ipAddress,
          userAgent,
          success: true,
        });
      }),
      catchError(async (error) => {
        // Log failed operation
        await this.auditService.log({
          userId: user?.sub || user?.id,
          userEmail: user?.email,
          userRole: user?.role,
          action: auditMetadata.action,
          resource: auditMetadata.resource,
          resourceId: request.params?.id,
          ipAddress,
          userAgent,
          success: false,
          errorMessage: error.message,
        });
        throw error;
      }),
    );
  }

  private extractDetails(
    request: any,
    action: string,
  ): Record<string, any> | undefined {
    // Don't log full body for sensitive operations or large payloads
    const sensitiveActions = ['LOGIN', 'PASSWORD_CHANGE', 'FACE_REGISTER'];
    if (sensitiveActions.includes(action)) {
      return undefined;
    }

    // For mutations, capture a summary of the changes
    if (['CREATE', 'UPDATE'].includes(action) && request.body) {
      const body = { ...request.body };
      // Remove sensitive fields
      delete body.password;
      delete body.passwordHash;
      delete body.faceTemplate;
      delete body.image;
      delete body.images;
      delete body.frameData;
      return Object.keys(body).length > 0 ? body : undefined;
    }

    return undefined;
  }
}

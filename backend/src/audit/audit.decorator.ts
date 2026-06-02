import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

export interface AuditMetadata {
  action: string;
  resource: string;
  getResourceId?: (request: any, response: any) => string | undefined;
  getDetails?: (request: any, response: any) => Record<string, any> | undefined;
}

/**
 * Decorator to mark a controller method for audit logging
 * @param action - The action being performed (CREATE, UPDATE, DELETE, etc.)
 * @param resource - The resource being acted upon (exam, question, student, etc.)
 * @param options - Optional functions to extract resourceId and details from request/response
 */
export const Audit = (
  action: string,
  resource: string,
  options?: {
    getResourceId?: (request: any, response: any) => string | undefined;
    getDetails?: (request: any, response: any) => Record<string, any> | undefined;
  },
) =>
  SetMetadata<string, AuditMetadata>(AUDIT_KEY, {
    action,
    resource,
    getResourceId: options?.getResourceId,
    getDetails: options?.getDetails,
  });

/**
 * Common audit decorators for CRUD operations
 */
export const AuditCreate = (resource: string) => Audit('CREATE', resource);
export const AuditUpdate = (resource: string) => Audit('UPDATE', resource);
export const AuditDelete = (resource: string) => Audit('DELETE', resource);
export const AuditView = (resource: string) => Audit('VIEW', resource);
export const AuditExport = (resource: string) => Audit('EXPORT', resource);

import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AuditService } from './audit.service';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  constructor(private readonly auditService: AuditService) {}

  use(req: RequestWithUser, res: Response, next: NextFunction): void {
    // Only log POST, PUT, PATCH requests
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
      return next();
    }

    const startTime = Date.now();
    let responseData: any;

    // Capture original send method
    const originalSend = res.send.bind(res);
    res.send = function (data: any) {
      responseData = data;
      return originalSend(data);
    };

    // Use the 'finish' event instead of overriding end method
    res.on('finish', async () => {
      const endTime = Date.now();
      const duration = endTime - startTime;

      try {
        // Extract action from URL and method
        const action = AuditMiddleware.extractAction(req.method, req.path);

        // Extract resource information
        const { resourceType, resourceId } =
          AuditMiddleware.extractResourceInfo(req.path);

        // Sanitize request data (remove sensitive information)
        const sanitizedRequestData = AuditMiddleware.sanitizeRequestData(
          req.body,
        );

        // Sanitize response data for successful operations
        const sanitizedResponseData =
          res.statusCode < 400
            ? AuditMiddleware.sanitizeResponseData(responseData)
            : undefined;

        await this.auditService.createAuditLog({
          userId: req.user?.id,
          action,
          resourceType,
          resourceId,
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.get('User-Agent'),
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          requestData: sanitizedRequestData,
          responseData: sanitizedResponseData,
          errorMessage: res.statusCode >= 400 ? responseData : undefined,
          durationMs: duration,
        });
      } catch (error) {
        console.error('Failed to create audit log:', error);
      }
    });

    next();
  }

  private static extractAction(method: string, path: string): string {
    // Remove API prefix and version
    const cleanPath = path.replace(/^\/api\/v?\d*\//, '');

    // Extract the main resource
    const segments = cleanPath.split('/').filter(Boolean);
    const resource = segments[0] || 'unknown';

    // Map HTTP methods to actions
    const actionMap: Record<string, string> = {
      GET: segments.length > 1 && segments[1] !== 'search' ? 'view' : 'list',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };

    const baseAction = actionMap[method.toUpperCase()] || method.toLowerCase();

    // Handle special endpoints
    if (cleanPath.includes('/search')) return `search_${resource}`;
    if (cleanPath.includes('/export')) return `export_${resource}`;
    if (cleanPath.includes('/import')) return `import_${resource}`;
    if (cleanPath.includes('/approve')) return `approve_${resource}`;
    if (cleanPath.includes('/reject')) return `reject_${resource}`;
    if (cleanPath.includes('/submit')) return `submit_${resource}`;
    if (cleanPath.includes('/review')) return `review_${resource}`;
    if (cleanPath.includes('/process')) return `process_${resource}`;

    return `${baseAction}_${resource}`;
  }

  private static extractResourceInfo(path: string): {
    resourceType?: string;
    resourceId?: string;
  } {
    const cleanPath = path.replace(/^\/api\/v?\d*\//, '');
    const segments = cleanPath.split('/').filter(Boolean);

    if (segments.length === 0) return {};

    const resourceType = segments[0];
    const resourceId =
      segments.length > 1 &&
      !['search', 'export', 'import'].includes(segments[1])
        ? segments[1]
        : undefined;

    return { resourceType, resourceId };
  }

  private static sanitizeRequestData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
    ];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private static sanitizeResponseData(data: any): any {
    if (!data) return undefined;

    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;

      // Only log basic response info for successful operations
      if (parsed && typeof parsed === 'object') {
        return {
          id: parsed.id,
          status: parsed.status,
          message: parsed.message,
          count: Array.isArray(parsed) ? parsed.length : undefined,
        };
      }

      return undefined;
    } catch {
      return undefined;
    }
  }
}

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';

interface ZodLikeIssue {
  path: (string | number)[];
  message: string;
}

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string;
  /** Present on 400s from request validation: one entry per bad field. */
  details?: { path: string; message: string }[];
  path: string;
  timestamp: string;
  /** Correlates the response with the server log line. */
  requestId?: string;
}

/**
 * One error shape for the whole API.
 *
 * Without this, a client saw three different bodies depending on where the
 * failure came from: Nest's `{ statusCode, message }`, nestjs-zod's
 * `{ statusCode, message, errors }`, and a bare 500 with no body for anything
 * a service threw as a plain Error. Callers - including the Academy
 * integration - need one contract.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const { status, message, error, details } = this.describe(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // Only unexpected failures carry a stack, and it goes to the log, never
      // to the client.
      this.logger.error(
        `${request.method} ${request.url} -> ${status}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ApiErrorBody = {
      statusCode: status,
      error,
      message,
      ...(details ? { details } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
      ...(request.id ? { requestId: request.id } : {}),
    };

    response.status(status).json(body);
  }

  private describe(exception: unknown): {
    status: number;
    error: string;
    message: string;
    details?: ApiErrorBody['details'];
  } {
    if (exception instanceof ZodValidationException) {
      return {
        status: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Request validation failed',
        details: (
          (exception.getZodError() as { issues?: ZodLikeIssue[] }).issues ?? []
        ).map((issue) => ({
          path: issue.path.join('.') || '(root)',
          message: issue.message,
        })),
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        return { status, error: exception.name, message: payload };
      }

      const record = payload as Record<string, unknown>;
      const rawMessage = record.message;

      return {
        status,
        error: typeof record.error === 'string' ? record.error : exception.name,
        message: Array.isArray(rawMessage)
          ? rawMessage.join('; ')
          : typeof rawMessage === 'string'
            ? rawMessage
            : exception.message,
      };
    }

    // Anything else is a bug. The client is told nothing about it.
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    };
  }
}

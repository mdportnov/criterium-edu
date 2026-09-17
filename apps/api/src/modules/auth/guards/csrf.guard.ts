import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';
import { CSRF_COOKIE, CSRF_HEADER, SESSION_COOKIE } from '../session-cookie';
import { SKIP_CSRF_KEY } from '../decorators/skip-csrf.decorator';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Double-submit CSRF check.
 *
 * Only requests authenticated by the session cookie are checked: a cookie is
 * ambient authority the browser attaches on its own. A request carrying an
 * Authorization header is not - the caller had to know the token - so service
 * clients are unaffected.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') {
      return true;
    }

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method)) {
      return true;
    }

    const cookies = (request.cookies ?? {}) as Record<string, string>;
    const sessionCookie = cookies[SESSION_COOKIE];
    if (!sessionCookie) {
      return true;
    }

    const expected = cookies[CSRF_COOKIE];
    const provided = request.headers[CSRF_HEADER];

    if (
      !expected ||
      typeof provided !== 'string' ||
      !constantTimeEquals(expected, provided)
    ) {
      throw new ForbiddenException('CSRF token missing or invalid');
    }

    return true;
  }
}

function constantTimeEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

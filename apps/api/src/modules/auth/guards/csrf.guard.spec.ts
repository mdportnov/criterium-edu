import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { CsrfGuard } from './csrf.guard';
import { CSRF_COOKIE, CSRF_HEADER, SESSION_COOKIE } from '../session-cookie';

const context = (request: Record<string, unknown>): ExecutionContext =>
  ({
    getType: () => 'http',
    getHandler: () => vi.fn(),
    getClass: () => vi.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

const guard = (skip = false) =>
  new CsrfGuard({
    getAllAndOverride: () => skip,
  } as unknown as Reflector);

const withCookieSession = (overrides: Record<string, unknown> = {}) => ({
  method: 'POST',
  cookies: { [SESSION_COOKIE]: 'jwt', [CSRF_COOKIE]: 'csrf-value' },
  headers: { [CSRF_HEADER]: 'csrf-value' },
  ...overrides,
});

describe('CsrfGuard', () => {
  it('allows a cookie-authenticated write with a matching token', () => {
    expect(guard().canActivate(context(withCookieSession()))).toBe(true);
  });

  it('rejects a cookie-authenticated write with no token header', () => {
    expect(() =>
      guard().canActivate(context(withCookieSession({ headers: {} }))),
    ).toThrow(ForbiddenException);
  });

  it('rejects a mismatched token', () => {
    expect(() =>
      guard().canActivate(
        context(withCookieSession({ headers: { [CSRF_HEADER]: 'wrong' } })),
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejects when the CSRF cookie is missing', () => {
    expect(() =>
      guard().canActivate(
        context(withCookieSession({ cookies: { [SESSION_COOKIE]: 'jwt' } })),
      ),
    ).toThrow(ForbiddenException);
  });

  it.each(['GET', 'HEAD', 'OPTIONS'])('allows %s without a token', (method) => {
    expect(
      guard().canActivate(context(withCookieSession({ method, headers: {} }))),
    ).toBe(true);
  });

  // A bearer token is not ambient authority: the caller had to know it, so
  // there is nothing for a cross-site request to ride on.
  it('ignores requests that are not authenticated by cookie', () => {
    expect(
      guard().canActivate(
        context({
          method: 'POST',
          cookies: {},
          headers: { authorization: 'Bearer token' },
        }),
      ),
    ).toBe(true);
  });

  it('skips endpoints marked SkipCsrf, which have no session yet', () => {
    expect(
      guard(true).canActivate(context(withCookieSession({ headers: {} }))),
    ).toBe(true);
  });
});

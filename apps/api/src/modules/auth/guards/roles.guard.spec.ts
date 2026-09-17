import { describe, expect, it, vi } from 'vitest';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { UserRole } from '@app/shared';
import { RolesGuard } from './roles.guard';

const contextWith = (user: unknown): ExecutionContext =>
  ({
    getHandler: () => vi.fn(),
    getClass: () => vi.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

const guardFor = (requiredRoles: UserRole[] | undefined) =>
  new RolesGuard({
    getAllAndOverride: () => requiredRoles,
  } as unknown as Reflector);

describe('RolesGuard', () => {
  it('allows a handler that declares no roles', () => {
    expect(guardFor(undefined).canActivate(contextWith(undefined))).toBe(true);
  });

  it('allows a handler whose role list is empty', () => {
    expect(guardFor([]).canActivate(contextWith(undefined))).toBe(true);
  });

  // The previous implementation read .role off undefined here.
  it('denies when the request carries no user', () => {
    expect(guardFor([UserRole.ADMIN]).canActivate(contextWith(undefined))).toBe(
      false,
    );
  });

  it('denies a user object with no role', () => {
    expect(
      guardFor([UserRole.ADMIN]).canActivate(contextWith({ id: 'u1' })),
    ).toBe(false);
  });

  it('denies the wrong role', () => {
    expect(
      guardFor([UserRole.ADMIN]).canActivate(
        contextWith({ id: 'u1', role: UserRole.STUDENT }),
      ),
    ).toBe(false);
  });

  it('allows a matching role', () => {
    expect(
      guardFor([UserRole.ADMIN, UserRole.REVIEWER]).canActivate(
        contextWith({ id: 'u1', role: UserRole.REVIEWER }),
      ),
    ).toBe(true);
  });
});

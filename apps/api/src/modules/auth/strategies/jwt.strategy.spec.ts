import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { UserRole } from '@app/shared';
import { JwtStrategy } from './jwt.strategy';
import type { UsersService } from '../../users/users.service';

const configService = {
  getOrThrow: () => 'a'.repeat(48),
} as unknown as ConfigService;

const storedUser = {
  id: 'user-1',
  email: 'student@example.com',
  firstName: 'A',
  lastName: 'B',
  role: UserRole.STUDENT,
  password: '$2b$12$hash.that.must.never.leave.the.database',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('JwtStrategy.validate', () => {
  let usersService: UsersService;

  beforeEach(() => {
    usersService = {
      findOne: vi.fn().mockResolvedValue(storedUser),
    } as unknown as UsersService;
  });

  it('resolves the user named by the sub claim', async () => {
    const strategy = new JwtStrategy(configService, usersService);

    const user = await strategy.validate({
      sub: 'user-1',
      email: 'student@example.com',
      role: UserRole.STUDENT,
    });

    expect(usersService.findOne).toHaveBeenCalledWith('user-1');
    expect(user.id).toBe('user-1');
  });

  // request.user is serialised by several controllers, so the hash must be
  // gone before it gets there.
  it('strips the password hash', async () => {
    const strategy = new JwtStrategy(configService, usersService);

    const user = await strategy.validate({
      sub: 'user-1',
      email: 'student@example.com',
      role: UserRole.STUDENT,
    });

    expect(user).not.toHaveProperty('password');
    expect(JSON.stringify(user)).not.toContain('$2b$');
  });

  it('carries the impersonation marker through', async () => {
    const strategy = new JwtStrategy(configService, usersService);

    const user = await strategy.validate({
      sub: 'user-1',
      email: 'student@example.com',
      role: UserRole.STUDENT,
      impersonatedBy: 'admin-9',
    });

    expect(user.impersonatedBy).toBe('admin-9');
  });

  it('rejects a token whose subject no longer exists', async () => {
    usersService = {
      findOne: vi.fn().mockResolvedValue(null),
    } as unknown as UsersService;
    const strategy = new JwtStrategy(configService, usersService);

    await expect(
      strategy.validate({
        sub: 'gone',
        email: 'gone@example.com',
        role: UserRole.STUDENT,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

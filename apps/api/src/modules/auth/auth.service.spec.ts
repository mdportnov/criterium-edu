import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@app/shared';
import { AuthService } from './auth.service';
import type { UsersService } from '../users/users.service';
import type { SettingsService } from '../settings/settings.service';

const logger = { log: vi.fn(), warn: vi.fn(), error: vi.fn() } as never;
const jwtService = {
  sign: vi.fn(() => 'signed.jwt.token'),
} as unknown as JwtService;

const makeUser = async (password: string) => ({
  id: 'user-1',
  email: 'student@example.com',
  firstName: 'A',
  lastName: 'B',
  role: UserRole.STUDENT,
  password: await bcrypt.hash(password, 10),
});

describe('AuthService', () => {
  let usersService: UsersService;
  let settingsService: SettingsService;

  beforeEach(() => {
    vi.clearAllMocks();
    usersService = {
      findByEmail: vi.fn(),
      findByEmailWithPassword: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
    } as unknown as UsersService;
    settingsService = {
      isRegistrationEnabled: vi.fn().mockResolvedValue(true),
    } as unknown as SettingsService;
  });

  const service = () =>
    new AuthService(usersService, jwtService, settingsService, logger);

  describe('login', () => {
    // The hash is select:false on the entity, so login has to ask for it by
    // name; using the ordinary lookup would compare against undefined.
    it('loads the user through the password-bearing lookup', async () => {
      vi.mocked(usersService.findByEmailWithPassword).mockResolvedValue(
        (await makeUser('Correct-horse-1')) as never,
      );

      await service().login({
        email: 'student@example.com',
        password: 'Correct-horse-1',
      } as never);

      expect(usersService.findByEmailWithPassword).toHaveBeenCalledWith(
        'student@example.com',
      );
      expect(usersService.findByEmail).not.toHaveBeenCalled();
    });

    it('issues a token for correct credentials', async () => {
      vi.mocked(usersService.findByEmailWithPassword).mockResolvedValue(
        (await makeUser('Correct-horse-1')) as never,
      );

      const result = await service().login({
        email: 'student@example.com',
        password: 'Correct-horse-1',
      } as never);

      expect(result.token).toBe('signed.jwt.token');
      expect(result.user).toMatchObject({
        id: 'user-1',
        email: 'student@example.com',
        role: UserRole.STUDENT,
      });
      expect(vi.mocked(jwtService.sign).mock.calls[0][0]).toMatchObject({
        sub: 'user-1',
        role: UserRole.STUDENT,
      });
    });

    it('returns a fresh CSRF token with every session', async () => {
      vi.mocked(usersService.findByEmailWithPassword).mockResolvedValue(
        (await makeUser('Correct-horse-1')) as never,
      );
      const auth = service();

      const first = await auth.login({
        email: 'student@example.com',
        password: 'Correct-horse-1',
      } as never);
      const second = await auth.login({
        email: 'student@example.com',
        password: 'Correct-horse-1',
      } as never);

      expect(first.csrfToken).toHaveLength(32);
      expect(first.csrfToken).not.toBe(second.csrfToken);
    });

    // The token goes into an httpOnly cookie; the body the browser can read
    // must not contain it.
    it('returns a user profile with no token and no password', async () => {
      vi.mocked(usersService.findByEmailWithPassword).mockResolvedValue(
        (await makeUser('Correct-horse-1')) as never,
      );

      const result = await service().login({
        email: 'student@example.com',
        password: 'Correct-horse-1',
      } as never);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('access_token');
      expect(JSON.stringify(result.user)).not.toContain('signed.jwt.token');
    });

    it('never puts the password hash into the token payload', async () => {
      vi.mocked(usersService.findByEmailWithPassword).mockResolvedValue(
        (await makeUser('Correct-horse-1')) as never,
      );

      await service().login({
        email: 'student@example.com',
        password: 'Correct-horse-1',
      } as never);

      expect(vi.mocked(jwtService.sign).mock.calls[0][0]).not.toHaveProperty(
        'password',
      );
    });

    it('rejects a wrong password', async () => {
      vi.mocked(usersService.findByEmailWithPassword).mockResolvedValue(
        (await makeUser('Correct-horse-1')) as never,
      );

      await expect(
        service().login({
          email: 'student@example.com',
          password: 'wrong',
        } as never),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    // Same message either way, so the endpoint does not enumerate accounts.
    it('rejects an unknown email with the same message as a wrong password', async () => {
      vi.mocked(usersService.findByEmailWithPassword).mockResolvedValue(
        null as never,
      );

      await expect(
        service().login({
          email: 'nobody@example.com',
          password: 'x',
        } as never),
      ).rejects.toThrowError('Invalid credentials');
    });
  });

  describe('register', () => {
    it('refuses when registration is switched off', async () => {
      vi.mocked(settingsService.isRegistrationEnabled).mockResolvedValue(false);

      await expect(
        service().register({
          email: 'new@example.com',
          firstName: 'N',
          lastName: 'U',
          password: 'Correct-horse-1',
        } as never),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('always creates a student, whatever the payload asks for', async () => {
      vi.mocked(usersService.findByEmail).mockResolvedValue(null as never);
      vi.mocked(usersService.create).mockResolvedValue({
        id: 'user-2',
        email: 'new@example.com',
        firstName: 'N',
        lastName: 'U',
        role: UserRole.STUDENT,
      } as never);

      await service().register({
        email: 'new@example.com',
        firstName: 'N',
        lastName: 'U',
        password: 'Correct-horse-1',
        role: UserRole.ADMIN,
      } as never);

      expect(vi.mocked(usersService.create).mock.calls[0][0].role).toBe(
        UserRole.STUDENT,
      );
    });

    it('refuses an email that is already taken', async () => {
      vi.mocked(usersService.findByEmail).mockResolvedValue({
        id: 'user-1',
      } as never);

      await expect(
        service().register({
          email: 'student@example.com',
          firstName: 'N',
          lastName: 'U',
          password: 'Correct-horse-1',
        } as never),
      ).rejects.toThrowError('Email already exists');
    });
  });

  describe('loginAs', () => {
    it('marks the token as an impersonation', async () => {
      vi.mocked(usersService.findOne).mockResolvedValue({
        id: 'user-1',
        email: 'student@example.com',
        firstName: 'A',
        lastName: 'B',
        role: UserRole.STUDENT,
      } as never);

      await service().loginAs('user-1', 'admin-9');

      expect(vi.mocked(jwtService.sign).mock.calls[0][0]).toMatchObject({
        sub: 'user-1',
        impersonatedBy: 'admin-9',
      });
    });
  });
});

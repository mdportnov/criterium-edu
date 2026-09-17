import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { PasswordResetService } from './password-reset.service';
import type { PasswordResetToken } from './entities/password-reset-token.entity';
import type { UsersService } from '../users/users.service';

const logger = { log: vi.fn(), warn: vi.fn(), error: vi.fn() } as never;
const configService = {
  getOrThrow: () => 'https://criterium.example/',
} as unknown as ConfigService;

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

describe('PasswordResetService', () => {
  let rows: PasswordResetToken[];
  let usersService: UsersService;
  let repository: Repository<PasswordResetToken>;

  const service = () =>
    new PasswordResetService(repository, usersService, configService, logger);

  beforeEach(() => {
    vi.clearAllMocks();
    rows = [];
    usersService = {
      findOne: vi.fn().mockResolvedValue({ id: 'user-1' }),
      update: vi.fn().mockResolvedValue({ id: 'user-1' }),
    } as unknown as UsersService;
    repository = {
      create: vi.fn((input) => input),
      save: vi.fn(async (row) => {
        const existing = rows.find((r) => r.tokenHash === row.tokenHash);
        if (existing) {
          Object.assign(existing, row);
          return existing;
        }
        rows.push(row);
        return row;
      }),
      findOne: vi.fn(
        async ({ where }: { where: { tokenHash: string } }) =>
          rows.find((row) => row.tokenHash === where.tokenHash) ?? null,
      ),
      delete: vi.fn(async (criteria: Record<string, unknown>) => {
        const before = rows.length;
        if ('userId' in criteria) {
          rows = rows.filter(
            (row) => row.userId !== criteria.userId || row.usedAt,
          );
        }
        return { affected: before - rows.length };
      }),
    } as unknown as Repository<PasswordResetToken>;
  });

  const tokenFromUrl = (url: string) => new URL(url).searchParams.get('token')!;

  it('returns a link on the configured base URL', async () => {
    const { url, expiresAt } = await service().issueFor('user-1', 'admin-1');

    expect(
      url.startsWith('https://criterium.example/set-password?token='),
    ).toBe(true);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  // The link is the credential; only its hash may be persisted.
  it('stores only a hash of the token', async () => {
    const { url } = await service().issueFor('user-1', 'admin-1');
    const token = tokenFromUrl(url);

    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).toBe(sha256(token));
    expect(JSON.stringify(rows[0])).not.toContain(token);
  });

  it('sets the password when the token is redeemed', async () => {
    const { url } = await service().issueFor('user-1', 'admin-1');

    await service().redeem(tokenFromUrl(url), 'Brand-new-password-1');

    expect(usersService.update).toHaveBeenCalledWith('user-1', {
      password: 'Brand-new-password-1',
    });
  });

  it('refuses a token that has already been used', async () => {
    const auth = service();
    const { url } = await auth.issueFor('user-1', 'admin-1');
    const token = tokenFromUrl(url);

    await auth.redeem(token, 'Brand-new-password-1');

    await expect(
      auth.redeem(token, 'Another-password-2'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses an expired token', async () => {
    const auth = service();
    const { url } = await auth.issueFor('user-1', 'admin-1');
    rows[0].expiresAt = new Date(Date.now() - 1000);

    await expect(
      auth.redeem(tokenFromUrl(url), 'Brand-new-password-1'),
    ).rejects.toThrow(/invalid or has expired/);
  });

  it('refuses an invented token', async () => {
    await expect(
      service().redeem('not-a-real-token', 'Brand-new-password-1'),
    ).rejects.toThrow(/invalid or has expired/);
  });

  // Issuing a new link must retire the previous one.
  it('invalidates an outstanding link when a new one is issued', async () => {
    const auth = service();
    const first = tokenFromUrl((await auth.issueFor('user-1', 'admin-1')).url);
    const second = tokenFromUrl((await auth.issueFor('user-1', 'admin-1')).url);

    await expect(
      auth.redeem(first, 'Brand-new-password-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      auth.redeem(second, 'Brand-new-password-1'),
    ).resolves.toBeUndefined();
  });

  it('reports a deleted user with the same message as a bad token', async () => {
    const auth = service();
    const { url } = await auth.issueFor('user-1', 'admin-1');
    vi.mocked(usersService.update).mockRejectedValue(new NotFoundException());

    await expect(
      auth.redeem(tokenFromUrl(url), 'Brand-new-password-1'),
    ).rejects.toThrow(/invalid or has expired/);
  });
});

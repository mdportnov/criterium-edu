import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import type { User } from './entities/user.entity';

const logger = { log: vi.fn(), warn: vi.fn(), error: vi.fn() } as never;
const configService = {
  getOrThrow: vi.fn(() => 10),
} as unknown as ConfigService;

describe('UsersService', () => {
  let repository: Repository<User>;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = {
      findOneBy: vi.fn(),
      findAndCount: vi.fn(),
      create: vi.fn((input) => input),
      save: vi.fn((input) => ({ id: 'user-1', ...input })),
      merge: vi.fn((target, source) => Object.assign(target, source)),
      remove: vi.fn(),
    } as unknown as Repository<User>;
  });

  const service = () => new UsersService(repository, configService, logger);

  it('stores a bcrypt hash, never the plaintext password', async () => {
    const saved = await service().create({
      email: 'new@example.com',
      firstName: 'N',
      lastName: 'U',
      password: 'Correct-horse-1',
    } as never);

    expect(saved.password).not.toBe('Correct-horse-1');
    expect(saved.password).toMatch(/^\$2[aby]\$/);
    await expect(
      bcrypt.compare('Correct-horse-1', saved.password),
    ).resolves.toBe(true);
  });

  it('hashes with the configured cost factor', async () => {
    await service().create({
      email: 'new@example.com',
      firstName: 'N',
      lastName: 'U',
      password: 'Correct-horse-1',
    } as never);

    expect(configService.getOrThrow).toHaveBeenCalledWith(
      'security.bcryptRounds',
    );
  });

  it('hashes a password supplied on update', async () => {
    vi.mocked(repository.findOneBy).mockResolvedValue({
      id: 'user-1',
      password: 'old-hash',
    } as never);

    const updated = await service().update('user-1', {
      password: 'New-horse-2',
    } as never);

    expect(updated.password).not.toBe('New-horse-2');
    await expect(bcrypt.compare('New-horse-2', updated.password)).resolves.toBe(
      true,
    );
  });

  it('leaves the stored hash alone when the update has no password', async () => {
    vi.mocked(repository.findOneBy).mockResolvedValue({
      id: 'user-1',
      password: 'old-hash',
    } as never);

    const updated = await service().update('user-1', {
      firstName: 'Renamed',
    } as never);

    expect(updated.password).toBe('old-hash');
  });

  it('raises NotFound for an unknown id', async () => {
    vi.mocked(repository.findOneBy).mockResolvedValue(null);

    await expect(service().findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('reports the right page count', async () => {
    vi.mocked(repository.findAndCount).mockResolvedValue([[], 42] as never);

    const page = await service().findAll({ page: 2, size: 10 } as never);

    expect(page).toMatchObject({ total: 42, page: 2, size: 10, totalPages: 5 });
    expect(vi.mocked(repository.findAndCount).mock.calls[0][0]).toMatchObject({
      skip: 10,
      take: 10,
    });
  });
});

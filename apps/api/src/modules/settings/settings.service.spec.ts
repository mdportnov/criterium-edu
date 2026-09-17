import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';
import { SecretCipherService } from '../../common/crypto/secret-cipher.service';
import { SECRET_PLACEHOLDER, SettingsService } from './settings.service';
import type { AppSetting } from './entities/app-setting.entity';

const cipher = new SecretCipherService({
  getOrThrow: () =>
    '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
} as unknown as ConfigService);

const API_KEY = 'sk-proj-abcdefghijklmnopqrstuvwxyz0123456789';

describe('SettingsService', () => {
  let rows: Record<string, string>;
  let repository: Repository<AppSetting>;

  const service = () => new SettingsService(repository, cipher);

  beforeEach(() => {
    rows = {
      registration_enabled: 'true',
      openai_default_model: 'gpt-4o',
      openai_api_key: cipher.encrypt(API_KEY),
    };
    repository = {
      findOne: vi.fn(async ({ where: { key } }: { where: { key: string } }) =>
        rows[key] === undefined ? null : { key, value: rows[key] },
      ),
      find: vi.fn(async () =>
        Object.entries(rows).map(([key, value]) => ({ key, value })),
      ),
      upsert: vi.fn(async (entries: { key: string; value: string }[]) => {
        for (const entry of entries) {
          rows[entry.key] = entry.value;
        }
      }),
    } as unknown as Repository<AppSetting>;
  });

  it('decrypts a secret for server-side use', async () => {
    await expect(service().getOpenAIApiKey()).resolves.toBe(API_KEY);
  });

  it('stores a new secret encrypted, never in the clear', async () => {
    await service().updateSettings({
      openai_api_key: 'sk-brand-new-value-1234',
    });

    expect(rows.openai_api_key).not.toContain('sk-brand-new-value-1234');
    expect(cipher.isEncrypted(rows.openai_api_key)).toBe(true);
    await expect(service().getOpenAIApiKey()).resolves.toBe(
      'sk-brand-new-value-1234',
    );
  });

  // This is what the admin settings screen returns; a usable credential must
  // not be in it.
  it('masks secrets in the listing and leaves other settings alone', async () => {
    const settings = await service().getSettings();

    expect(settings.openai_api_key).not.toBe(API_KEY);
    expect(settings.openai_api_key).toContain('••••');
    expect(settings.registration_enabled).toBe('true');
    expect(settings.openai_default_model).toBe('gpt-4o');
  });

  it('keeps the stored secret when the form posts the mask back', async () => {
    const masked = (await service().getSettings()).openai_api_key;

    await service().updateSettings({
      openai_api_key: masked,
      openai_default_model: 'gpt-4o-mini',
    });

    await expect(service().getOpenAIApiKey()).resolves.toBe(API_KEY);
    expect(rows.openai_default_model).toBe('gpt-4o-mini');
  });

  it('keeps the stored secret when the field is submitted empty', async () => {
    await service().updateSettings({ openai_api_key: '' });
    await expect(service().getOpenAIApiKey()).resolves.toBe(API_KEY);

    await service().updateSettings({ openai_api_key: SECRET_PLACEHOLDER });
    await expect(service().getOpenAIApiKey()).resolves.toBe(API_KEY);
  });

  it('re-encrypts a value left in plaintext by an older release', async () => {
    rows.openai_api_key = API_KEY;

    await expect(service().getOpenAIApiKey()).resolves.toBe(API_KEY);

    await service().updateSettings({ openai_api_key: 'sk-rotated-9876543210' });
    expect(cipher.isEncrypted(rows.openai_api_key)).toBe(true);
  });

  it('reads registration as a boolean', async () => {
    await expect(service().isRegistrationEnabled()).resolves.toBe(true);
    rows.registration_enabled = 'false';
    await expect(service().isRegistrationEnabled()).resolves.toBe(false);
  });

  it('falls back to a default model when none is configured', async () => {
    delete rows.openai_default_model;
    await expect(service().getOpenAIDefaultModel()).resolves.toBe('gpt-4o');
  });
});

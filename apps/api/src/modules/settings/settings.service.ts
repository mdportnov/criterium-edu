import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSetting } from './entities/app-setting.entity';
import { SecretCipherService } from '../../common/crypto/secret-cipher.service';

/**
 * Settings whose value is a credential. These are encrypted at rest and never
 * returned in full over the API - the admin UI gets a mask.
 */
export const SECRET_SETTING_KEYS = new Set(['llm_api_key']);

/** Renamed when the OpenAI client became a provider-agnostic one. */
const LEGACY_KEYS: Record<string, string> = {
  llm_api_key: 'openai_api_key',
  llm_model: 'openai_default_model',
};

/** What the API returns in place of a stored secret. */
export const SECRET_PLACEHOLDER = '••••••••';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AppSetting)
    private readonly settingsRepository: Repository<AppSetting>,
    private readonly cipher: SecretCipherService,
  ) {}

  /** The real value, decrypted. For server-side use only. */
  async getSetting(key: string): Promise<string | null> {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    if (!setting?.value) {
      return null;
    }

    return SECRET_SETTING_KEYS.has(key) || isLegacySecret(key)
      ? this.cipher.decrypt(setting.value)
      : setting.value;
  }

  /**
   * Everything, with secrets masked. This feeds the admin settings screen, so
   * it must never carry a usable credential.
   */
  async getSettings(): Promise<Record<string, string>> {
    const settings = await this.settingsRepository.find();

    return settings.reduce<Record<string, string>>((acc, setting) => {
      if (
        !SECRET_SETTING_KEYS.has(setting.key) &&
        !isLegacySecret(setting.key)
      ) {
        acc[setting.key] = setting.value;
        return acc;
      }

      acc[setting.key] = setting.value
        ? this.cipher.mask(this.cipher.decrypt(setting.value))
        : '';
      return acc;
    }, {});
  }

  async updateSetting(key: string, value: string): Promise<void> {
    await this.updateSettings({ [key]: value });
  }

  async updateSettings(settings: Record<string, string>): Promise<void> {
    const rows: AppSetting[] = [];

    for (const [key, value] of Object.entries(settings)) {
      if (!SECRET_SETTING_KEYS.has(key)) {
        rows.push({ key, value } as AppSetting);
        continue;
      }

      // The UI renders a mask, so a form submitted without touching the field
      // sends the mask back. Saving it would destroy the credential.
      if (await this.isUnchangedSecret(key, value)) {
        continue;
      }

      rows.push({ key, value: this.cipher.encrypt(value) } as AppSetting);
    }

    if (rows.length === 0) {
      return;
    }

    await this.settingsRepository.upsert(rows, { conflictPaths: ['key'] });
  }

  async isRegistrationEnabled(): Promise<boolean> {
    return (await this.getSetting('registration_enabled')) === 'true';
  }

  /**
   * Reads a setting, falling back to the name it had before the rename. A
   * deployment that has not saved its settings since is still configured.
   */
  private async getSettingWithLegacy(key: string): Promise<string | null> {
    const value = await this.getSetting(key);
    if (value) {
      return value;
    }

    const legacy = LEGACY_KEYS[key];
    return legacy ? this.getSetting(legacy) : null;
  }

  async getLlmProvider(): Promise<string | null> {
    return this.getSetting('llm_provider');
  }

  async getLlmApiKey(): Promise<string | null> {
    return this.getSettingWithLegacy('llm_api_key');
  }

  async getLlmBaseUrl(): Promise<string | null> {
    return this.getSetting('llm_base_url');
  }

  async getLlmModel(): Promise<string | null> {
    return this.getSettingWithLegacy('llm_model');
  }

  /**
   * Per-model prices, as USD per million tokens, for providers whose list we
   * cannot ship - OpenRouter fronts hundreds of models at prices that move.
   * Shape: {"deepseek/deepseek-chat": {"prompt": 0.27, "completion": 1.1}}
   */
  async getLlmPricing(): Promise<
    Record<string, { prompt: number; completion: number }>
  > {
    const raw = await this.getSetting('llm_pricing');
    if (!raw) {
      return {};
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null
        ? (parsed as Record<string, { prompt: number; completion: number }>)
        : {};
    } catch {
      // A malformed override must not stop an assessment; it costs the report
      // its numbers, not the run.
      return {};
    }
  }

  private async isUnchangedSecret(
    key: string,
    submitted: string,
  ): Promise<boolean> {
    if (submitted === '' || submitted === SECRET_PLACEHOLDER) {
      return true;
    }

    const current = await this.getSetting(key);
    if (!current) {
      return false;
    }

    return (
      this.cipher.matches(submitted, this.cipher.mask(current)) ||
      this.cipher.matches(submitted, current)
    );
  }
}

const LEGACY_SECRET_KEYS = new Set(
  Object.values(LEGACY_KEYS).filter((key) =>
    SECRET_SETTING_KEYS.has(
      Object.keys(LEGACY_KEYS).find(
        (current) => LEGACY_KEYS[current] === key,
      ) ?? '',
    ),
  ),
);

function isLegacySecret(key: string): boolean {
  return LEGACY_SECRET_KEYS.has(key);
}

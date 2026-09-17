import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSetting } from './entities/app-setting.entity';
import { SecretCipherService } from '../../common/crypto/secret-cipher.service';

/**
 * Settings whose value is a credential. These are encrypted at rest and never
 * returned in full over the API - the admin UI gets a mask.
 */
export const SECRET_SETTING_KEYS = new Set(['openai_api_key']);

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

    return SECRET_SETTING_KEYS.has(key)
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
      if (!SECRET_SETTING_KEYS.has(setting.key)) {
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

  async getOpenAIApiKey(): Promise<string | null> {
    return this.getSetting('openai_api_key');
  }

  async getOpenAIDefaultModel(): Promise<string> {
    return (await this.getSetting('openai_default_model')) || 'gpt-4o';
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

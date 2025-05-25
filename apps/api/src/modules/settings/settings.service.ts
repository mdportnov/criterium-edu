import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSetting } from './entities/app-setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AppSetting)
    private readonly settingsRepository: Repository<AppSetting>,
  ) {}

  async getSetting(key: string): Promise<string | null> {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    return setting?.value || null;
  }

  async getSettings(): Promise<Record<string, string>> {
    const settings = await this.settingsRepository.find();
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
  }

  async updateSetting(key: string, value: string): Promise<void> {
    await this.settingsRepository.upsert(
      { key, value },
      { conflictPaths: ['key'] },
    );
  }

  async updateSettings(settings: Record<string, string>): Promise<void> {
    const settingsToUpdate = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
    }));

    await this.settingsRepository.upsert(settingsToUpdate, {
      conflictPaths: ['key'],
    });
  }

  async isRegistrationEnabled(): Promise<boolean> {
    const value = await this.getSetting('registration_enabled');
    return value === 'true';
  }

  async getOpenAIApiKey(): Promise<string | null> {
    return this.getSetting('openai_api_key');
  }
}

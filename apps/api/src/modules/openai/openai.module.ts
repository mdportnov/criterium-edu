import { Module } from '@nestjs/common';
import { OpenaiApiService } from './services/openai.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  providers: [OpenaiApiService],
  exports: [OpenaiApiService],
})
export class OpenaiModule {}

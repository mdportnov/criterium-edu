import { Module } from '@nestjs/common';
import { OpenaiApiService } from './services/openai.service';
import { SettingsModule } from '../settings/settings.module';
import { PromptsModule } from '../prompts/prompts.module';

@Module({
  imports: [SettingsModule, PromptsModule],
  providers: [OpenaiApiService],
  exports: [OpenaiApiService],
})
export class OpenaiModule {}

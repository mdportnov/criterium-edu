import { Module } from '@nestjs/common';
import { OpenAIService } from './services/openai.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class SharedModule {}

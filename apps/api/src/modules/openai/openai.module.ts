import { Module } from '@nestjs/common';
import { OpenaiApiService } from './services/openai.service';
import { SettingsModule } from '../settings/settings.module';
import { PromptsModule } from '../prompts/prompts.module';
import { CostTrackingModule } from '../cost-tracking/cost-tracking.module';

@Module({
  imports: [SettingsModule, PromptsModule, CostTrackingModule],
  providers: [OpenaiApiService],
  exports: [OpenaiApiService],
})
export class OpenaiModule {}

import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { SettingsModule } from '../settings/settings.module';
import { PromptsModule } from '../prompts/prompts.module';
import { CostTrackingModule } from '../cost-tracking/cost-tracking.module';

@Module({
  imports: [SettingsModule, PromptsModule, CostTrackingModule],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}

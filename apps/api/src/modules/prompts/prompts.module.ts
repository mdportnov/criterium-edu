import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromptsController } from './prompts.controller';
import { PromptsService } from './prompts.service';
import { Prompt } from './entities/prompt.entity';
import { PromptTranslation } from './entities/prompt-translation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Prompt, PromptTranslation])],
  controllers: [PromptsController],
  providers: [PromptsService],
  exports: [PromptsService],
})
export class PromptsModule {}
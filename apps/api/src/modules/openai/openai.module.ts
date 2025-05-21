import { Module } from '@nestjs/common';
import { OpenaiApiService } from './services/openai.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [OpenaiApiService],
  exports: [OpenaiApiService],
})
export class OpenaiModule {}

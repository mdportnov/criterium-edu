import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostTrackingService } from './cost-tracking.service';
import { CostTrackingController } from './cost-tracking.controller';
import { ApiUsage } from './entities/api-usage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApiUsage])],
  providers: [CostTrackingService],
  controllers: [CostTrackingController],
  exports: [CostTrackingService],
})
export class CostTrackingModule {}
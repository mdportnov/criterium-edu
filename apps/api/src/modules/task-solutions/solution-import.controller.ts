import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@app/shared';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { SolutionImportService } from './solution-import.service';
import { BatchImportSolutionsDto } from './entities/solution-import.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('solution-import')
@Controller('solution-import')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SolutionImportController {
  constructor(private readonly importService: SolutionImportService) {}

  @Post('batch')
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  async importBatch(@Body() dto: BatchImportSolutionsDto) {
    return this.importService.importBatch(dto);
  }

  @Get('sources')
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  async getSources() {
    return this.importService.getSources();
  }

  @Get('sources/:id')
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  async getSource(@Param('id') id: number) {
    return this.importService.getSource(id);
  }
}
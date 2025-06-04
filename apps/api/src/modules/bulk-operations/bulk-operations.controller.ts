import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { BulkOperationsService } from './bulk-operations.service';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import {
  BulkImportSolutionDto,
  BulkImportTaskDto,
  PaginatedResponse,
  PaginationDto,
} from '@app/shared/dto';
import { CurrentUser, UserRole } from '@app/shared/interfaces';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetCurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Bulk Operations')
@Controller('bulk-operations')
export class BulkOperationsController {
  constructor(private readonly bulkOperationsService: BulkOperationsService) {}

  // Endpoint for JSON Task Import
  @Post('tasks/import/json')
  @ApiOperation({ summary: 'Import tasks from a JSON file' })
  @ApiConsumes('application/json')
  @ApiBody({
    description: 'JSON array of tasks to import',
    type: [BulkImportTaskDto],
  })
  @ApiResponse({ status: 201, description: 'Tasks imported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid JSON data' })
  async importTasksJson(
    @Body() tasksData: BulkImportTaskDto[],
    @GetCurrentUser() user: CurrentUser,
  ) {
    return this.bulkOperationsService.importTasksJson(tasksData, user.id);
  }

  // Endpoint for JSON Task Export
  @Get('tasks/export/json')
  @ApiOperation({ summary: 'Export all tasks to a JSON file' })
  @ApiResponse({
    status: 200,
    description: 'JSON file of all tasks',
    content: {
      'application/json': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async exportTasksJson(@Res() res: Response) {
    const tasksJson = await this.bulkOperationsService.exportTasksJson();
    res.header('Content-Type', 'application/json');
    res.header('Content-Disposition', 'attachment; filename=tasks.json');
    res.send(tasksJson);
  }

  @Post('solutions/import/json')
  @ApiOperation({ summary: 'Import solutions from a JSON file' })
  @ApiConsumes('application/json')
  @ApiBody({
    description: 'JSON array of solutions to import',
    type: [BulkImportSolutionDto],
  })
  @ApiResponse({ status: 201, description: 'Solutions import started' })
  @ApiResponse({ status: 400, description: 'Invalid JSON data' })
  async importSolutionsJson(@Body() solutionsData: BulkImportSolutionDto[]) {
    return this.bulkOperationsService.importSolutionsJson(solutionsData);
  }

  @Get('operations')
  @ApiOperation({ summary: 'Get all processing operations' })
  @ApiResponse({ status: 200, description: 'Operations list retrieved' })
  async getAllOperations(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<any>> {
    const result =
      await this.bulkOperationsService.getAllOperations(paginationDto);

    if (Array.isArray(result)) {
      return {
        data: result,
        total: result.length,
        page: 1,
        size: result.length,
        totalPages: 1,
      };
    }

    return result;
  }

  @Get('operations/:operationId/status')
  @ApiOperation({ summary: 'Get processing operation status' })
  @ApiResponse({ status: 200, description: 'Operation status retrieved' })
  @ApiResponse({ status: 404, description: 'Operation not found' })
  async getOperationStatus(@Param('operationId') operationId: string) {
    return this.bulkOperationsService.getOperationStatus(operationId);
  }

  @Post('solutions/assess-llm')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Start LLM assessment for solutions' })
  @ApiConsumes('application/json')
  @ApiBody({
    description: 'LLM assessment request',
    schema: {
      type: 'object',
      properties: {
        solutionIds: { type: 'array', items: { type: 'string' } },
        llmModel: { type: 'string' },
        taskId: { type: 'string' },
        systemPrompt: { type: 'string' },
      },
      required: ['solutionIds'],
    },
  })
  @ApiResponse({ status: 201, description: 'LLM assessment started' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async startLLMAssessment(
    @Body()
    requestData: {
      solutionIds: string[];
      llmModel?: string;
      taskId?: string;
      systemPrompt?: string;
    },
    @GetCurrentUser() user: CurrentUser,
  ) {
    return this.bulkOperationsService.startLLMAssessment({
      ...requestData,
      userId: user.id,
    });
  }

  @Post('operations/:id/stop')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  @ApiOperation({ summary: 'Stop a running operation' })
  @ApiResponse({ status: 200, description: 'Operation stopped successfully' })
  @ApiResponse({ status: 400, description: 'Cannot stop operation' })
  async stopOperation(@Param('id') operationId: string) {
    return this.bulkOperationsService.stopOperation(operationId);
  }

  @Post('operations/:id/restart')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  @ApiOperation({ summary: 'Restart a failed operation' })
  @ApiResponse({ status: 200, description: 'Operation restarted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot restart operation' })
  async restartOperation(@Param('id') operationId: string) {
    return this.bulkOperationsService.restartOperation(operationId);
  }

  @Delete('operations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  @ApiOperation({ summary: 'Delete a processing operation' })
  @ApiResponse({ status: 200, description: 'Operation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Operation not found' })
  async deleteOperation(@Param('id') operationId: string) {
    return this.bulkOperationsService.deleteOperation(operationId);
  }

  @Post('operations/check-stuck')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Check for and handle stuck operations' })
  @ApiResponse({ status: 200, description: 'Stuck operations check completed' })
  async checkStuckOperations() {
    return this.bulkOperationsService.checkAndHandleStuckOperations();
  }
}

import { Body, Controller, Get, Post, Res, Param } from '@nestjs/common';
import { BulkOperationsService } from './bulk-operations.service';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { BulkImportTaskDto, BulkImportSolutionDto } from '@app/shared/dto';

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
  async importTasksJson(@Body() tasksData: BulkImportTaskDto[]) {
    // TODO: Replace placeholder userId with actual user ID from auth context
    const placeholderUserId = 1;
    return this.bulkOperationsService.importTasksJson(
      tasksData,
      placeholderUserId,
    );
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

  @Get('operations/:operationId/status')
  @ApiOperation({ summary: 'Get processing operation status' })
  @ApiResponse({ status: 200, description: 'Operation status retrieved' })
  @ApiResponse({ status: 404, description: 'Operation not found' })
  async getOperationStatus(@Param('operationId') operationId: string) {
    return this.bulkOperationsService.getOperationStatus(operationId);
  }

  @Post('solutions/assess-llm')
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
  async startLLMAssessment(@Body() requestData: {
    solutionIds: string[];
    llmModel?: string;
    taskId?: string;
    systemPrompt?: string;
  }) {
    return this.bulkOperationsService.startLLMAssessment(requestData);
  }
}

import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { BulkOperationsService } from './bulk-operations.service';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { BulkImportTaskDto } from '@app/shared/dto';

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
}

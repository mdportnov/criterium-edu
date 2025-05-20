import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BulkOperationsService } from './bulk-operations.service';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { BulkImportTaskDto } from '@app/shared/dto';

// DTOs will be created later

@ApiTags('Bulk Operations')
@Controller('bulk-operations')
export class BulkOperationsController {
  constructor(private readonly bulkOperationsService: BulkOperationsService) {}

  // Endpoint for JSON Task Import
  @Post('tasks/import/json')
  @ApiBody({ 
    description: 'JSON array of tasks to import',
    type: [BulkImportTaskDto], 
  })
  async importTasksJson(@Body() tasksData: BulkImportTaskDto[]) {
    // TODO: Replace placeholder userId with actual user ID from auth context
    const placeholderUserId = 1; 
    return this.bulkOperationsService.importTasksJson(tasksData, placeholderUserId);
  }

  // Endpoint for CSV Task Import
  @Post('tasks/import/csv')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'CSV file containing tasks to import',
    type: 'object',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async importTasksCsv(@UploadedFile() file: Express.Multer.File) {
    // TODO: Replace placeholder userId with actual user ID from auth context
    const placeholderUserId = 1;
    return this.bulkOperationsService.importTasksCsv(file.buffer, placeholderUserId);
  }

  // Endpoint for JSON Task Export
  @Get('tasks/export/json')
  async exportTasksJson(@Res() res: Response) {
    const tasksJson = await this.bulkOperationsService.exportTasksJson();
    res.header('Content-Type', 'application/json');
    res.header('Content-Disposition', 'attachment; filename=tasks.json');
    res.send(tasksJson);
  }

  // Endpoint for CSV Task Export
  @Get('tasks/export/csv')
  async exportTasksCsv(@Res() res: Response) {
    const tasksCsv = await this.bulkOperationsService.exportTasksCsv();
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=tasks.csv');
    res.send(tasksCsv);
  }
}

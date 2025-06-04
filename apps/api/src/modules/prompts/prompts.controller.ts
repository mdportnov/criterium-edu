import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CreatePromptDto,
  PromptsService,
  UpdatePromptDto,
} from './prompts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetCurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@app/shared';
import { Prompt } from './entities/prompt.entity';

@Controller('prompts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async createPrompt(
    @Body() createPromptDto: CreatePromptDto,
    @GetCurrentUser() user: { id: string },
  ): Promise<Prompt> {
    return this.promptsService.createPrompt(createPromptDto, user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async getAllPrompts(): Promise<Prompt[]> {
    return this.promptsService.getAllPrompts();
  }

  @Get('categories')
  @Roles(UserRole.ADMIN)
  async getAvailableCategories(): Promise<string[]> {
    return this.promptsService.getAvailableCategories();
  }

  @Get('languages')
  @Roles(UserRole.ADMIN)
  async getAvailableLanguages(): Promise<string[]> {
    return this.promptsService.getAvailableLanguages();
  }

  @Get('by-category/:category')
  @Roles(UserRole.ADMIN)
  async getPromptsByCategory(
    @Param('category') category: string,
  ): Promise<Prompt[]> {
    return this.promptsService.getPromptsByCategory(category);
  }

  @Get('content/:key')
  @Roles(UserRole.ADMIN)
  async getPromptContent(
    @Param('key') key: string,
    @Query('language') language?: string,
    @Query('variables') variables?: string,
  ): Promise<{ content: string }> {
    let parsedVariables: Record<string, string> | undefined;

    if (variables) {
      try {
        parsedVariables = JSON.parse(variables);
      } catch (error) {
        parsedVariables = undefined;
      }
    }

    const content = await this.promptsService.getPromptContent(
      key,
      language,
      parsedVariables,
    );

    return { content };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async getPromptById(@Param('id') id: string): Promise<Prompt> {
    return this.promptsService.getPromptById(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async updatePrompt(
    @Param('id') id: string,
    @Body() updatePromptDto: UpdatePromptDto,
  ): Promise<Prompt> {
    return this.promptsService.updatePrompt(id, updatePromptDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deletePrompt(@Param('id') id: string): Promise<void> {
    return this.promptsService.deletePrompt(id);
  }
}

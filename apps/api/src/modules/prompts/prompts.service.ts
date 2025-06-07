import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prompt } from './entities/prompt.entity';
import { PromptTranslation } from './entities/prompt-translation.entity';
import { CreatePromptDto, UpdatePromptDto } from '@app/shared';

@Injectable()
export class PromptsService {
  constructor(
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
    @InjectRepository(PromptTranslation)
    private readonly translationRepository: Repository<PromptTranslation>,
  ) {}

  async createPrompt(
    createPromptDto: CreatePromptDto,
    createdBy: string,
  ): Promise<Prompt> {
    const { translations, ...promptData } = createPromptDto;

    const prompt = this.promptRepository.create({
      ...promptData,
      createdBy,
    });

    const savedPrompt = await this.promptRepository.save(prompt);

    if (translations && translations.length > 0) {
      const translationEntities = translations.map((translation) =>
        this.translationRepository.create({
          ...translation,
          promptId: savedPrompt.id,
        }),
      );
      await this.translationRepository.save(translationEntities);
    }

    return this.getPromptById(savedPrompt.id);
  }

  async getAllPrompts(): Promise<Prompt[]> {
    return this.promptRepository.find({
      relations: ['translations', 'creator'],
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async getPromptById(id: string): Promise<Prompt> {
    const prompt = await this.promptRepository.findOne({
      where: { id },
      relations: ['translations', 'creator'],
    });

    if (!prompt) {
      throw new NotFoundException(`Prompt with ID ${id} not found`);
    }

    return prompt;
  }

  async getPromptByKey(key: string): Promise<Prompt> {
    const prompt = await this.promptRepository.findOne({
      where: { key, isActive: true },
      relations: ['translations'],
    });

    if (!prompt) {
      throw new NotFoundException(`Prompt with key ${key} not found`);
    }

    return prompt;
  }

  async updatePrompt(
    id: string,
    updatePromptDto: UpdatePromptDto,
  ): Promise<Prompt> {
    const prompt = await this.getPromptById(id);
    const { translations, ...updateData } = updatePromptDto;

    Object.assign(prompt, updateData);
    await this.promptRepository.save(prompt);

    if (translations) {
      await this.translationRepository.delete({ promptId: id });

      if (translations.length > 0) {
        const translationEntities = translations.map((translation) =>
          this.translationRepository.create({
            ...translation,
            promptId: id,
          }),
        );
        await this.translationRepository.save(translationEntities);
      }
    }

    return this.getPromptById(id);
  }

  async deletePrompt(id: string): Promise<void> {
    const prompt = await this.getPromptById(id);
    await this.promptRepository.remove(prompt);
  }

  async getPromptsByCategory(category: string): Promise<Prompt[]> {
    return this.promptRepository.find({
      where: { category, isActive: true },
      relations: ['translations'],
      order: { name: 'ASC' },
    });
  }

  async getPromptContent(
    key: string,
    languageCode: string = 'en',
    variables?: Record<string, string>,
  ): Promise<string> {
    const prompt = await this.getPromptByKey(key);

    let translation = prompt.translations.find(
      (t) => t.languageCode === languageCode,
    );

    if (!translation) {
      translation = prompt.translations.find(
        (t) => t.languageCode === prompt.defaultLanguage,
      );
    }

    if (!translation) {
      translation = prompt.translations[0];
    }

    if (!translation) {
      throw new NotFoundException(`No translation found for prompt ${key}`);
    }

    let content = translation.content;

    if (variables && Object.keys(variables).length > 0) {
      content = this.interpolateTemplate(content, variables);
    }

    return content;
  }

  private interpolateTemplate(
    template: string,
    variables: Record<string, string>,
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  async getAvailableCategories(): Promise<string[]> {
    const result = await this.promptRepository
      .createQueryBuilder('prompt')
      .select('DISTINCT prompt.category', 'category')
      .where('prompt.isActive = :isActive', { isActive: true })
      .getRawMany();

    return result.map((r) => r.category);
  }

  async getAvailableLanguages(): Promise<string[]> {
    const result = await this.translationRepository
      .createQueryBuilder('translation')
      .select('DISTINCT translation.languageCode', 'language')
      .getRawMany();

    return result.map((r) => r.language);
  }
}

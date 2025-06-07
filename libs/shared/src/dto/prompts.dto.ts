import { z } from 'zod';

export enum PromptType {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

export const PromptTranslationSchema = z.object({
  languageCode: z.string(),
  content: z.string(),
});

export const CreatePromptDtoSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string(),
  promptType: z.nativeEnum(PromptType).optional(),
  defaultLanguage: z.string().optional(),
  variables: z.array(z.string()).optional(),
  translations: z.array(PromptTranslationSchema),
});

export const UpdatePromptDtoSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  promptType: z.nativeEnum(PromptType).optional(),
  defaultLanguage: z.string().optional(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  translations: z.array(PromptTranslationSchema).optional(),
});

export const PromptDtoSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string(),
  promptType: z.nativeEnum(PromptType),
  defaultLanguage: z.string(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  translations: z.array(PromptTranslationSchema),
});

export type PromptTranslationDto = z.infer<typeof PromptTranslationSchema>;
export type CreatePromptDto = z.infer<typeof CreatePromptDtoSchema>;
export type UpdatePromptDto = z.infer<typeof UpdatePromptDtoSchema>;
export type PromptDto = z.infer<typeof PromptDtoSchema>;

// Export types as runtime-accessible objects for NX webpack compatibility
export const PromptTranslationDto = {} as PromptTranslationDto;
export const CreatePromptDto = {} as CreatePromptDto;
export const UpdatePromptDto = {} as UpdatePromptDto;
export const PromptDto = {} as PromptDto;

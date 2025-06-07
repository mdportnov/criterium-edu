import { z } from 'zod';

export const PaginationDtoSchema = z.object({
  page: z.number().min(1).optional().default(1),
  size: z.number().min(1).max(100).optional().default(10),
});

export type PaginationDto = z.infer<typeof PaginationDtoSchema>;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

// Export types as runtime-accessible objects for NX webpack compatibility
export const PaginationDto = {} as PaginationDto;
export const PaginatedResponse = {} as PaginatedResponse<any>;
export const PaginationMeta = {} as PaginationMeta;

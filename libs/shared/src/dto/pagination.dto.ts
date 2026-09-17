import { z } from 'zod';

// Query strings deliver everything as text, so these coerce rather than
// demand numbers.
export const PaginationDtoSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  size: z.coerce.number().int().min(1).max(100).optional().default(10),
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

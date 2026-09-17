import { describe, expect, it } from 'vitest';
import { PaginationDtoSchema } from './pagination.dto';

describe('PaginationDtoSchema', () => {
  it('fills in defaults for an empty query', () => {
    expect(PaginationDtoSchema.parse({})).toEqual({ page: 1, size: 10 });
  });

  // Query strings arrive as text; the schema has to coerce or every paginated
  // endpoint rejects ?page=2.
  it('coerces the numbers a query string actually delivers', () => {
    expect(PaginationDtoSchema.parse({ page: '3', size: '25' })).toEqual({
      page: 3,
      size: 25,
    });
  });

  it('rejects a page below 1', () => {
    expect(PaginationDtoSchema.safeParse({ page: 0 }).success).toBe(false);
  });

  it('caps the page size so a client cannot ask for the whole table', () => {
    expect(PaginationDtoSchema.safeParse({ size: 101 }).success).toBe(false);
  });

  it('rejects text that is not a number', () => {
    expect(PaginationDtoSchema.safeParse({ page: 'abc' }).success).toBe(false);
  });
});

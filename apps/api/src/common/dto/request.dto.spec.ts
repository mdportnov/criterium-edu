import { describe, expect, it } from 'vitest';
import * as dtos from './request.dto';
import {
  AutoAssessRequestDto,
  BatchImportSolutionsDto,
  BulkImportSolutionsDto,
  LoginDto,
  PaginationDto,
  RegisterDto,
  StartLlmAssessmentDto,
} from './request.dto';

interface MaybeZodDto {
  name: string;
  isZodDto?: boolean;
  schema?: { safeParse?: unknown };
}

const isClassExport = (value: unknown): value is MaybeZodDto =>
  typeof value === 'function' && /^[A-Z]/.test((value as MaybeZodDto).name);

const exportedClasses: MaybeZodDto[] = Object.values(
  dtos as Record<string, unknown>,
).filter(isClassExport);

describe('request DTOs', () => {
  // The global ZodValidationPipe only validates a parameter whose metatype is
  // a ZodDto. A plain interface is erased and the pipe waves the body through,
  // which is exactly how the API ran unvalidated.
  it('exports only ZodDto classes', () => {
    expect(exportedClasses.length).toBeGreaterThan(15);
    for (const dto of exportedClasses) {
      expect(dto.isZodDto, `${dto.name} is not a ZodDto`).toBe(true);
      expect(typeof dto.schema?.safeParse, dto.name).toBe('function');
    }
  });

  it('rejects a malformed registration', () => {
    const result = RegisterDto.schema.safeParse({
      email: 'not-an-email',
      firstName: '',
      lastName: '',
      password: 'x',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0]).sort()).toEqual([
      'email',
      'firstName',
      'lastName',
      'password',
    ]);
  });

  it('accepts a well-formed login', () => {
    expect(
      LoginDto.schema.safeParse({
        email: 'a@example.com',
        password: 'secret123',
      }).success,
    ).toBe(true);
  });

  it('coerces pagination out of query-string text', () => {
    expect(PaginationDto.schema.parse({ page: '2', size: '50' })).toEqual({
      page: 2,
      size: 50,
    });
  });

  it('requires uuids for the ids an assessment run is given', () => {
    expect(
      AutoAssessRequestDto.schema.safeParse({ solutionIds: ['nope'] }).success,
    ).toBe(false);
    expect(
      AutoAssessRequestDto.schema.safeParse({
        solutionIds: ['0c7a61fc-c45b-40a2-b2f3-1b9d6b6f0c42'],
      }).success,
    ).toBe(true);
  });

  it('refuses an empty assessment run', () => {
    expect(
      StartLlmAssessmentDto.schema.safeParse({ solutionIds: [] }).success,
    ).toBe(false);
  });

  it('validates array bodies element by element', () => {
    expect(
      BulkImportSolutionsDto.schema.safeParse([
        {
          studentName: 'A',
          studentId: 'S-1',
          solutionContent: 'text',
          taskId: 'not-a-uuid',
        },
      ]).success,
    ).toBe(false);
  });

  it('refuses a batch import with no solutions', () => {
    expect(
      BatchImportSolutionsDto.schema.safeParse({
        solutions: [],
        sourceName: 'moodle',
      }).success,
    ).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import type { ArgumentMetadata } from '@nestjs/common';
import { z } from 'zod';
import { createZodDto, isZodDto } from './zod-dto';
import {
  ZodValidationException,
  ZodValidationPipe,
} from './zod-validation.pipe';

const Schema = z.object({
  email: z.email(),
  page: z.coerce.number().int().min(1).default(1),
  tags: z.array(z.string()).optional(),
  reviewerId: z.string().nullish(),
  when: z.date().optional(),
});

class ExampleDto extends createZodDto(Schema) {}

const bodyOf = (metatype: unknown): ArgumentMetadata =>
  ({ type: 'body', metatype }) as ArgumentMetadata;

describe('createZodDto', () => {
  it('marks the class so the pipe can recognise it', () => {
    expect(isZodDto(ExampleDto)).toBe(true);
    expect(isZodDto(class Plain {})).toBe(false);
    expect(isZodDto({})).toBe(false);
  });

  it('keeps the schema reachable', () => {
    expect(ExampleDto.schema.safeParse({ email: 'a@b.co' }).success).toBe(true);
  });

  describe('OpenAPI metadata', () => {
    const metadata = ExampleDto._OPENAPI_METADATA_FACTORY() as Record<
      string,
      Record<string, unknown>
    >;

    it('describes required and optional fields', () => {
      expect(metadata.email).toMatchObject({ type: 'string', required: true });
      expect(metadata.tags).toMatchObject({
        type: 'array',
        items: { type: 'string' },
        required: false,
      });
    });

    it('treats a field with a default as not required', () => {
      expect(metadata.page).toMatchObject({ required: false, default: 1 });
    });

    it('describes a nullable field by its concrete type', () => {
      expect(metadata.reviewerId).toMatchObject({
        type: 'string',
        nullable: true,
      });
    });

    // Without a type Swagger takes the property for a class reference and
    // fails the whole document with a bogus "circular dependency detected";
    // z.date() has no JSON Schema equivalent, so it is left out.
    it('omits a property it cannot type rather than emitting an empty one', () => {
      expect(metadata).not.toHaveProperty('when');
      for (const property of Object.values(metadata)) {
        expect(property.type).toBeTypeOf('string');
      }
    });
  });
});

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe();

  it('passes through a parameter that is not a ZodDto', () => {
    const value = { anything: true };
    expect(pipe.transform(value, bodyOf(Object))).toBe(value);
    expect(pipe.transform(value, bodyOf(undefined))).toBe(value);
  });

  it('returns the parsed value, so defaults and coercions reach the handler', () => {
    expect(
      pipe.transform({ email: 'a@b.co', page: '4' }, bodyOf(ExampleDto)),
    ).toMatchObject({ email: 'a@b.co', page: 4 });
  });

  it('raises a validation exception carrying every issue', () => {
    try {
      pipe.transform({ email: 'nope', page: 0 }, bodyOf(ExampleDto));
      throw new Error('expected the pipe to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ZodValidationException);
      const paths = (error as ZodValidationException).zodError.issues.map(
        (issue) => issue.path.join('.'),
      );
      expect(paths.sort()).toEqual(['email', 'page']);
    }
  });
});

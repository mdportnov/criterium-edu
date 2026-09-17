import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ZodError } from 'zod';
import { isZodDto } from './zod-dto';

/** Carries the issues so the exception filter can turn them into `details`. */
export class ZodValidationException extends Error {
  constructor(readonly zodError: ZodError) {
    super('Request validation failed');
    this.name = 'ZodValidationException';
  }
}

/**
 * Validates any parameter whose declared type is a ZodDto, and replaces the
 * value with the parsed one - so coercions and defaults declared in the schema
 * actually reach the handler.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const metatype = metadata.metatype;
    if (!isZodDto(metatype)) {
      return value;
    }

    const result = metatype.schema.safeParse(value);
    if (!result.success) {
      throw new ZodValidationException(result.error);
    }

    return result.data;
  }
}

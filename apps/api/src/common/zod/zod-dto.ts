import type { ZodType, infer as ZodInfer } from 'zod';
import { z } from 'zod';

/**
 * Request DTOs, without nestjs-zod.
 *
 * nestjs-zod gave us three things - createZodDto, a validation pipe and an
 * exception - and in exchange pinned @nestjs/swagger to ^11, which held the
 * whole application on NestJS 11. The three are small; the pin was not.
 */
export interface ZodDtoStatic<TSchema extends ZodType = ZodType> {
  new (): ZodInfer<TSchema>;
  isZodDto: true;
  schema: TSchema;
  /** Nest's Swagger plugin calls this to describe the request body. */
  _OPENAPI_METADATA_FACTORY(): Record<string, unknown>;
}

export function createZodDto<TSchema extends ZodType>(
  schema: TSchema,
): ZodDtoStatic<TSchema> {
  class ZodDto {
    static readonly isZodDto = true as const;
    static readonly schema = schema;

    static _OPENAPI_METADATA_FACTORY(): Record<string, unknown> {
      return openApiPropertiesOf(schema);
    }
  }

  return ZodDto as unknown as ZodDtoStatic<TSchema>;
}

export function isZodDto(value: unknown): value is ZodDtoStatic {
  return (
    typeof value === 'function' &&
    (value as { isZodDto?: unknown }).isZodDto === true
  );
}

interface JsonSchemaObject {
  type?: string | string[];
  properties?: Record<string, JsonSchemaObject>;
  required?: string[];
  items?: JsonSchemaObject;
  enum?: unknown[];
  format?: string;
  description?: string;
  default?: unknown;
  anyOf?: JsonSchemaObject[];
  oneOf?: JsonSchemaObject[];
  [key: string]: unknown;
}

/**
 * Turns a schema into the per-property map Nest's Swagger module expects.
 *
 * An array or record body has no properties to describe, and Swagger has no
 * way to express that through this hook - those show as an empty body, which
 * is the same thing nestjs-zod did.
 */
function openApiPropertiesOf(schema: ZodType): Record<string, unknown> {
  let jsonSchema: JsonSchemaObject;
  try {
    jsonSchema = z.toJSONSchema(schema, {
      io: 'input',
      unrepresentable: 'any',
    }) as JsonSchemaObject;
  } catch {
    return {};
  }

  const properties = jsonSchema.properties;
  if (!properties) {
    return {};
  }

  const required = new Set(jsonSchema.required ?? []);
  const metadata: Record<string, unknown> = {};

  for (const [name, property] of Object.entries(properties)) {
    const described = toSwaggerProperty(property);
    if (!described) {
      continue;
    }
    metadata[name] = { ...described, required: required.has(name) };
  }

  return metadata;
}

function toSwaggerProperty(
  property: JsonSchemaObject,
): Record<string, unknown> | null {
  // A nullable or optional field arrives either as `type: ["string","null"]`
  // or as a union; describe the concrete branch and mark it nullable.
  const branches = property.anyOf ?? property.oneOf;
  const effective =
    branches?.find((branch) => branch.type && branch.type !== 'null') ??
    property;

  const rawType = effective.type;
  const types = Array.isArray(rawType) ? rawType : rawType ? [rawType] : [];
  const concrete = types.find((candidate) => candidate !== 'null');

  // Without a type Swagger treats the property as a class reference and tries
  // to resolve it, which ends in a spurious "circular dependency detected".
  // Zod types with no JSON Schema equivalent - z.date() is the common one -
  // land here; leaving them undocumented beats claiming something false.
  if (!concrete) {
    return null;
  }

  const swagger: Record<string, unknown> = { type: concrete };

  if (types.includes('null') || branches?.some((b) => b.type === 'null')) {
    swagger.nullable = true;
  }
  if (effective.format) {
    swagger.format = effective.format;
  }
  if (effective.enum) {
    swagger.enum = effective.enum;
  }
  const description = effective.description ?? property.description;
  if (description) {
    swagger.description = description;
  }
  if (property.default !== undefined) {
    swagger.default = property.default;
  }
  if (concrete === 'array' && effective.items) {
    swagger.items = toSwaggerProperty(effective.items) ?? { type: 'object' };
  }

  return swagger;
}

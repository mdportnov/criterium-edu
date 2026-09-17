import { z } from 'zod';

const WEAK_JWT_SECRETS = new Set([
  'criterium_secret_key',
  'secret',
  'changeme',
  'change_me',
  'jwt_secret',
]);

const booleanFromEnv = z
  .union([z.boolean(), z.string()])
  .transform((value) =>
    typeof value === 'boolean'
      ? value
      : ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase()),
  );

const csvList = z.string().transform((value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
);

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    BACKEND_PORT: z.coerce.number().int().min(1).max(65535).default(3000),

    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().min(1).max(65535),
    DB_USERNAME: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().min(1),
    DB_LOGGING: booleanFromEnv.default(false),

    JWT_SECRET: z
      .string()
      .min(32, 'JWT_SECRET must be at least 32 characters')
      .refine(
        (secret) => !WEAK_JWT_SECRETS.has(secret.toLowerCase()),
        'JWT_SECRET is a known default value and must be replaced',
      ),
    // A `ms` duration such as 30s / 15m / 12h / 7d, or plain seconds.
    JWT_EXPIRATION_TIME: z
      .string()
      .regex(
        /^\d+(\.\d+)?\s*(ms|s|m|h|d|w|y|seconds?|minutes?|hours?|days?|weeks?|years?)?$/i,
        'JWT_EXPIRATION_TIME must be a duration like 30m, 12h or 7d',
      )
      .default('1d'),
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    // 32 bytes of hex - `openssl rand -hex 32`. Encrypts the provider
    // credentials stored in app_settings.
    SETTINGS_ENCRYPTION_KEY: z
      .string()
      .regex(
        /^[0-9a-fA-F]{64}$/,
        'SETTINGS_ENCRYPTION_KEY must be 64 hex characters (32 bytes)',
      ),

    CORS_ORIGINS: csvList.default('http://localhost:5173'),
    SWAGGER_ENABLED: booleanFromEnv.optional(),

    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && env.CORS_ORIGINS.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGINS'],
        message: 'CORS_ORIGINS must list at least one origin in production',
      });
    }
  });

export type EnvSchema = z.infer<typeof envSchema>;

export interface AppConfig {
  nodeEnv: EnvSchema['NODE_ENV'];
  port: number;
  isProduction: boolean;
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    logging: boolean;
  };
  jwt: { secret: string; expiresIn: string };
  security: {
    bcryptRounds: number;
    corsOrigins: string[];
    settingsEncryptionKey: string;
  };
  swagger: { enabled: boolean };
  logging: { level: EnvSchema['LOG_LEVEL'] };
}

export const buildConfig = (source: NodeJS.ProcessEnv): AppConfig => {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    // Field names only - never echo the values, they are secrets.
    const problems = Object.entries(result.error.flatten().fieldErrors)
      .map(([field, messages]) => `  ${field}: ${(messages ?? []).join('; ')}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${problems}`);
  }

  const env = result.data;
  const isProduction = env.NODE_ENV === 'production';

  return {
    nodeEnv: env.NODE_ENV,
    port: env.BACKEND_PORT,
    isProduction,
    database: {
      host: env.DB_HOST,
      port: env.DB_PORT,
      username: env.DB_USERNAME,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      logging: env.DB_LOGGING,
    },
    jwt: {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRATION_TIME,
    },
    security: {
      bcryptRounds: env.BCRYPT_ROUNDS,
      corsOrigins: env.CORS_ORIGINS,
      settingsEncryptionKey: env.SETTINGS_ENCRYPTION_KEY,
    },
    swagger: {
      enabled: env.SWAGGER_ENABLED ?? !isProduction,
    },
    logging: {
      level: env.LOG_LEVEL,
    },
  };
};

export default (): AppConfig => buildConfig(process.env);

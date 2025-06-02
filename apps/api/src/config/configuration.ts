import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number(),
  DB_USERNAME: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRATION_TIME: z.string(),
  LOG_LEVEL: z.string().default('info'),
});

export type EnvSchema = z.infer<typeof envSchema>;

export default () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error(
      'Environment validation error:',
      result.error.flatten().fieldErrors,
    );
    throw new Error('Environment validation failed');
  }
  return {
    nodeEnv: result.data.NODE_ENV,
    port: result.data.PORT,
    database: {
      host: result.data.DB_HOST,
      port: result.data.DB_PORT,
      username: result.data.DB_USERNAME,
      password: result.data.DB_PASSWORD,
      database: result.data.DB_NAME,
    },
    jwt: {
      secret: result.data.JWT_SECRET,
      expiresIn: result.data.JWT_EXPIRATION_TIME,
    },
    logging: {
      level: result.data.LOG_LEVEL,
    },
  };
};

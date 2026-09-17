import { describe, expect, it } from 'vitest';
import { buildConfig } from './configuration';

const valid = {
  NODE_ENV: 'production',
  BACKEND_PORT: '3000',
  DB_HOST: 'postgres',
  DB_PORT: '5432',
  DB_USERNAME: 'criterium',
  DB_PASSWORD: 'a-real-password',
  DB_NAME: 'criterium',
  JWT_SECRET:
    'f0e1d2c3b4a5968778695a4b3c2d1e0f00112233445566778899aabbccddeeff',
  JWT_EXPIRATION_TIME: '1d',
  CORS_ORIGINS: 'https://criterium.command.mephi.ru',
} as NodeJS.ProcessEnv;

describe('buildConfig', () => {
  it('accepts a complete production environment', () => {
    const config = buildConfig(valid);

    expect(config.isProduction).toBe(true);
    expect(config.port).toBe(3000);
    expect(config.security.corsOrigins).toEqual([
      'https://criterium.command.mephi.ru',
    ]);
  });

  // The deployed API signed tokens with an empty secret because the old
  // schema was a bare z.string(). Both of these must now abort the boot.
  it('rejects an empty JWT secret', () => {
    expect(() => buildConfig({ ...valid, JWT_SECRET: '' })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('rejects the secret that used to be committed to the repo', () => {
    expect(() =>
      buildConfig({ ...valid, JWT_SECRET: 'criterium_secret_key' }),
    ).toThrow(/JWT_SECRET/);
  });

  it('rejects a secret shorter than 32 characters', () => {
    expect(() => buildConfig({ ...valid, JWT_SECRET: 'a'.repeat(31) })).toThrow(
      /at least 32/,
    );
  });

  it('never puts a value into the error message', () => {
    try {
      buildConfig({ ...valid, DB_PASSWORD: '' });
      throw new Error('expected buildConfig to throw');
    } catch (error) {
      expect((error as Error).message).toContain('DB_PASSWORD');
      expect((error as Error).message).not.toContain(valid.JWT_SECRET);
    }
  });

  it('defaults Swagger off in production and on everywhere else', () => {
    expect(buildConfig(valid).swagger.enabled).toBe(false);
    expect(
      buildConfig({ ...valid, NODE_ENV: 'development' }).swagger.enabled,
    ).toBe(true);
    expect(
      buildConfig({ ...valid, SWAGGER_ENABLED: 'true' }).swagger.enabled,
    ).toBe(true);
  });

  it('splits CORS_ORIGINS on commas and trims the entries', () => {
    const config = buildConfig({
      ...valid,
      CORS_ORIGINS: 'https://a.example , https://b.example',
    });

    expect(config.security.corsOrigins).toEqual([
      'https://a.example',
      'https://b.example',
    ]);
  });

  it('requires at least one CORS origin in production', () => {
    expect(() => buildConfig({ ...valid, CORS_ORIGINS: '' })).toThrow(
      /CORS_ORIGINS/,
    );
  });

  it('rejects a bcrypt cost below 10', () => {
    expect(() => buildConfig({ ...valid, BCRYPT_ROUNDS: '4' })).toThrow(
      /BCRYPT_ROUNDS/,
    );
    expect(buildConfig(valid).security.bcryptRounds).toBe(12);
  });

  it('rejects a JWT lifetime that is not a duration', () => {
    expect(() =>
      buildConfig({ ...valid, JWT_EXPIRATION_TIME: 'forever' }),
    ).toThrow(/JWT_EXPIRATION_TIME/);
  });

  it('reads DB_LOGGING as a boolean', () => {
    expect(buildConfig({ ...valid, DB_LOGGING: 'true' }).database.logging).toBe(
      true,
    );
    expect(buildConfig(valid).database.logging).toBe(false);
  });
});

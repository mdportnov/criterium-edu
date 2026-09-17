import { describe, expect, it } from 'vitest';
import { LoginAsSchema, LoginSchema, RegisterSchema } from './auth.dto';

describe('auth contracts', () => {
  it('requires a well-formed email', () => {
    expect(
      LoginSchema.safeParse({ email: 'not-an-email', password: 'secret123' })
        .success,
    ).toBe(false);
  });

  it('requires a password of at least 6 characters', () => {
    expect(
      LoginSchema.safeParse({ email: 'a@example.com', password: 'short' })
        .success,
    ).toBe(false);
  });

  it('accepts valid credentials', () => {
    expect(
      LoginSchema.safeParse({ email: 'a@example.com', password: 'secret123' })
        .success,
    ).toBe(true);
  });

  it('rejects a registration with blank names', () => {
    expect(
      RegisterSchema.safeParse({
        email: 'a@example.com',
        firstName: '',
        lastName: '',
        password: 'secret123',
      }).success,
    ).toBe(false);
  });

  it('accepts only a uuid as the impersonation target', () => {
    expect(LoginAsSchema.safeParse({ userId: '42' }).success).toBe(false);
    expect(
      LoginAsSchema.safeParse({
        userId: '0c7a61fc-c45b-40a2-b2f3-1b9d6b6f0c42',
      }).success,
    ).toBe(true);
  });
});

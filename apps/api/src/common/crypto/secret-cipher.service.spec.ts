import { describe, expect, it } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { SecretCipherService } from './secret-cipher.service';

const KEY_A =
  '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';
const KEY_B =
  'ffeeddccbbaa99887766554433221100ffeeddccbbaa99887766554433221100';

const cipherWith = (key: string) =>
  new SecretCipherService({
    getOrThrow: () => key,
  } as unknown as ConfigService);

describe('SecretCipherService', () => {
  const cipher = cipherWith(KEY_A);
  const secret = 'sk-proj-abcdefghijklmnopqrstuvwxyz0123456789';

  it('round-trips a secret', () => {
    expect(cipher.decrypt(cipher.encrypt(secret))).toBe(secret);
  });

  it('never leaves the plaintext in the stored value', () => {
    const stored = cipher.encrypt(secret);

    expect(stored).not.toContain(secret);
    expect(stored).not.toContain('abcdefgh');
    expect(cipher.isEncrypted(stored)).toBe(true);
  });

  it('produces a different ciphertext every time', () => {
    expect(cipher.encrypt(secret)).not.toBe(cipher.encrypt(secret));
  });

  it('passes through a value written before encryption existed', () => {
    expect(cipher.isEncrypted(secret)).toBe(false);
    expect(cipher.decrypt(secret)).toBe(secret);
  });

  it('refuses a ciphertext written under a different key', () => {
    const stored = cipherWith(KEY_B).encrypt(secret);

    expect(() => cipher.decrypt(stored)).toThrow(/could not be decrypted/);
  });

  // GCM authenticates; a flipped byte must fail rather than decrypt to junk.
  it('refuses a tampered ciphertext', () => {
    const stored = cipher.encrypt(secret);
    const tampered =
      stored.slice(0, -4) + (stored.slice(-4) === 'AAAA' ? 'BBBB' : 'AAAA');

    expect(() => cipher.decrypt(tampered)).toThrow(/could not be decrypted/);
  });

  it('masks enough to recognise a key and not enough to use it', () => {
    const masked = cipher.mask(secret);

    expect(masked.startsWith('sk-')).toBe(true);
    expect(masked.endsWith('6789')).toBe(true);
    expect(masked).not.toContain('abcdefgh');
    expect(masked.length).toBeLessThan(secret.length);
  });

  it('masks a short value completely', () => {
    expect(cipher.mask('short')).toBe('••••••••');
  });
});

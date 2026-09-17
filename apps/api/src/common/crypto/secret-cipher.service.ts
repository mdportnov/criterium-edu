import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from 'crypto';

const PREFIX = 'enc.v1.';
const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;

/**
 * Envelope encryption for secrets held in the database.
 *
 * Ciphertext is stored as `enc.v1.<base64url(iv | tag | ciphertext)>`. The
 * prefix lets a value written before this existed be recognised as plaintext
 * and re-encrypted the next time it is saved, rather than requiring a
 * migration that would have to hold the key.
 */
@Injectable()
export class SecretCipherService {
  private readonly logger = new Logger(SecretCipherService.name);
  private readonly key: Buffer;

  constructor(configService: ConfigService) {
    this.key = Buffer.from(
      configService.getOrThrow<string>('security.settingsEncryptionKey'),
      'hex',
    );
  }

  isEncrypted(value: string): boolean {
    return value.startsWith(PREFIX);
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    return (
      PREFIX +
      Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url')
    );
  }

  /**
   * Returns the plaintext. A value without the prefix predates encryption and
   * is returned as-is so nothing breaks while the store is still mixed.
   */
  decrypt(value: string): string {
    if (!this.isEncrypted(value)) {
      return value;
    }

    try {
      const payload = Buffer.from(value.slice(PREFIX.length), 'base64url');
      const iv = payload.subarray(0, IV_BYTES);
      const tag = payload.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
      const ciphertext = payload.subarray(IV_BYTES + TAG_BYTES);

      const decipher = createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(tag);

      return Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      // Wrong key, or the row was tampered with. Say which setting failed, and
      // never log the value.
      this.logger.error(
        'Failed to decrypt a stored secret. SETTINGS_ENCRYPTION_KEY may have changed.',
      );
      throw new Error('Stored secret could not be decrypted');
    }
  }

  /** `sk-proj-…` style hint for the UI: enough to recognise, not to use. */
  mask(plaintext: string): string {
    if (plaintext.length <= 8) {
      return '••••••••';
    }
    return `${plaintext.slice(0, 3)}••••••••${plaintext.slice(-4)}`;
  }

  /** Constant-time comparison, for checking a submitted value against a mask. */
  matches(a: string, b: string): boolean {
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    return (
      bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB)
    );
  }
}

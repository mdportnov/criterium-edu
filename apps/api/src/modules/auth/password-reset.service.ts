import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { IsNull, LessThan, Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { Logger } from 'nestjs-pino';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { UsersService } from '../users/users.service';

const TOKEN_BYTES = 32;
const TTL_MS = 24 * 60 * 60 * 1000;

export interface IssuedResetLink {
  url: string;
  expiresAt: Date;
}

/**
 * One-time links for setting a password.
 *
 * Bulk import creates accounts with a random password that nobody holds, so
 * without this an imported student can never sign in. Links are issued by an
 * administrator and handed over out of band; there is no SMTP configured in
 * this application, so there is no self-service "email me a reset" flow to
 * deliver.
 */
@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(PasswordResetToken)
    private readonly tokenRepository: Repository<PasswordResetToken>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}

  async issueFor(userId: string, issuedById: string): Promise<IssuedResetLink> {
    const user = await this.usersService.findOne(userId);

    // Only the newest link should work.
    await this.tokenRepository.delete({ userId: user.id, usedAt: IsNull() });

    const token = randomBytes(TOKEN_BYTES).toString('base64url');
    const expiresAt = new Date(Date.now() + TTL_MS);

    await this.tokenRepository.save(
      this.tokenRepository.create({
        userId: user.id,
        tokenHash: hash(token),
        expiresAt,
        issuedById,
      }),
    );

    this.logger.warn(
      {
        message: 'Password reset link issued',
        userId: user.id,
        issuedById,
        expiresAt,
      },
      PasswordResetService.name,
    );

    const baseUrl = this.configService
      .getOrThrow<string>('appBaseUrl')
      .replace(/\/+$/, '');

    return { url: `${baseUrl}/set-password?token=${token}`, expiresAt };
  }

  async redeem(token: string, newPassword: string): Promise<void> {
    const record = await this.tokenRepository.findOne({
      where: { tokenHash: hash(token) },
    });

    // One message for every failure mode: an expired, spent or invented token
    // must be indistinguishable.
    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(
        'This link is invalid or has expired. Ask an administrator for a new one.',
      );
    }

    try {
      await this.usersService.update(record.userId, {
        password: newPassword,
      } as never);
    } catch (error) {
      if (error instanceof NotFoundException) {
        await this.tokenRepository.delete({ id: record.id });
        throw new BadRequestException(
          'This link is invalid or has expired. Ask an administrator for a new one.',
        );
      }
      throw error;
    }

    record.usedAt = new Date();
    await this.tokenRepository.save(record);

    this.logger.warn(
      { message: 'Password set via reset link', userId: record.userId },
      PasswordResetService.name,
    );
  }

  /** Housekeeping: spent and expired rows serve no purpose. */
  async purgeExpired(): Promise<number> {
    const result = await this.tokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected ?? 0;
  }
}

function hash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

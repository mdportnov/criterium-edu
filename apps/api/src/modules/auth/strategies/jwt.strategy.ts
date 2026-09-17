import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { SESSION_COOKIE } from '../session-cookie';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  impersonatedBy?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      // Browsers send the httpOnly session cookie; service clients may still
      // present a bearer token.
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) =>
          ((request?.cookies ?? {}) as Record<string, string>)[
            SESSION_COOKIE
          ] ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // The password hash must never reach request.user - controllers and
    // interceptors downstream serialise this object.
    const { password: _password, ...safeUser } = user;
    return { ...safeUser, impersonatedBy: payload.impersonatedBy };
  }
}

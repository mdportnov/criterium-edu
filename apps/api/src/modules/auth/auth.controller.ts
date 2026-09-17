import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { UserRole } from '@app/shared';
import type { CurrentUser, UserDto } from '@app/shared';
import { AuthService } from './auth.service';
import type { AuthResult } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { GetCurrentUser } from './decorators/current-user.decorator';
import { SkipCsrf } from './decorators/skip-csrf.decorator';
import { UsersService } from '../users/users.service';
import {
  CompletePasswordResetDto,
  LoginAsDto,
  LoginDto,
  RegisterDto,
} from '../../common/dto';
import { clearSessionCookies, setSessionCookies } from './session-cookie';

/** Five attempts a minute: these are the brute-force surface. */
const CREDENTIAL_THROTTLE = { default: { ttl: 60_000, limit: 5 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly passwordResetService: PasswordResetService,
    private readonly configService: ConfigService,
  ) {}

  @Throttle(CREDENTIAL_THROTTLE)
  @SkipCsrf()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserDto> {
    return this.establishSession(
      await this.authService.login(loginDto),
      response,
    );
  }

  @Throttle(CREDENTIAL_THROTTLE)
  @SkipCsrf()
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserDto> {
    return this.establishSession(
      await this.authService.register(registerDto),
      response,
    );
  }

  @SkipCsrf()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response): void {
    clearSessionCookies(response, this.isProduction);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@GetCurrentUser() user: CurrentUser): Promise<UserDto> {
    const { password: _password, ...profile } = await this.usersService.findOne(
      user.id,
    );
    return profile;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Post('login-as')
  async loginAs(
    @Body() login: LoginAsDto,
    @GetCurrentUser() user: CurrentUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserDto> {
    return this.establishSession(
      await this.authService.loginAs(login.userId, user.id),
      response,
    );
  }

  /**
   * Redeems a one-time link issued by an administrator. Public, because the
   * whole point is that the holder cannot sign in yet.
   */
  @Throttle(CREDENTIAL_THROTTLE)
  @SkipCsrf()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('set-password')
  async setPassword(@Body() dto: CompletePasswordResetDto): Promise<void> {
    await this.passwordResetService.redeem(dto.token, dto.password);
  }

  private establishSession(result: AuthResult, response: Response): UserDto {
    setSessionCookies(response, {
      token: result.token,
      csrfToken: result.csrfToken,
      maxAgeMs: this.sessionMaxAgeMs,
      isProduction: this.isProduction,
    });
    return result.user;
  }

  private get isProduction(): boolean {
    return this.configService.getOrThrow<boolean>('isProduction');
  }

  private get sessionMaxAgeMs(): number {
    // Keep the cookie and the token expiry in step so a session does not
    // linger in the browser after the JWT it holds has expired.
    return parseDuration(
      this.configService.getOrThrow<string>('jwt.expiresIn'),
    );
  }
}

const DURATION_UNITS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
  y: 31_557_600_000,
};

/** The env schema already guarantees the shape; this just converts it. */
function parseDuration(value: string): number {
  const match = /^(\d+(?:\.\d+)?)\s*([a-z]*)$/i.exec(value.trim());
  if (!match) {
    return DURATION_UNITS.d;
  }
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multiplier = DURATION_UNITS[unit] ?? DURATION_UNITS[unit[0]] ?? 1000;
  return amount * multiplier;
}

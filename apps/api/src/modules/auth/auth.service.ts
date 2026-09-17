import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SettingsService } from '../settings/settings.service';
import { randomBytes } from 'crypto';
import { UserRole } from '@app/shared';
import type { LoginDto, RegisterDto, UserDto } from '@app/shared';
import * as bcrypt from 'bcrypt';
import { Logger } from 'nestjs-pino';

export interface AuthResult {
  /** Goes into the httpOnly session cookie; never into a response body. */
  token: string;
  /** Echoed back to the client for the double-submit CSRF check. */
  csrfToken: string;
  user: UserDto;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly settingsService: SettingsService,
    private readonly logger: Logger,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResult> {
    this.logger.log(
      {
        message: 'Login attempt',
        email: loginDto.email,
      },
      AuthService.name,
    );

    const user = await this.validateUser(loginDto.email, loginDto.password);

    this.logger.log(
      {
        message: 'Login successful',
        userId: user.id,
        role: user.role,
      },
      AuthService.name,
    );

    return this.issue(user);
  }

  async register(registerDto: RegisterDto): Promise<AuthResult> {
    this.logger.log(
      {
        message: 'Registration attempt',
        email: registerDto.email,
      },
      AuthService.name,
    );

    const isRegistrationEnabled =
      await this.settingsService.isRegistrationEnabled();
    if (!isRegistrationEnabled) {
      this.logger.warn(
        {
          message: 'Registration attempt when registration is disabled',
          email: registerDto.email,
        },
        AuthService.name,
      );
      throw new ForbiddenException('Registration is currently disabled');
    }

    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      this.logger.warn(
        {
          message: 'Registration attempt with existing email',
          email: registerDto.email,
        },
        AuthService.name,
      );
      throw new UnauthorizedException('Email already exists');
    }

    const user = await this.usersService.create({
      ...registerDto,
      role: UserRole.STUDENT, // Default role for new registrations
    });

    this.logger.log(
      {
        message: 'Registration successful',
        userId: user.id,
        role: user.role,
      },
      AuthService.name,
    );

    return this.issue(user);
  }

  async loginAs(userId: string, adminId: string): Promise<AuthResult> {
    // Check if the target user exists
    const user = await this.usersService.findOne(userId);

    // Log this action for auditing purposes
    this.logger.warn(
      {
        message: 'Admin impersonation',
        adminId,
        impersonatedUserId: userId,
        impersonatedUserEmail: user.email,
        impersonatedUserRole: user.role,
      },
      AuthService.name,
    );

    return this.issue(user, adminId);
  }

  private issue(
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      createdAt?: Date;
      updatedAt?: Date;
    },
    impersonatedBy?: string,
  ): AuthResult {
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      ...(impersonatedBy ? { impersonatedBy } : {}),
    });

    return {
      token,
      csrfToken: randomBytes(24).toString('base64url'),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt as Date,
        updatedAt: user.updatedAt as Date,
      },
    };
  }

  private async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(
        {
          message: 'Login failed - user not found',
          email,
        },
        AuthService.name,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(
        {
          message: 'Login failed - invalid password',
          userId: user.id,
          email,
        },
        AuthService.name,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}

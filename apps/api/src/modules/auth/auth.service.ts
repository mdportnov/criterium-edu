import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SettingsService } from '../settings/settings.service';
import { LoginDto, RegisterDto, TokenDto, UserRole } from '@app/shared';
import * as bcrypt from 'bcrypt';
import { Logger } from 'nestjs-pino';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly settingsService: SettingsService,
    private readonly logger: Logger,
  ) {}

  async login(loginDto: LoginDto): Promise<TokenDto> {
    this.logger.log(
      {
        message: 'Login attempt',
        email: loginDto.email,
      },
      AuthService.name,
    );

    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    this.logger.log(
      {
        message: 'Login successful',
        userId: user.id,
        role: user.role,
      },
      AuthService.name,
    );

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerDto: RegisterDto): Promise<TokenDto> {
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

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    this.logger.log(
      {
        message: 'Registration successful',
        userId: user.id,
        role: user.role,
      },
      AuthService.name,
    );

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async loginAs(userId: number, adminId: number): Promise<TokenDto> {
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

    // Create a JWT token for the target user
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      // Add a flag to identify this as an impersonation session
      impersonatedBy: adminId,
    };

    return {
      access_token: this.jwtService.sign(payload),
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

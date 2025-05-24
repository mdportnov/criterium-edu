import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginAsDto,
  LoginDto,
  RegisterDto,
  TokenDto,
  UserDto,
  UserRole,
} from '@app/shared';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UsersService } from '../users/users.service';
import { GetCurrentUser } from './decorators/current-user.decorator';
import { CurrentUser } from '@app/shared';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<TokenDto> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<TokenDto> {
    return this.authService.register(registerDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@GetCurrentUser() user: CurrentUser): Promise<UserDto> {
    const fullUser = await this.usersService.findOne(user.id);
    const { password, ...result } = fullUser;
    return result;
  }

  @Post('login-as')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async loginAs(
    @Body() loginAsDto: LoginAsDto,
    @GetCurrentUser() user: CurrentUser,
  ): Promise<TokenDto> {
    return this.authService.loginAs(loginAsDto.userId, user.id);
  }
}

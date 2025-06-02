import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  PaginatedResponse,
  PaginationDto,
  UpdateUserDto,
  UserDto,
  UserRole,
} from '@app/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from './entities/user.entity';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<UserDto>> {
    const result = await this.usersService.findAll(paginationDto);
    return {
      ...result,
      data: result.data.map((user) => this.mapToDto(user)),
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  async findOne(@Param('id') id: string): Promise<UserDto> {
    const user = await this.usersService.findOne(id);
    return this.mapToDto(user);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    const user = await this.usersService.create(createUserDto);
    return this.mapToDto(user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDto> {
    const user = await this.usersService.update(id, updateUserDto);
    return this.mapToDto(user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string): Promise<void> {
    await this.usersService.remove(id);
  }

  private mapToDto(user: User): UserDto {
    const { password, ...userDto } = user;
    return userDto;
  }
}

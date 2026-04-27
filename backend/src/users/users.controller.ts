import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { IsString, MinLength } from 'class-validator';

class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(6)
  newPassword!: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body(new ValidationPipe({ transform: true, whitelist: true })) dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch('me/password')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  changeOwnPassword(@Body() dto: ChangePasswordDto, @Req() req: any) {
    return this.usersService.changePassword(req.user.userId, dto.currentPassword, dto.newPassword);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
}

import { Controller, Get, Patch, Param, Body, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: { id: string; email: string; username: string; displayName: string; avatarUrl: string | null; bio: string | null; needsUsername: boolean; createdAt: Date }) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? null,
      bio: user.bio ?? null,
      needsUsername: user.needsUsername ?? false,
      createdAt: user.createdAt,
    };
  }

  @Patch('me')
  updateMe(@CurrentUser() user: { id: string }, @Body() body: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, body);
  }

  @Get(':username')
  async getProfile(@Param('username') username: string) {
    const profile = await this.usersService.getProfile(username);
    if (!profile) throw new NotFoundException('User not found');
    return profile;
  }
}

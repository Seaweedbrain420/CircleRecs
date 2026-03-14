import { Controller, Get, Patch, Param, Body, Req, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import type { UpdateProfileDto } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: Request) {
    const user = req.user as any;
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
  updateMe(@Req() req: Request, @Body() body: UpdateProfileDto) {
    return this.usersService.updateProfile((req.user as any).id, body);
  }

  @Get(':username')
  async getProfile(@Param('username') username: string) {
    const profile = await this.usersService.getProfile(username);
    if (!profile) throw new NotFoundException('User not found');
    return profile;
  }
}

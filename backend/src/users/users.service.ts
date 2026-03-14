import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export interface UpdateProfileDto {
  displayName?: string;
  bio?: string;
  username?: string;
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async searchByUsername(query: string, excludeUserId: string) {
    return this.prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
      },
      take: 10,
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.username !== undefined) {
      if (!USERNAME_REGEX.test(dto.username)) {
        throw new BadRequestException(
          'Username must be 3-20 characters and contain only letters, numbers, or underscores',
        );
      }

      // O(1) Redis check before touching the DB
      const taken = await this.redis.isUsernameTaken(dto.username);
      if (taken) {
        // Confirm it is not the current user's own username
        const existing = await this.prisma.user.findUnique({
          where: { username: dto.username },
          select: { id: true },
        });
        if (existing && existing.id !== userId) {
          throw new ConflictException('Username already taken');
        }
      }
    }

    // Fetch current username before update so we can swap it in Redis
    const currentUser = dto.username
      ? await this.prisma.user.findUnique({
          where: { id: userId },
          select: { username: true },
        })
      : null;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName && { displayName: dto.displayName }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.username && { username: dto.username, needsUsername: false }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        needsUsername: true,
        createdAt: true,
      },
    });

    // Keep Redis in sync: remove old username, add new one
    if (dto.username && currentUser?.username) {
      await this.redis.removeUsername(currentUser.username);
      await this.redis.addUsername(dto.username);
    }

    return updated;
  }

  async getProfile(username: string) {
    // Fast path: not in Redis Set means definitely free - skip DB entirely
    const taken = await this.redis.isUsernameTaken(username);
    if (!taken) return null;

    // Slow path: username is taken, fetch full profile from DB
    return this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        _count: { select: { entries: true } },
      },
    });
  }
}

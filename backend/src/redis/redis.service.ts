import { Injectable, Inject, OnApplicationBootstrap, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from './redis.constants';

const USERNAMES_KEY = 'taken_usernames';

@Injectable()
export class RedisService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly prisma: PrismaService,
  ) {}

  // Seed the set from DB on every boot — ensures the cache is always fresh
  async onApplicationBootstrap() {
    try {
      await this.redis.del(USERNAMES_KEY);
      const users = await this.prisma.user.findMany({
        select: { username: true },
      });
      if (users.length > 0) {
        await this.redis.sadd(USERNAMES_KEY, ...users.map((u) => u.username));
      }
      this.logger.log(`Redis username cache seeded with ${users.length} entries`);
    } catch (err) {
      // Non-fatal — app still works, just falls back to DB on every check
      this.logger.error('Failed to seed Redis username cache', err);
    }
  }

  /** O(1) — returns true if username is definitely taken */
  async isUsernameTaken(username: string): Promise<boolean> {
    const result = await this.redis.sismember(USERNAMES_KEY, username);
    return result === 1;
  }

  /** Call after a username is successfully registered or changed to */
  async addUsername(username: string): Promise<void> {
    await this.redis.sadd(USERNAMES_KEY, username);
  }

  /** Call when a user changes their username to free up the old one */
  async removeUsername(username: string): Promise<void> {
    await this.redis.srem(USERNAMES_KEY, username);
  }
}

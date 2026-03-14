import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redis: RedisService,
  ) {}

  private issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });

    return { accessToken, refreshToken };
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  async register(dto: RegisterDto, res: Response) {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (exists) {
      throw new ConflictException(
        exists.email === dto.email ? 'Email already in use' : 'Username already taken',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        displayName: dto.displayName,
        passwordHash,
      },
    });

    const { passwordHash: _, ...safeUser } = user;
    const { accessToken, refreshToken } = this.issueTokens(user.id, user.email);
    this.setRefreshCookie(res, refreshToken);

    // Keep Redis username set in sync
    await this.redis.addUsername(user.username);

    return { user: safeUser, accessToken };
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const { passwordHash: _, ...safeUser } = user;
    const { accessToken, refreshToken } = this.issueTokens(user.id, user.email);
    this.setRefreshCookie(res, refreshToken);

    return { user: safeUser, accessToken };
  }

  async refresh(refreshToken: string, res: Response) {
    try {
      const payload = this.jwtService.verify<{ sub: string; email: string }>(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new Error();

      const { passwordHash: _, ...safeUser } = user;
      const tokens = this.issueTokens(user.id, user.email);
      this.setRefreshCookie(res, tokens.refreshToken);

      return { user: safeUser, accessToken: tokens.accessToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  logout(res: Response) {
    res.clearCookie('refresh_token');
    return { message: 'Logged out' };
  }

  issueAccessToken(userId: string, email: string) {
    return this.jwtService.sign({ sub: userId, email }, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
    });
  }

  issueRefreshToken(userId: string, email: string) {
    return this.jwtService.sign({ sub: userId, email }, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });
  }

  async findOrCreateGoogleUser(profile: {
    googleId: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
  }) {
    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: profile.googleId }, { email: profile.email }] },
    });

    if (!user) {
      const baseUsername = profile.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
      let username = baseUsername;
      let count = 0;
      while (await this.prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${++count}`;
      }

      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          username,
          displayName: profile.displayName,
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl,
          needsUsername: true,
        },
      });
      // Add the temporary username to Redis; will be swapped when user sets their real one
      await this.redis.addUsername(username);
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.googleId, avatarUrl: profile.avatarUrl ?? user.avatarUrl },
      });
    }

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}

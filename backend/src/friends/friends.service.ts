import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  private friendshipKey(a: string, b: string) {
    return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
  }

  async sendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send a friend request to yourself');
    }

    // Check if already friends
    const key = this.friendshipKey(senderId, receiverId);
    const alreadyFriends = await this.prisma.friendship.findUnique({
      where: { userAId_userBId: key },
    });
    if (alreadyFriends) throw new ConflictException('Already friends');

    // Check for existing pending request in either direction
    const existing = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
        status: 'PENDING',
      },
    });
    if (existing) throw new ConflictException('Friend request already pending');

    return this.prisma.friendRequest.create({
      data: { senderId, receiverId },
      include: {
        receiver: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }

  async respondToRequest(userId: string, requestId: string, accept: boolean) {
    const request = await this.prisma.friendRequest.findFirst({
      where: { id: requestId, receiverId: userId, status: 'PENDING' },
    });
    if (!request) throw new NotFoundException('Friend request not found');

    if (accept) {
      const key = this.friendshipKey(request.senderId, request.receiverId);
      await this.prisma.$transaction([
        this.prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: 'ACCEPTED' },
        }),
        this.prisma.friendship.create({ data: key }),
      ]);
      return { accepted: true };
    } else {
      await this.prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' },
      });
      return { accepted: false };
    }
  }

  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: { select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true } },
        userB: { select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true } },
      },
    });

    return friendships.map((f) => ({
      friendshipId: f.id,
      since: f.createdAt,
      friend: f.userAId === userId ? f.userB : f.userA,
    }));
  }

  async getPendingRequests(userId: string) {
    return this.prisma.friendRequest.findMany({
      where: { receiverId: userId, status: 'PENDING' },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeFriend(userId: string, friendId: string) {
    const key = this.friendshipKey(userId, friendId);
    const friendship = await this.prisma.friendship.findUnique({
      where: { userAId_userBId: key },
    });
    if (!friendship) throw new NotFoundException('Friendship not found');

    await this.prisma.friendship.delete({ where: { userAId_userBId: key } });
    return { message: 'Friend removed' };
  }
}

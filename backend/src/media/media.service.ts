import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MediaType, EntryStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OmdbService } from './external/omdb.service';
import { GoogleBooksService } from './external/google-books.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    private omdb: OmdbService,
    private books: GoogleBooksService,
  ) {}

  async search(type: MediaType, query: string) {
    if (type === 'BOOK') {
      return this.books.search(query);
    }
    const omdbType = type === 'MOVIE' ? 'movie' : 'series';
    return this.omdb.search(query, omdbType);
  }

  private async upsertMedia(externalId: string, type: MediaType) {
    let media = await this.prisma.media.findUnique({
      where: { externalId_type: { externalId, type } },
    });

    if (!media) {
      let details: any = null;
      if (type === 'BOOK') {
        details = await this.books.getDetails(externalId);
      } else {
        details = await this.omdb.getDetails(externalId);
      }

      if (!details) {
        throw new NotFoundException(`Media not found: ${externalId}`);
      }

      media = await this.prisma.media.create({
        data: {
          externalId,
          type,
          title: details.title,
          author: details.author,
          director: details.director,
          coverImageUrl: details.coverImageUrl,
          releaseYear: details.releaseYear,
          genre: details.genre ?? [],
          synopsis: details.synopsis,
          externalRating: details.externalRating,
          totalPages: details.totalPages,
          totalSeasons: details.totalSeasons,
          totalEpisodes: details.totalEpisodes,
        },
      });
    }

    return media;
  }

  async addEntry(userId: string, dto: CreateEntryDto) {
    const existing = await this.prisma.mediaEntry.findFirst({
      where: {
        userId,
        media: { externalId: dto.externalId, type: dto.mediaType },
      },
    });
    if (existing) throw new ConflictException('Already in your library');

    const media = await this.upsertMedia(dto.externalId, dto.mediaType);

    return this.prisma.mediaEntry.create({
      data: {
        userId,
        mediaId: media.id,
        status: dto.status,
        userRating: dto.userRating,
        review: dto.review,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : undefined,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
        pagesRead: dto.pagesRead,
        episodesWatched: dto.episodesWatched,
        currentSeason: dto.currentSeason,
      },
      include: { media: true },
    });
  }

  async updateEntry(userId: string, entryId: string, dto: UpdateEntryDto) {
    const entry = await this.prisma.mediaEntry.findFirst({
      where: { id: entryId, userId },
    });
    if (!entry) throw new NotFoundException('Entry not found');

    return this.prisma.mediaEntry.update({
      where: { id: entryId },
      data: {
        ...dto,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : undefined,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
      },
      include: { media: true },
    });
  }

  async deleteEntry(userId: string, entryId: string) {
    const entry = await this.prisma.mediaEntry.findFirst({
      where: { id: entryId, userId },
    });
    if (!entry) throw new NotFoundException('Entry not found');

    await this.prisma.mediaEntry.delete({ where: { id: entryId } });
    return { message: 'Removed from library' };
  }

  async getLibrary(userId: string, type?: MediaType, status?: EntryStatus) {
    return this.prisma.mediaEntry.findMany({
      where: {
        userId,
        ...(type && { media: { type } }),
        ...(status && { status }),
      },
      include: { media: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getFriendActivity(userId: string) {
    // Get all friend IDs for this user
    const friendships = await this.prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
    });

    const friendIds = friendships.map((f) =>
      f.userAId === userId ? f.userBId : f.userAId,
    );

    if (friendIds.length === 0) return [];

    return this.prisma.mediaEntry.findMany({
      where: {
        userId: { in: friendIds },
        status: { in: ['COMPLETED', 'IN_PROGRESS'] },
      },
      include: {
        media: true,
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 30,
    });
  }
}

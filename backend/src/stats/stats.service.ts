import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getYearStats(userId: string, year: number) {
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    const entries = await this.prisma.mediaEntry.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: { gte: start, lt: end },
      },
      include: { media: true },
    });

    // Totals by type
    const totals = { BOOK: 0, MOVIE: 0, TV_SHOW: 0 };
    for (const e of entries) {
      totals[e.media.type]++;
    }

    // Monthly breakdown (1-12)
    const monthly: { month: number; BOOK: number; MOVIE: number; TV_SHOW: number }[] =
      Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        BOOK: 0,
        MOVIE: 0,
        TV_SHOW: 0,
      }));

    for (const e of entries) {
      if (!e.completedAt) continue;
      const month = new Date(e.completedAt).getUTCMonth(); // 0-11
      monthly[month][e.media.type]++;
    }

    // Genre breakdown (top 10)
    const genreCount: Record<string, number> = {};
    for (const e of entries) {
      for (const g of e.media.genre) {
        genreCount[g] = (genreCount[g] ?? 0) + 1;
      }
    }
    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([genre, count]) => ({ genre, count }));

    // Average rating
    const rated = entries.filter((e) => e.userRating != null);
    const avgRating =
      rated.length > 0
        ? Math.round(
            (rated.reduce((sum, e) => sum + (e.userRating ?? 0), 0) / rated.length) * 10,
          ) / 10
        : null;

    return {
      year,
      totals,
      total: entries.length,
      monthly,
      topGenres,
      avgRating,
    };
  }

  async getSummary(userId: string) {
    const [totalEntries, completedEntries, friendCount] = await Promise.all([
      this.prisma.mediaEntry.count({ where: { userId } }),
      this.prisma.mediaEntry.count({ where: { userId, status: 'COMPLETED' } }),
      this.prisma.friendship.count({
        where: { OR: [{ userAId: userId }, { userBId: userId }] },
      }),
    ]);

    return { totalEntries, completedEntries, friendCount };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';

@Injectable()
export class RecommendationsService {
  constructor(
    private prisma: PrismaService,
    private claude: AiService,
  ) {}

  async getRecommendations(userId: string) {
    return this.prisma.recommendation.findMany({
      where: { userId, dismissed: false },
      orderBy: { generatedAt: 'desc' },
    });
  }

  async generate(userId: string) {
    // Fetch AI recommendations first — if this fails, nothing is deleted
    const raws = await this.claude.generateRecommendations(userId);

    // Delete and re-insert atomically now that we have a valid response
    const [, ...created] = await this.prisma.$transaction([
      this.prisma.recommendation.deleteMany({
        where: { userId, dismissed: false, saved: false },
      }),
      ...raws.map((r) =>
        this.prisma.recommendation.create({
          data: {
            userId,
            mediaType: r.type,
            title: r.title,
            reason: r.reason,
          },
        }),
      ),
    ]);

    return created;
  }

  async dismiss(userId: string, recId: string) {
    return this.prisma.recommendation.update({
      where: { id: recId, userId },
      data: { dismissed: true },
    });
  }

  async save(userId: string, recId: string) {
    return this.prisma.recommendation.update({
      where: { id: recId, userId },
      data: { saved: true },
    });
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';
import { MediaType } from '@prisma/client';

export interface RawRecommendation {
  type: MediaType;
  title: string;
  reason: string;
}

@Injectable()
export class ClaudeService {
  private readonly client: Anthropic;
  private readonly logger = new Logger(ClaudeService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.client = new Anthropic({
      apiKey: this.config.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  async generateRecommendations(userId: string): Promise<RawRecommendation[]> {
    // Fetch user's recent entries (completed or in-progress)
    const userEntries = await this.prisma.mediaEntry.findMany({
      where: {
        userId,
        status: { in: ['COMPLETED', 'IN_PROGRESS'] },
      },
      include: { media: true },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    // Fetch friend IDs
    const friendships = await this.prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
    });
    const friendIds = friendships.map((f) =>
      f.userAId === userId ? f.userBId : f.userAId,
    );

    // Fetch friends' recent completed entries
    const friendEntries =
      friendIds.length > 0
        ? await this.prisma.mediaEntry.findMany({
            where: {
              userId: { in: friendIds },
              status: 'COMPLETED',
            },
            include: { media: true },
            orderBy: { completedAt: 'desc' },
            take: 10,
          })
        : [];

    const userList = userEntries
      .map((e) => `- ${e.media.type}: "${e.media.title}" (${e.status})`)
      .join('\n');

    const friendList =
      friendEntries.length > 0
        ? friendEntries
            .map((e) => `- ${e.media.type}: "${e.media.title}"`)
            .join('\n')
        : 'No friend activity yet.';

    const prompt = `You are a personalized media recommendation engine.

User's recent library:
${userList || 'No entries yet.'}

What their friends have been enjoying:
${friendList}

Based on this, suggest exactly 5 recommendations the user would enjoy. Mix types (BOOK, MOVIE, TV_SHOW) based on what they track.
Avoid recommending titles already in their library.

Respond ONLY with a valid JSON array, no markdown, no explanation:
[
  { "type": "BOOK|MOVIE|TV_SHOW", "title": "Title", "reason": "One sentence why they'll love it" },
  ...
]`;

    try {
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const text =
        message.content[0].type === 'text' ? message.content[0].text : '';
      const parsed: RawRecommendation[] = JSON.parse(text);
      return parsed.slice(0, 5);
    } catch (err) {
      this.logger.error('Claude API error', err);
      throw new Error('Failed to generate recommendations');
    }
  }
}

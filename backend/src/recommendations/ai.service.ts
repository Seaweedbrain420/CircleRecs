import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { MediaType } from '@prisma/client';

export interface RawRecommendation {
  type: MediaType;
  title: string;
  reason: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly provider: 'claude' | 'openai';
  private claudeClient?: Anthropic;
  private openaiClient?: OpenAI;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.provider = (this.config.get<string>('AI_PROVIDER') ?? 'claude') as 'claude' | 'openai';

    if (this.provider === 'openai') {
      this.openaiClient = new OpenAI({
        apiKey: this.config.getOrThrow<string>('OPENAI_API_KEY'),
      });
    } else {
      this.claudeClient = new Anthropic({
        apiKey: this.config.getOrThrow<string>('ANTHROPIC_API_KEY'),
      });
    }
  }

  async generateRecommendations(userId: string): Promise<RawRecommendation[]> {
    const userEntries = await this.prisma.mediaEntry.findMany({
      where: {
        userId,
        status: { in: ['COMPLETED', 'IN_PROGRESS'] },
      },
      include: { media: true },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    const friendships = await this.prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
    });
    const friendIds = friendships.map((f) =>
      f.userAId === userId ? f.userBId : f.userAId,
    );

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
      const text = this.provider === 'openai'
        ? await this.callOpenAI(prompt)
        : await this.callClaude(prompt);

      const parsed: unknown = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        throw new Error('AI response is not an array');
      }
      const validTypes = new Set(['BOOK', 'MOVIE', 'TV_SHOW']);
      const validated: RawRecommendation[] = parsed
        .filter(
          (item): item is RawRecommendation =>
            item !== null &&
            typeof item === 'object' &&
            typeof (item as RawRecommendation).title === 'string' &&
            typeof (item as RawRecommendation).reason === 'string' &&
            validTypes.has((item as RawRecommendation).type),
        )
        .slice(0, 5);

      if (validated.length === 0) {
        throw new Error('AI response contained no valid recommendations');
      }
      return validated;
    } catch (err) {
      this.logger.error('AI API error', err);
      throw new Error('Failed to generate recommendations');
    }
  }

  private async callClaude(prompt: string): Promise<string> {
    const message = await this.claudeClient!.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });
    return message.content[0].type === 'text' ? message.content[0].text : '';
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await this.openaiClient!.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.choices[0]?.message?.content ?? '';
  }
}

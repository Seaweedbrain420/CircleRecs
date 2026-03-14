import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface BookSearchResult {
  externalId: string;
  type: 'BOOK';
  title: string;
  author?: string;
  coverImageUrl?: string;
  releaseYear?: number;
  genre?: string[];
  synopsis?: string;
  totalPages?: number;
}

@Injectable()
export class GoogleBooksService {
  private readonly logger = new Logger(GoogleBooksService.name);
  private readonly baseUrl = 'https://www.googleapis.com/books/v1/volumes';

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  private get apiKey(): string {
    return this.configService.get<string>('GOOGLE_BOOKS_API_KEY') ?? '';
  }

  async search(query: string): Promise<BookSearchResult[]> {
    try {
      const params: Record<string, any> = { q: query, maxResults: 10 };
      if (this.apiKey && this.apiKey !== 'your-google-books-key') {
        params.key = this.apiKey;
      }

      const { data } = await firstValueFrom(
        this.httpService.get(this.baseUrl, { params }),
      );

      if (!data.items) return [];

      return data.items.map((item: any) => this.mapVolume(item));
    } catch (err) {
      this.logger.error('Google Books search failed', err);
      return [];
    }
  }

  async getDetails(volumeId: string): Promise<BookSearchResult | null> {
    try {
      const params: Record<string, any> = {};
      if (this.apiKey && this.apiKey !== 'your-google-books-key') {
        params.key = this.apiKey;
      }

      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/${volumeId}`, { params }),
      );

      return this.mapVolume(data);
    } catch (err) {
      this.logger.error('Google Books detail fetch failed', err);
      return null;
    }
  }

  private mapVolume(item: any): BookSearchResult {
    const info = item.volumeInfo ?? {};
    const publishedYear = info.publishedDate
      ? parseInt(info.publishedDate.split('-')[0])
      : undefined;

    const cover =
      info.imageLinks?.thumbnail ??
      info.imageLinks?.smallThumbnail;

    return {
      externalId: item.id,
      type: 'BOOK',
      title: info.title ?? 'Unknown Title',
      author: info.authors?.join(', '),
      coverImageUrl: cover ? cover.replace('http://', 'https://') : undefined,
      releaseYear: publishedYear,
      genre: info.categories,
      synopsis: info.description,
      totalPages: info.pageCount,
    };
  }
}

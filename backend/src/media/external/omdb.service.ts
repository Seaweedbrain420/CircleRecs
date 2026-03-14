import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface OmdbSearchResult {
  externalId: string;
  type: 'MOVIE' | 'TV_SHOW';
  title: string;
  director?: string;
  coverImageUrl?: string;
  releaseYear?: number;
  genre?: string[];
  synopsis?: string;
  externalRating?: number;
  totalEpisodes?: number;
  totalSeasons?: number;
}

@Injectable()
export class OmdbService {
  private readonly logger = new Logger(OmdbService.name);
  private readonly baseUrl = 'https://www.omdbapi.com';

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  private get apiKey(): string {
    return this.configService.get<string>('OMDB_API_KEY') ?? '';
  }

  async search(query: string, type: 'movie' | 'series'): Promise<OmdbSearchResult[]> {
    if (!this.apiKey || this.apiKey === 'your-omdb-key') {
      this.logger.warn('OMDb API key not configured');
      return [];
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(this.baseUrl, {
          params: { apikey: this.apiKey, s: query, type },
        }),
      );

      if (data.Response === 'False' || !data.Search) return [];

      return data.Search.map((item: any) => ({
        externalId: item.imdbID,
        type: type === 'movie' ? 'MOVIE' : 'TV_SHOW',
        title: item.Title,
        coverImageUrl: item.Poster !== 'N/A' ? item.Poster : undefined,
        releaseYear: item.Year ? parseInt(item.Year.split('–')[0]) : undefined,
      }));
    } catch (err) {
      this.logger.error('OMDb search failed', err);
      return [];
    }
  }

  async getDetails(imdbId: string): Promise<OmdbSearchResult | null> {
    if (!this.apiKey || this.apiKey === 'your-omdb-key') return null;

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(this.baseUrl, {
          params: { apikey: this.apiKey, i: imdbId, plot: 'short' },
        }),
      );

      if (data.Response === 'False') return null;

      return {
        externalId: data.imdbID,
        type: data.Type === 'movie' ? 'MOVIE' : 'TV_SHOW',
        title: data.Title,
        director: data.Director !== 'N/A' ? data.Director : undefined,
        coverImageUrl: data.Poster !== 'N/A' ? data.Poster : undefined,
        releaseYear: data.Year ? parseInt(data.Year.split('–')[0]) : undefined,
        genre: data.Genre !== 'N/A' ? data.Genre.split(', ') : [],
        synopsis: data.Plot !== 'N/A' ? data.Plot : undefined,
        externalRating: data.imdbRating !== 'N/A' ? parseFloat(data.imdbRating) : undefined,
        totalSeasons: data.totalSeasons ? parseInt(data.totalSeasons) : undefined,
      };
    } catch (err) {
      this.logger.error('OMDb detail fetch failed', err);
      return null;
    }
  }
}

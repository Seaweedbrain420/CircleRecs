import { IsString, IsEnum, IsOptional, IsInt, Min, Max, IsDateString } from 'class-validator';
import { MediaType, EntryStatus } from '@prisma/client';

export class CreateEntryDto {
  @IsEnum(MediaType)
  mediaType: MediaType;

  @IsString()
  externalId: string;

  @IsEnum(EntryStatus)
  status: EntryStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  userRating?: number;

  @IsOptional()
  @IsString()
  review?: string;

  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  pagesRead?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  episodesWatched?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  currentSeason?: number;
}

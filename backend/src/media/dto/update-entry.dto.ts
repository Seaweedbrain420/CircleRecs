import { IsEnum, IsOptional, IsInt, Min, Max, IsDateString, IsString } from 'class-validator';
import { EntryStatus } from '@prisma/client';

export class UpdateEntryDto {
  @IsOptional()
  @IsEnum(EntryStatus)
  status?: EntryStatus;

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

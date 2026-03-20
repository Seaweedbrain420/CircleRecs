import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { MediaType, EntryStatus } from '@prisma/client';
import { MediaService } from './media.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('media')
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Get('search')
  search(
    @Query('type') type: MediaType,
    @Query('q') query: string,
  ) {
    const validTypes: MediaType[] = ['BOOK', 'MOVIE', 'TV_SHOW'];
    if (!type || !validTypes.includes(type)) {
      throw new BadRequestException('type must be one of: BOOK, MOVIE, TV_SHOW');
    }
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('q must be at least 2 characters');
    }
    return this.mediaService.search(type, query.trim());
  }

  @Get('library')
  getLibrary(
    @CurrentUser() user: { id: string },
    @Query('type') type?: MediaType,
    @Query('status') status?: EntryStatus,
  ) {
    return this.mediaService.getLibrary(user.id, type, status);
  }

  @Get('friends-activity')
  getFriendActivity(@CurrentUser() user: { id: string }) {
    return this.mediaService.getFriendActivity(user.id);
  }

  @Post('entries')
  addEntry(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateEntryDto,
  ) {
    return this.mediaService.addEntry(user.id, dto);
  }

  @Patch('entries/:id')
  updateEntry(
    @CurrentUser() user: { id: string },
    @Param('id') entryId: string,
    @Body() dto: UpdateEntryDto,
  ) {
    return this.mediaService.updateEntry(user.id, entryId, dto);
  }

  @Delete('entries/:id')
  deleteEntry(
    @CurrentUser() user: { id: string },
    @Param('id') entryId: string,
  ) {
    return this.mediaService.deleteEntry(user.id, entryId);
  }
}

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
import { FriendsService } from './friends.service';
import { UsersService } from '../users/users.service';
import { SendRequestDto, RespondRequestDto } from './dto/friend-request.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('friends')
export class FriendsController {
  constructor(
    private friendsService: FriendsService,
    private usersService: UsersService,
  ) {}

  @Get()
  getFriends(@CurrentUser() user: { id: string }) {
    return this.friendsService.getFriends(user.id);
  }

  @Get('requests')
  getPendingRequests(@CurrentUser() user: { id: string }) {
    return this.friendsService.getPendingRequests(user.id);
  }

  @Get('search')
  searchUsers(
    @CurrentUser() user: { id: string },
    @Query('q') query: string,
  ) {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Query must be at least 2 characters');
    }
    if (query.length > 50) {
      throw new BadRequestException('Query must be at most 50 characters');
    }
    return this.usersService.searchByUsername(query.trim(), user.id);
  }

  @Post('requests')
  sendRequest(
    @CurrentUser() user: { id: string },
    @Body() dto: SendRequestDto,
  ) {
    return this.friendsService.sendRequest(user.id, dto.receiverId);
  }

  @Patch('requests/:id')
  respondToRequest(
    @CurrentUser() user: { id: string },
    @Param('id') requestId: string,
    @Body() dto: RespondRequestDto,
  ) {
    return this.friendsService.respondToRequest(user.id, requestId, dto.accept);
  }

  @Delete(':friendId')
  removeFriend(
    @CurrentUser() user: { id: string },
    @Param('friendId') friendId: string,
  ) {
    return this.friendsService.removeFriend(user.id, friendId);
  }
}

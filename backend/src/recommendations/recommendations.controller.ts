import { Controller, Get, Post, Patch, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RecommendationsService } from './recommendations.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recService: RecommendationsService) {}

  @Get()
  getAll(@CurrentUser() user: { id: string }) {
    return this.recService.getRecommendations(user.id);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('generate')
  generate(@CurrentUser() user: { id: string }) {
    return this.recService.generate(user.id);
  }

  @Patch(':id/dismiss')
  dismiss(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.recService.dismiss(user.id, id);
  }

  @Patch(':id/save')
  save(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.recService.save(user.id, id);
  }
}

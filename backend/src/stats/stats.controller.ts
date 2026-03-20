import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { StatsService } from './stats.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: { id: string }) {
    return this.statsService.getSummary(user.id);
  }

  @Get('year/:year')
  getYear(@CurrentUser() user: { id: string }, @Param('year', ParseIntPipe) year: number) {
    return this.statsService.getYearStats(user.id, year);
  }
}

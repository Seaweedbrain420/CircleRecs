import { Controller, Get, Param, ParseIntPipe, Req } from '@nestjs/common';
import type { Request } from 'express';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('summary')
  getSummary(@Req() req: Request) {
    return this.statsService.getSummary((req.user as any).id);
  }

  @Get('year/:year')
  getYear(@Req() req: Request, @Param('year', ParseIntPipe) year: number) {
    return this.statsService.getYearStats((req.user as any).id, year);
  }
}

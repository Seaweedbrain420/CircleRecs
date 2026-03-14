import { Controller, Get, Post, Patch, Param, Req } from '@nestjs/common';
import type { Request } from 'express';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recService: RecommendationsService) {}

  @Get()
  getAll(@Req() req: Request) {
    return this.recService.getRecommendations((req.user as any).id);
  }

  @Post('generate')
  generate(@Req() req: Request) {
    return this.recService.generate((req.user as any).id);
  }

  @Patch(':id/dismiss')
  dismiss(@Req() req: Request, @Param('id') id: string) {
    return this.recService.dismiss((req.user as any).id, id);
  }

  @Patch(':id/save')
  save(@Req() req: Request, @Param('id') id: string) {
    return this.recService.save((req.user as any).id, id);
  }
}

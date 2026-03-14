import { Module } from '@nestjs/common';
import { ClaudeService } from './claude.service';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';

@Module({
  providers: [ClaudeService, RecommendationsService],
  controllers: [RecommendationsController],
})
export class RecommendationsModule {}

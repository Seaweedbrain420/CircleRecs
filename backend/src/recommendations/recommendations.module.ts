import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';

@Module({
  providers: [AiService, RecommendationsService],
  controllers: [RecommendationsController],
})
export class RecommendationsModule {}

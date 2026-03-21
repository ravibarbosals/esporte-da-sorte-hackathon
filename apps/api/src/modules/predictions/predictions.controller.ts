import { Controller, Get, Param } from '@nestjs/common';
import { PredictionsService } from './predictions.service';

@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Get(':homeTeam/:awayTeam')
  predict(
    @Param('homeTeam') homeTeam: string,
    @Param('awayTeam') awayTeam: string,
  ) {
    return this.predictionsService.predictMatch(homeTeam, awayTeam);
  }

  @Get(':homeTeam/:awayTeam/indicators')
  indicators(
    @Param('homeTeam') homeTeam: string,
    @Param('awayTeam') awayTeam: string,
  ) {
    return this.predictionsService.getIndicators(homeTeam, awayTeam);
  }

  @Get(':homeTeam/:awayTeam/full')
  fullAnalysis(
    @Param('homeTeam') homeTeam: string,
    @Param('awayTeam') awayTeam: string,
  ) {
    return this.predictionsService.getFullAnalysis(homeTeam, awayTeam);
  }
}
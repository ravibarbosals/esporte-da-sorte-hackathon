import { Controller, Get, Param } from '@nestjs/common';
import { PredictionsService } from './predictions.service';

@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  // Rotas específicas PRIMEIRO
  @Get('matches/upcoming')
  getUpcoming() {
    return this.predictionsService.getUpcomingMatches();
  }

  @Get('matches/live')
  getLive() {
    return this.predictionsService.getLiveMatches();
  }

  @Get('matches/:eventId/odds')
  getOdds(@Param('eventId') eventId: string) {
    return this.predictionsService.getMatchOdds(eventId);
  }

  @Get(':homeTeam/:awayTeam/indicators')
  indicators(@Param('homeTeam') homeTeam: string, @Param('awayTeam') awayTeam: string) {
    return this.predictionsService.getIndicators(homeTeam, awayTeam);
  }

  @Get(':homeTeam/:awayTeam/full')
  fullAnalysis(@Param('homeTeam') homeTeam: string, @Param('awayTeam') awayTeam: string) {
    return this.predictionsService.getFullAnalysis(homeTeam, awayTeam);
  }

  @Get(':homeTeam/:awayTeam')
  predict(@Param('homeTeam') homeTeam: string, @Param('awayTeam') awayTeam: string) {
    return this.predictionsService.predictMatch(homeTeam, awayTeam);
  }
}

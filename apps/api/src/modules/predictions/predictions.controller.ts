import { Controller, Get, Param, Query } from '@nestjs/common';
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

  @Get('match/:matchId/xg')
  getMatchXg(@Param('matchId') matchId: string) {
    return this.predictionsService.getMatchXg(matchId);
  }

  @Get('team/:competitionId/:teamName/xg-history')
  getTeamXgHistory(
    @Param('competitionId') competitionId: string,
    @Param('teamName') teamName: string,
    @Query('limit') limit = 10,
  ) {
    return this.predictionsService.getTeamXgHistory(competitionId, teamName, Number(limit));
  }

  @Get('h2h/:competitionId/:teamA/:teamB')
  getH2hXg(
    @Param('competitionId') competitionId: string,
    @Param('teamA') teamA: string,
    @Param('teamB') teamB: string,
  ) {
    return this.predictionsService.getH2hXg(competitionId, teamA, teamB);
  }

  @Get('team/:competitionId/:teamName/shot-profile')
  getTeamShotProfile(
    @Param('competitionId') competitionId: string,
    @Param('teamName') teamName: string,
  ) {
    return this.predictionsService.getTeamShotProfile(competitionId, teamName);
  }
}

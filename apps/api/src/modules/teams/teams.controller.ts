import { Controller, Get, Param, Query } from '@nestjs/common';
import { TeamsService } from './teams.service';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('most-aggressive')
  getMostAggressive(@Query('limit') limit = 10) {
    return this.teamsService.getMostAggressiveTeams(Number(limit));
  }

  @Get('top-scoring')
  getTopScoring(@Query('limit') limit = 10) {
    return this.teamsService.getTopScoringTeams(Number(limit));
  }

  @Get(':time')
  getTeamStats(@Param('time') time: string) {
    return this.teamsService.getTeamStats(time);
  }
}

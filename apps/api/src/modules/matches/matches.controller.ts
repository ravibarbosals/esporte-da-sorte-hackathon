import { Controller, Get, Param } from '@nestjs/common';
import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  findAll() {
    return this.matchesService.findAll();
  }

  @Get('upcoming')
  findUpcoming() {
    return this.matchesService.findUpcoming();
  }

  @Get('live')
  findLive() {
    return this.matchesService.findLive();
  }

  @Get('ended')
  findEnded() {
    return this.matchesService.findEnded();
  }

  @Get('league/:league')
  findByLeague(@Param('league') league: string) {
    return this.matchesService.findByLeague(league);
  }

  @Get('team/:team')
  findByTeam(@Param('team') team: string) {
    return this.matchesService.findByTeam(team);
  }

  @Get(':external_id')
  findByExternalId(@Param('external_id') external_id: string) {
    return this.matchesService.findByExternalId(external_id);
  }
}
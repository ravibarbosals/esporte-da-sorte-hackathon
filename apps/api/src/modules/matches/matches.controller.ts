import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesScheduler } from './matches.scheduler';
import {
  ReplayLiveResponseDto,
  ReplayMomentumDto,
  ReplayTimelineDto,
} from './dto/match-replay.dto';

@Controller('matches')
export class MatchesController {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly matchesScheduler: MatchesScheduler,
  ) {}

  @Get()
  findAll() {
    return this.matchesService.findAll();
  }

  @Get('upcoming')
  findUpcoming() {
    return this.matchesService.findUpcoming();
  }

  @Get('live')
  findLive(@Query('minute') minute = 67): Promise<ReplayLiveResponseDto | any> {
    return this.matchesService.getLiveReplay(Number(minute));
  }

  @Get(':external_id/timeline')
  getTimeline(
    @Param('external_id') externalId: string,
    @Query('minute') minute = 67,
  ): Promise<ReplayTimelineDto> {
    return this.matchesService.getReplayTimeline(externalId, Number(minute));
  }

  @Get(':external_id/predictions')
  getPredictions(@Param('external_id') externalId: string, @Query('minute') minute = 67) {
    return this.matchesService.getReplayPredictions(externalId, Number(minute));
  }

  @Get(':external_id/momentum')
  getMomentum(
    @Param('external_id') externalId: string,
    @Query('minute') minute = 67,
  ): Promise<ReplayMomentumDto> {
    return this.matchesService.getReplayMomentum(externalId, Number(minute));
  }

  @Get(':external_id/pre-match')
  getPreMatch(@Param('external_id') externalId: string) {
    return this.matchesService.getReplayPreMatch(externalId);
  }

  @Get(':external_id/key-players')
  getKeyPlayers(@Param('external_id') externalId: string) {
    return this.matchesService.getReplayKeyPlayers(externalId);
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
  findByExternalId(@Param('external_id') external_id: string, @Query('minute') minute = 67) {
    return this.matchesService.getReplayMatch(external_id, Number(minute));
  }

  @Get('sync-now')
  async syncNow() {
    await this.matchesScheduler.syncOdds();
    return { message: 'sync executado' };
  }

  @Delete('cleanup')
  async cleanup() {
    return this.matchesService.cleanupEsoccer();
  }
}

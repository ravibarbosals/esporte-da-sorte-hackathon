import { Controller, Get, Param, Query } from '@nestjs/common';
import { PlayersService } from './players.service';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  findAll() {
    return this.playersService.findAll();
  }

  @Get('top-scorers')
  topScorers(@Query('limit') limit = 10) {
    return this.playersService.topScorers(Number(limit));
  }

  @Get('time/:time')
  findBySquad(@Param('time') time: string) {
    return this.playersService.findByTime(time);
  }

  @Get(':name')
  findByName(@Param('name') name: string) {
    return this.playersService.findByNome(name);
  }
}

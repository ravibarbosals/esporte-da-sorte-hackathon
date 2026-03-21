import { Controller, Get, Param } from '@nestjs/common';
import { TeamsService } from './teams.service';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  findAll() {
    return this.teamsService.findAll();
  }

  @Get('league/:comp')
  findByComp(@Param('comp') comp: string) {
    return this.teamsService.findByComp(comp);
  }

  @Get(':name')
  findByName(@Param('name') name: string) {
    return this.teamsService.findByName(name);
  }
}
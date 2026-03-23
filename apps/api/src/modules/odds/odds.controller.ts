import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OddsService } from './odds.service';
import { Odds } from './odds.entity';

@ApiTags('Odds')
@Controller('odds')
export class OddsController {
  constructor(private readonly oddsService: OddsService) {}

  @Get('by-league/:liga')
  findByLiga(@Param('liga') liga: string) {
    return this.oddsService.findByLiga(liga);
  }

  @Get('by-team/:team')
  findByTeam(@Param('team') team: string) {
    return this.oddsService.findByTeam(team);
  }

  @Get('recent')
  findRecent(@Query('limit') limit = 20) {
    return this.oddsService.findRecent(limit);
  }

  @Get('evento/:fi')
  @ApiOperation({ summary: 'Lista o histórico de odds de um evento pelo FI' })
  @ApiParam({ name: 'fi', description: 'ID do evento na Bet365', example: '191757440' })
  @ApiResponse({ status: 200, description: 'Histórico de odds do evento retornado com sucesso.' })
  async findByEvent(@Param('fi') fi: string): Promise<Odds[]> {
    return this.oddsService.findByEvent(fi);
  }

  @Get('evento/:fi/latest')
  @ApiOperation({ summary: 'Busca a odd mais recente de um evento pelo FI' })
  @ApiParam({ name: 'fi', description: 'ID do evento na Bet365', example: '191757440' })
  @ApiResponse({ status: 200, description: 'Última odd do evento retornada com sucesso.' })
  async findLatest(@Param('fi') fi: string): Promise<Odds | null> {
    return this.oddsService.findLatest(fi);
  }

  @Get('evento/:fi/movements')
  @ApiOperation({ summary: 'Calcula a movimentação das odds de um evento' })
  @ApiParam({ name: 'fi', description: 'ID do evento na Bet365', example: '191757440' })
  @ApiResponse({ status: 200, description: 'Movimentação das odds retornada com sucesso.' })
  async findMovements(@Param('fi') fi: string) {
    return this.oddsService.findMovements(fi);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '../players/player.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
  ) {}

  async getTeamStats(time: string) {
  return this.playerRepository
    .createQueryBuilder('p')
    .select('p.time', 'time')
    .addSelect('p.liga', 'liga')
    .addSelect('SUM(p.gols)', 'total_gols')
    .addSelect('SUM(p.assistencias)', 'total_assistencias')
    .addSelect('SUM(p.cartoesAmarelos)', 'total_amarelos')
    .addSelect('SUM(p.cartoesVermelhos)', 'total_vermelhos')
    .where('p.time = :time', { time })
    .groupBy('p.time')
    .addGroupBy('p.liga')
    .getRawOne();
}

  async getMostAggressiveTeams(limit = 10) {
    return this.playerRepository
      .createQueryBuilder('p')
      .select('p.time', 'time')
      .addSelect('p.liga', 'liga')
      .addSelect('SUM(p.cartoesamarelos)', 'total_amarelos')
      .addSelect('SUM(p.cartoesvermelhos)', 'total_vermelhos')
      .groupBy('p.time')
      .addGroupBy('p.liga')
      .orderBy('SUM(p.cartoesamarelos)', 'DESC')
      .take(limit)
      .getRawMany();
  }

  async getTopScoringTeams(limit = 10) {
    return this.playerRepository
      .createQueryBuilder('p')
      .select('p.time', 'time')
      .addSelect('p.liga', 'liga')
      .addSelect('SUM(p.gols)', 'total_gols')
      .addSelect('SUM(p.assistencias)', 'total_assistencias')
      .groupBy('p.time')
      .addGroupBy('p.liga')
      .orderBy('SUM(p.gols)', 'DESC')
      .take(limit)
      .getRawMany();
  }
}
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

  async getTeamStats(squad: string) {
    return this.playerRepository
      .createQueryBuilder('p')
      .select('p.squad', 'squad')
      .addSelect('p.comp', 'comp')
      .addSelect('SUM(p.gls)', 'total_gols')
      .addSelect('SUM(p.ast)', 'total_assistencias')
      .addSelect('SUM(p.crdy)', 'total_amarelos')
      .addSelect('SUM(p.crdr)', 'total_vermelhos')
      .where('p.squad = :squad', { squad })
      .getRawOne();
  }

  async getMostAggressiveTeams(limit = 10) {
    return this.playerRepository
      .createQueryBuilder('p')
      .select('p.squad', 'squad')
      .addSelect('p.comp', 'comp')
      .addSelect('SUM(p.crdy)', 'total_amarelos')
      .addSelect('SUM(p.crdr)', 'total_vermelhos')
      .groupBy('p.squad')
      .addGroupBy('p.comp')
      .orderBy('SUM(p.crdy)', 'DESC')
      .take(limit)
      .getRawMany();
  }

  async getTopScoringTeams(limit = 10) {
    return this.playerRepository
      .createQueryBuilder('p')
      .select('p.squad', 'squad')
      .addSelect('p.comp', 'comp')
      .addSelect('SUM(p.gls)', 'total_gols')
      .addSelect('SUM(p.ast)', 'total_assistencias')
      .groupBy('p.squad')
      .addGroupBy('p.comp')
      .orderBy('SUM(p.gls)', 'DESC')
      .take(limit)
      .getRawMany();
  }
}
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './player.entity';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
  ) {}

  async findAll() {
    return this.playerRepository.find();
  }

  async topScorers(limit = 10) {
    return this.playerRepository.find({
      order: { gols: 'DESC' },
      take: limit,
    });
  }

  async findByTime(time: string) {
    return this.playerRepository.find({
      where: { time },
      order: { gols: 'DESC' },
    });
  }

  async findByNome(nomeJogador: string) {
    return this.playerRepository.findOne({
      where: { nomeJogador },
    });
  }

  async findByLiga(liga: string) {
    return this.playerRepository.find({
      where: { liga },
      order: { gols: 'DESC' },
    });
  }

  async maisPerigosos(limit = 10) {
    return this.playerRepository
      .createQueryBuilder('p')
      .where('p.gols IS NOT NULL')
      .andWhere('p.assistencias IS NOT NULL')
      .orderBy('p.gols + p.assistencias', 'DESC')
      .take(limit)
      .getMany();
  }

  async maisCartoes(limit = 10) {
    return this.playerRepository
      .createQueryBuilder('p')
      .where('p.cartoesAmarelos IS NOT NULL')
      .orderBy('p.cartoesAmarelos', 'DESC')
      .take(limit)
      .getMany();
  }

  async maisEficientes(limit = 10) {
    return this.playerRepository
      .createQueryBuilder('p')
      .where('p.golsPorChute IS NOT NULL')
      .andWhere('p.chutesTotais >= 20')
      .orderBy('p.golsPorChute', 'DESC')
      .take(limit)
      .getMany();
  }
}
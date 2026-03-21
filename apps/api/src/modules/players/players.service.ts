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
    return this.playerRepository.find({
      order: { goals: 'DESC' },
    });
  }

  async findBySquad(squad: string) {
    return this.playerRepository.find({
      where: { squad },
      order: { goals: 'DESC' },
    });
  }

  async findByName(name: string) {
    return this.playerRepository.findOne({
      where: { name },
    });
  }

  async topScorers(limit = 10) {
    return this.playerRepository.find({
      order: { goals: 'DESC' },
      take: limit,
    });
  }

  async bulkCreate(data: Partial<Player>[]) {
    const players = this.playerRepository.create(data);
    return this.playerRepository.save(players);
  }
}
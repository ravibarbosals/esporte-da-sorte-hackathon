import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './teams.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
  ) {}

  async findAll() {
    return this.teamRepository.find({
      order: { total_yellow_cards: 'DESC' },
    });
  }

  async findByName(name: string) {
    return this.teamRepository.findOne({
      where: { name },
    });
  }

  async findByComp(comp: string) {
    return this.teamRepository.find({
      where: { comp },
      order: { avg_goals: 'DESC' },
    });
  }

  async bulkCreate(data: Partial<Team>[]) {
    const teams = this.teamRepository.create(data);
    return this.teamRepository.save(teams);
  }
}
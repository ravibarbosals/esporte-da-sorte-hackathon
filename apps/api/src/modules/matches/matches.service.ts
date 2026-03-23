import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './matches.entity';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
  ) {}

  async findAll() {
    return this.matchRepository.find({
      order: { match_time: 'DESC' },
    });
  }

  async findByLeague(league_name: string) {
    return this.matchRepository.find({
      where: { league_name },
      order: { match_time: 'DESC' },
    });
  }

  async findByTeam(team: string) {
    return this.matchRepository.find({
      where: [{ home_team: team }, { away_team: team }],
      order: { match_time: 'DESC' },
    });
  }

  async findUpcoming() {
    return this.matchRepository.find({
      where: { time_status: '0' },
      order: { match_time: 'ASC' },
    });
  }

  async findLive() {
    return this.matchRepository.find({
      where: { time_status: '1' },
    });
  }

  async findEnded() {
    return this.matchRepository.find({
      where: { time_status: '2' },
      order: { match_time: 'DESC' },
    });
  }

  async findByExternalId(external_id: string) {
    return this.matchRepository.findOne({
      where: { external_id },
    });
  }

  async bulkUpsert(data: Partial<Match>[]) {
    return this.matchRepository.save(data, { chunk: 50 });
  }
}

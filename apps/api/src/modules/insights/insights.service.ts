import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Insight } from './insights.entity';

@Injectable()
export class InsightsService {
  constructor(
    @InjectRepository(Insight)
    private insightRepository: Repository<Insight>,
  ) {}

  async findAll() {
    return this.insightRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findByType(type: string) {
    return this.insightRepository.find({
      where: { type },
      order: { created_at: 'DESC' },
    });
  }

  async create(data: Partial<Insight>) {
    const insight = this.insightRepository.create(data);
    return this.insightRepository.save(insight);
  }

  async bulkCreate(data: Partial<Insight>[]) {
    const insights = this.insightRepository.create(data);
    return this.insightRepository.save(insights);
  }
}
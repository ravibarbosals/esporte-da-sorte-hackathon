import { Injectable, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Odds } from './odds.entity';

@Injectable()
export class OddsService {
  constructor(
    @InjectRepository(Odds)
    private oddRepository: Repository<Odds>,
  ) {}

  async findAll(@Query('limit') limit = 50): Promise<Odds[]> {
    return this.oddRepository.find({
      order: { registradoEm: 'DESC' },
      take: limit,
    });
  }

  async findByEvent(fi: string) {
    return this.oddRepository.find({
      where: { fi },
      order: { registradoEm: 'DESC' },
    });
  }

  async findLatest(fi: string) {
    return this.oddRepository.findOne({
      where: { fi },
      order: { registradoEm: 'DESC' },
    });
  }

  async findRecent(limit: number) {
    return this.oddRepository.find({
      order: { registradoEm: 'DESC' },
      take: limit,
    });
  }

  async findByLiga(liga: string) {
    return this.oddRepository.find({
      where: { liga },
      order: { registradoEm: 'DESC' },
      take: 20,
    });
  }

  async findByTeam(team: string) {
    return this.oddRepository.find({
      where: [{ timeCasa: team }, { timeVisitante: team }],
      order: { registradoEm: 'DESC' },
      take: 20,
    });
  }

  async findMovements(fi: string) {
    const odds = await this.oddRepository.find({
      where: { fi },
      order: { registradoEm: 'ASC' },
    });

    if (odds.length < 2) return { movimento: 'sem dados suficientes', odds };

    const primeira = odds[0];
    const ultima = odds[odds.length - 1];

    const variacaoCasa = (((ultima.oddCasa - primeira.oddCasa) / primeira.oddCasa) * 100).toFixed(
      1,
    );
    const variacaoVisitante = (
      ((ultima.oddVisitante - primeira.oddVisitante) / primeira.oddVisitante) *
      100
    ).toFixed(1);

    return {
      timeCasa: ultima.timeCasa,
      timeVisitante: ultima.timeVisitante,
      variacaoCasa: `${variacaoCasa}%`,
      variacaoVisitante: `${variacaoVisitante}%`,
      oddCasaInicial: primeira.oddCasa,
      oddCasaAtual: ultima.oddCasa,
      oddVisitanteInicial: primeira.oddVisitante,
      oddVisitanteAtual: ultima.oddVisitante,
      historico: odds,
    };
  }

  parsearOdds(rawData: any, matchData: any) {
    const main = rawData?.schedule?.sp?.main || [];
    return {
      fi: rawData.FI,
      eventId: rawData.event_id,
      timeCasa: matchData?.home?.name,
      timeVisitante: matchData?.away?.name,
      liga: matchData?.league?.name,
      horario: matchData?.time,
      status: matchData?.time_status,
      oddCasa: parseFloat(main[0]?.odds) || null,
      oddEmpate: parseFloat(main[1]?.odds) || null,
      oddVisitante: parseFloat(main[2]?.odds) || null,
      oddsRaw: rawData,
    };
  }

  async bulkUpsert(data: Partial<Odds>[]) {
    return this.oddRepository.save(data, { chunk: 50 });
  }
}

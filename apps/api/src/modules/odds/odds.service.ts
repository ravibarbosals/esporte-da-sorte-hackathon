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

    const variacaoCasa = (
      ((ultima.oddsCasa - primeira.oddsCasa) / primeira.oddsCasa) *
      100
    ).toFixed(1);
    const variacaoVisitante = (
      ((ultima.oddsVisitante - primeira.oddsVisitante) / primeira.oddsVisitante) *
      100
    ).toFixed(1);

    return {
      timeCasa: ultima.timeCasa,
      timeVisitante: ultima.timeVisitante,
      variacaoCasa: `${variacaoCasa}%`,
      variacaoVisitante: `${variacaoVisitante}%`,
      oddsCasaInicial: primeira.oddsCasa,
      oddsCasaAtual: ultima.oddsCasa,
      oddsVisitanteInicial: primeira.oddsVisitante,
      oddsVisitanteAtual: ultima.oddsVisitante,
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
      oddsCasa: parseFloat(main[0]?.odds) || null,
      oddsEmpate: parseFloat(main[1]?.odds) || null,
      oddsVisitante: parseFloat(main[2]?.odds) || null,
      oddsRaw: rawData,
    };
  }

  async bulkUpsert(data: Partial<Odds>[]) {
    const mergedByEvent = new Map<string, Partial<Odds>>();

    const asCleanId = (value: unknown): string => String(value ?? '').trim();
    const asValidOdd = (value: unknown): number | null => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed <= 1 || parsed > 1000) {
        return null;
      }
      return parsed;
    };

    for (const row of data) {
      const fi = asCleanId(row.fi);
      const eventId = asCleanId(row.eventId);

      if (!fi && !eventId) {
        continue;
      }

      const normalizedRow: Partial<Odds> = {
        ...row,
        fi: fi || undefined,
        eventId: eventId || undefined,
        oddsCasa: asValidOdd(row.oddsCasa) ?? undefined,
        oddsEmpate: asValidOdd(row.oddsEmpate) ?? undefined,
        oddsVisitante: asValidOdd(row.oddsVisitante) ?? undefined,
      };

      // Precedencia: fi (bet365_id) > eventId (external_id).
      const fallbackKey = `${fi}:${eventId}:${asCleanId(row.horario)}:${asCleanId(row.status)}`;
      const key =
        fi.length > 0
          ? `fi:${fi}`
          : eventId.length > 0
            ? `event:${eventId}`
            : `fallback:${fallbackKey}`;
      mergedByEvent.set(key, normalizedRow);
    }

    const deduped = Array.from(mergedByEvent.values());

    return this.oddRepository.upsert(deduped, {
      conflictPaths: ['fi', 'horario', 'status'],
      skipUpdateIfNoValuesChanged: true,
    });
  }
}

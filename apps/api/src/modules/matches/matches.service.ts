import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Match } from './matches.entity';

@Injectable()
export class MatchesService {
  private pythonApiUrl: string;

  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    private readonly configService: ConfigService,
  ) {
    this.pythonApiUrl = this.configService.get('PYTHON_API_URL', 'http://localhost:8000');
  }

  private parseScore(score?: string | null) {
    if (!score || !score.includes('-')) {
      return { home: 0, away: 0 };
    }

    const [homeRaw, awayRaw] = score.split('-');
    const home = Number(homeRaw?.trim());
    const away = Number(awayRaw?.trim());

    return {
      home: Number.isFinite(home) ? home : 0,
      away: Number.isFinite(away) ? away : 0,
    };
  }

  private deriveMinute(raw?: string | null) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
    return 0;
  }

  private async tryFetchPython(path: string) {
    try {
      const { data } = await axios.get(`${this.pythonApiUrl}${path}`);
      return data;
    } catch {
      return null;
    }
  }

  private async fetchPython(path: string) {
    try {
      const { data } = await axios.get(`${this.pythonApiUrl}${path}`);
      return data;
    } catch {
      throw new HttpException('Erro ao buscar replay no servico Python', HttpStatus.BAD_GATEWAY);
    }
  }

  private hasLiveMatches(payload: any): boolean {
    return Array.isArray(payload?.matches) && payload.matches.length > 0;
  }

  private mapDbLiveToEnvelope(matches: Match[]) {
    return {
      source: 'fallback',
      updatedAt: new Date().toISOString(),
      minute: 0,
      matches: matches.map((m) => {
        const score = this.parseScore(m.score);
        return {
          id: String(m.external_id),
          source: 'fallback',
          status: m.time_status === '1' ? 'live' : 'unknown',
          competition: m.league_name ?? 'Liga',
          matchDate: m.match_time ?? '',
          kickoff: m.match_time ?? 'Ao vivo',
          minute: this.deriveMinute(m.match_time),
          homeTeam: m.home_team,
          awayTeam: m.away_team,
          score,
          updatedAt: new Date().toISOString(),
          miniInsight: `${m.home_team} x ${m.away_team} em fallback local.`,
        };
      }),
    };
  }

  private mapDbMatchToDetail(match: Match) {
    const score = this.parseScore(match.score);

    return {
      id: String(match.external_id),
      source: 'fallback',
      competition: {
        id: match.league_id ?? null,
        name: match.league_name ?? 'Liga',
        season: 'Atual',
      },
      homeTeam: {
        id: match.home_team_external_id ?? null,
        name: match.home_team,
      },
      awayTeam: {
        id: match.away_team_external_id ?? null,
        name: match.away_team,
      },
      scheduled: {
        date: null,
        kickoff: match.match_time ?? 'Ao vivo',
      },
      context: {
        source: 'fallback',
        status: match.time_status === '1' ? 'live' : 'unknown',
        updatedAt: new Date().toISOString(),
      },
      state: {
        minute: this.deriveMinute(match.match_time),
        home: {
          goals: score.home,
          xg: 0,
          shots: 0,
          shotsOnTarget: 0,
          yellowCards: 0,
        },
        away: {
          goals: score.away,
          xg: 0,
          shots: 0,
          shotsOnTarget: 0,
          yellowCards: 0,
        },
        recentEvents: [`${match.home_team} x ${match.away_team} em fallback local.`],
        miniInsight:
          'Leitura resumida por fallback local enquanto fontes externas estao indisponiveis.',
      },
    };
  }

  private fallbackPredictions(match?: Match) {
    const oddsHome = Number(match?.home_odds ?? 0);
    const oddsDraw = Number(match?.draw_odds ?? 0);
    const oddsAway = Number(match?.away_odds ?? 0);

    const invHome = oddsHome > 1 ? 1 / oddsHome : 0;
    const invDraw = oddsDraw > 1 ? 1 / oddsDraw : 0;
    const invAway = oddsAway > 1 ? 1 / oddsAway : 0;
    const total = invHome + invDraw + invAway;

    const home = total > 0 ? Math.round((invHome / total) * 100) : 34;
    const draw = total > 0 ? Math.round((invDraw / total) * 100) : 33;
    const away = total > 0 ? Math.round((invAway / total) * 100) : 33;

    return {
      source: 'fallback',
      updatedAt: new Date().toISOString(),
      winnerProbability: {
        probability: { home, draw, away },
        confidence: 0.45,
        trend: 'estavel',
        explanation: 'Leitura fallback baseada nas odds disponiveis localmente.',
        factors: [
          { name: 'odds_home', value: oddsHome || null },
          { name: 'odds_draw', value: oddsDraw || null },
          { name: 'odds_away', value: oddsAway || null },
        ],
      },
      nextGoalProbability: {
        probability: {
          home: Math.max(0, home - 5),
          away: Math.max(0, away - 5),
          none: Math.max(5, 110 - (home + away)),
        },
        trend: 'estavel',
        explanation: 'Sem feed ao vivo completo, leitura de proximo gol esta conservadora.',
      },
      cardRisk: {
        probability: { total: 35 },
        trend: 'estavel',
        explanation: 'Risco disciplinar estimado em fallback.',
        factors: [{ name: 'fallback_mode', value: 1 }],
      },
      comebackChance: {
        probability: 25,
        trend: 'estavel',
        team: match?.away_team ?? 'visitante',
        explanation: 'Chance de reacao estimada sem telemetria de eventos ao vivo.',
      },
      penaltyRisk: {
        probability: 14,
        trend: 'estavel',
        explanation: 'Probabilidade de penalti calculada em modo seguro.',
        factors: [{ name: 'fallback_mode', value: 1 }],
      },
    };
  }

  private fallbackMomentum(match?: Match) {
    const score = this.parseScore(match?.score ?? null);
    const diff = score.home - score.away;
    const home = Math.max(0, Math.min(100, 50 + diff * 12));
    const away = 100 - home;

    return {
      source: 'fallback',
      updatedAt: new Date().toISOString(),
      minute: this.deriveMinute(match?.match_time),
      homeTeam: match?.home_team ?? 'Time da casa',
      awayTeam: match?.away_team ?? 'Time visitante',
      homeMomentum: home,
      awayMomentum: away,
      trend: home >= away ? 'home_up' : 'away_up',
      summary: 'Momentum estimado por fallback local sem feed completo de eventos ao vivo.',
    };
  }

  async getLiveReplay(minute = 67) {
    const betsapi = await this.tryFetchPython('/betsapi/matches/live?limit=8');
    if (this.hasLiveMatches(betsapi)) {
      return betsapi;
    }

    const statsbomb = await this.tryFetchPython(`/statsbomb/matches/live?minute=${minute}&limit=3`);
    if (this.hasLiveMatches(statsbomb)) {
      return {
        ...statsbomb,
        source: 'statsbomb-replay',
        mode: 'replay',
        updatedAt: new Date().toISOString(),
      };
    }

    const localLive = await this.findLive();
    return this.mapDbLiveToEnvelope(localLive);
  }

  async getReplayMatch(matchId: string, minute = 67) {
    const betsapi = await this.tryFetchPython(`/betsapi/matches/${matchId}`);
    if (betsapi?.homeTeam && betsapi?.awayTeam) {
      return betsapi;
    }

    const statsbomb = await this.tryFetchPython(`/statsbomb/matches/${matchId}?minute=${minute}`);
    if (statsbomb?.homeTeam && statsbomb?.awayTeam) {
      return {
        ...statsbomb,
        source: 'statsbomb-replay',
        mode: 'replay',
        updatedAt: new Date().toISOString(),
      };
    }

    const localMatch = await this.findByExternalId(matchId);
    if (!localMatch) {
      throw new HttpException('Partida nao encontrada', HttpStatus.NOT_FOUND);
    }

    return this.mapDbMatchToDetail(localMatch);
  }

  async getReplayTimeline(matchId: string, minute = 67) {
    const betsapi = await this.tryFetchPython(`/betsapi/matches/${matchId}/timeline`);
    if (Array.isArray(betsapi?.events) && betsapi.events.length > 0) {
      return betsapi;
    }

    const statsbomb = await this.tryFetchPython(
      `/statsbomb/matches/${matchId}/timeline?minute=${minute}`,
    );
    if (Array.isArray(statsbomb?.events)) {
      return {
        ...statsbomb,
        source: 'statsbomb-replay',
        mode: 'replay',
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      source: 'fallback',
      updatedAt: new Date().toISOString(),
      matchId,
      minute: 0,
      events: [],
    };
  }

  async getReplayMomentum(matchId: string, minute = 67) {
    const betsapi = await this.tryFetchPython(`/betsapi/matches/${matchId}/momentum`);
    if (typeof betsapi?.homeMomentum === 'number' && typeof betsapi?.awayMomentum === 'number') {
      return betsapi;
    }

    const statsbomb = await this.tryFetchPython(
      `/statsbomb/matches/${matchId}/momentum?minute=${minute}`,
    );
    if (
      typeof statsbomb?.homeMomentum === 'number' &&
      typeof statsbomb?.awayMomentum === 'number'
    ) {
      return {
        ...statsbomb,
        source: 'statsbomb-replay',
        mode: 'replay',
        updatedAt: new Date().toISOString(),
      };
    }

    const localMatch = await this.findByExternalId(matchId);
    return this.fallbackMomentum(localMatch ?? undefined);
  }

  async getReplayPredictions(matchId: string, minute = 67) {
    const betsapi = await this.tryFetchPython(`/betsapi/matches/${matchId}/predictions`);
    if (betsapi?.winnerProbability?.probability) {
      return betsapi;
    }

    const statsbomb = await this.tryFetchPython(
      `/statsbomb/matches/${matchId}/predictions?minute=${minute}`,
    );
    if (statsbomb?.winnerProbability?.probability) {
      return {
        ...statsbomb,
        source: 'statsbomb-replay',
        mode: 'replay',
        updatedAt: new Date().toISOString(),
      };
    }

    const localMatch = await this.findByExternalId(matchId);
    return this.fallbackPredictions(localMatch ?? undefined);
  }

  async getReplayPreMatch(matchId: string) {
    return this.fetchPython(`/statsbomb/matches/${matchId}/pre-match`);
  }

  async getReplayKeyPlayers(matchId: string) {
    return this.fetchPython(`/statsbomb/matches/${matchId}/key-players`);
  }

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
    return this.matchRepository.upsert(data, {
      conflictPaths: ['external_id'],
      skipUpdateIfNoValuesChanged: true,
    });
  }

  async updateOdds(
    externalId: string,
    odds: { home_odds: number; draw_odds: number; away_odds: number },
  ) {
    return this.matchRepository.update({ external_id: externalId }, odds);
  }

  async cleanupEsoccer() {
    return this.matchRepository
      .createQueryBuilder()
      .delete()
      .where('league_name ILIKE :esoccer', { esoccer: '%esoccer%' })
      .orWhere('league_name ILIKE :esports', { esports: '%esports%' })
      .execute();
  }
}

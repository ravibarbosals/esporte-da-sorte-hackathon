import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Match } from './matches.entity';

@Injectable()
export class MatchesService {
  private pythonApiUrl: string;
  private readonly pythonTimeoutMs: number;
  private readonly allowedLeagueSignals = [
    'copa do mundo',
    'world cup',
    'fifa world cup',
    'copa argentina',
    'copa do nordeste superbet',
    'copa do nordeste',
    'laliga2',
    'laliga 2',
    'la liga 2',
    'laliga hypermotion',
  ];

  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    private readonly configService: ConfigService,
  ) {
    this.pythonApiUrl = this.configService.get('PYTHON_API_URL', 'http://localhost:8000');

    const configuredTimeout = Number(this.configService.get('PYTHON_TIMEOUT_MS', 15000));
    this.pythonTimeoutMs =
      Number.isFinite(configuredTimeout) && configuredTimeout >= 1000 ? configuredTimeout : 15000;
  }

  private isExpectedStatsbombNotFound(path: string, status: number): boolean {
    if (status !== 404) {
      return false;
    }

    return (
      /^\/statsbomb\/matches\/[^/]+\/pre-match$/.test(path) ||
      /^\/statsbomb\/matches\/[^/]+\/momentum(\?.*)?$/.test(path)
    );
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

  private normalizeLeagueName(value: unknown): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private isEsoccerLeague(value: unknown): boolean {
    const league = this.normalizeLeagueName(value);
    return (
      league.includes('esoccer') ||
      league.includes('e-soccer') ||
      league.includes('esports') ||
      league.includes('e-sports')
    );
  }

  private isAllowedLeague(value: unknown): boolean {
    const league = this.normalizeLeagueName(value);

    if (!league || this.isEsoccerLeague(league)) {
      return false;
    }

    return this.allowedLeagueSignals.some((signal) => league.includes(signal));
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
      const { data } = await axios.get(`${this.pythonApiUrl}${path}`, {
        timeout: this.pythonTimeoutMs,
      });

      if (!data || typeof data !== 'object') {
        console.warn(`[matches] payload invalido de ${path}`);
        return null;
      }

      return data;
    } catch (error: any) {
      const code = error?.code ?? 'unknown';
      const status = error?.response?.status ?? 'no-status';

      if (this.isExpectedStatsbombNotFound(path, Number(status))) {
        console.info(`[matches] fallback esperado: sem replay para ${path}`);
        return null;
      }

      console.warn(`[matches] falha python ${path} code=${code} status=${status}`);
      return null;
    }
  }

  private async fetchPython(path: string) {
    try {
      const { data } = await axios.get(`${this.pythonApiUrl}${path}`, {
        timeout: this.pythonTimeoutMs,
      });

      if (!data || typeof data !== 'object') {
        throw new HttpException('Payload invalido do servico Python', HttpStatus.BAD_GATEWAY);
      }

      return data;
    } catch (error: any) {
      const code = error?.code ?? 'unknown';
      const status = error?.response?.status ?? 'no-status';
      console.warn(`[matches] erro python ${path} code=${code} status=${status}`);
      throw new HttpException('Erro ao buscar replay no servico Python', HttpStatus.BAD_GATEWAY);
    }
  }

  private hasLiveMatches(payload: any): boolean {
    return (
      Array.isArray(payload?.matches) &&
      payload.matches.some((item: any) => this.isValidLiveItem(item))
    );
  }

  private safeText(value: unknown, fallback: string): string {
    const parsed = String(value ?? '').trim();
    return parsed.length > 0 ? parsed : fallback;
  }

  private safeNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private parseOdds(raw: any, fallbackSource: string, updatedAt: string) {
    const direct = raw?.odds ?? {};
    const home = this.safeNumber(direct?.homeOdds ?? direct?.home ?? raw?.home_odds, 0);
    const draw = this.safeNumber(direct?.drawOdds ?? direct?.draw ?? raw?.draw_odds, 0);
    const away = this.safeNumber(direct?.awayOdds ?? direct?.away ?? raw?.away_odds, 0);

    if (home > 1 && draw > 1 && away > 1) {
      return {
        homeOdds: home,
        drawOdds: draw,
        awayOdds: away,
        market: this.safeText(direct?.market ?? raw?.market, '1x2'),
        source: this.safeText(direct?.source ?? raw?.source, fallbackSource),
        bookmaker: this.safeText(direct?.bookmaker ?? raw?.bookmaker, ''),
        updatedAt: this.safeText(direct?.updatedAt ?? raw?.updatedAt, updatedAt),
      };
    }

    return undefined;
  }

  private isValidLiveItem(item: any): boolean {
    if (!item || typeof item !== 'object') {
      return false;
    }

    const id = this.safeText(item.id, '');
    const home = this.safeText(item.homeTeam, '');
    const away = this.safeText(item.awayTeam, '');

    return Boolean(id && home && away);
  }

  private normalizeSource(value: unknown, fallback: string): string {
    const signal = String(value ?? '')
      .trim()
      .toLowerCase();

    if (signal === 'betsapi' || signal === 'statsbomb-replay' || signal === 'fallback') {
      return signal;
    }

    return fallback;
  }

  private normalizeMode(value: unknown, fallback: string): string {
    const signal = String(value ?? '')
      .trim()
      .toLowerCase();

    if (signal === 'live' || signal === 'replay' || signal === 'fallback') {
      return signal;
    }

    return fallback;
  }

  private extractTeamName(value: unknown, fallback: string): string {
    if (typeof value === 'string') {
      return this.safeText(value, fallback);
    }

    if (value && typeof value === 'object') {
      return this.safeText((value as any)?.name, fallback);
    }

    return fallback;
  }

  private buildDetailMeta(
    matchId: string,
    payload: any,
    options: {
      sourceFallback: string;
      modeFallback: string;
      statusFallback: string;
      minuteFallback: number;
      homeTeamFallback?: string;
      awayTeamFallback?: string;
    },
  ) {
    const source = this.normalizeSource(payload?.source, options.sourceFallback);
    const mode = this.normalizeMode(payload?.mode, options.modeFallback);
    const updatedAt = this.safeText(payload?.updatedAt, new Date().toISOString());

    return {
      matchId: this.safeText(payload?.matchId ?? payload?.id, matchId),
      source,
      mode,
      status: this.safeText(payload?.status, options.statusFallback),
      updatedAt,
      minute: Math.max(0, this.safeNumber(payload?.minute, options.minuteFallback)),
      homeTeam: this.extractTeamName(
        payload?.homeTeam ?? payload?.home_team,
        options.homeTeamFallback ?? 'Time da casa',
      ),
      awayTeam: this.extractTeamName(
        payload?.awayTeam ?? payload?.away_team,
        options.awayTeamFallback ?? 'Time visitante',
      ),
    };
  }

  private normalizeLiveItem(item: any, source: string, updatedAt: string) {
    const phase = this.normalizePhase(item?.phase ?? item?.status);
    const is_live = this.normalizeIsLive(item?.is_live) || phase === 'live';
    const competition = this.safeText(item?.competition, 'Liga');

    if (!this.isAllowedLeague(competition)) {
      return null;
    }

    const score = {
      home: Math.max(0, this.safeNumber(item?.score?.home, 0)),
      away: Math.max(0, this.safeNumber(item?.score?.away, 0)),
    };

    const normalized = {
      ...item,
      id: this.safeText(item?.id, ''),
      phase,
      is_live,
      status: this.safeText(item?.status, phase),
      source: this.normalizeSource(item?.source, source),
      competition,
      matchDate: this.safeText(item?.matchDate, ''),
      kickoff: this.safeText(item?.kickoff, 'Ao vivo'),
      minute: Math.max(0, this.safeNumber(item?.minute, 0)),
      homeTeam: this.safeText(item?.homeTeam, 'Time da casa'),
      awayTeam: this.safeText(item?.awayTeam, 'Time visitante'),
      score,
      odds: this.parseOdds(item, source, updatedAt),
      updatedAt: this.safeText(item?.updatedAt, updatedAt),
      last_synced_at: this.safeText(item?.last_synced_at, updatedAt),
      miniInsight: this.safeText(item?.miniInsight, 'Leitura em modo resiliente.'),
    };

    return this.isValidLiveItem(normalized) ? normalized : null;
  }

  private normalizeReplayDetail(payload: any, sourceFallback: string, statusFallback: string) {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const homeTeam = payload?.homeTeam;
    const awayTeam = payload?.awayTeam;

    if (!homeTeam || !awayTeam) {
      return null;
    }

    const phase = this.normalizePhase(
      payload?.phase ?? payload?.context?.status ?? payload?.status,
    );
    const status = this.safeText(payload?.status ?? payload?.context?.status, statusFallback);
    const updatedAt = new Date().toISOString();

    return {
      ...payload,
      source: this.normalizeSource(payload?.source, sourceFallback),
      phase,
      is_live: this.normalizeIsLive(payload?.is_live) || phase === 'live',
      status,
      updatedAt: this.safeText(payload?.updatedAt, updatedAt),
      last_synced_at: this.safeText(payload?.last_synced_at, updatedAt),
    };
  }

  private hasValidProbabilities(payload: any): boolean {
    const p = payload?.winnerProbability?.probability;
    if (!p || typeof p !== 'object') {
      return false;
    }

    const home = this.safeNumber(p.home, -1);
    const draw = this.safeNumber(p.draw, -1);
    const away = this.safeNumber(p.away, -1);

    return home >= 0 && draw >= 0 && away >= 0;
  }

  private normalizePhase(value: unknown): 'live' | 'upcoming' | 'finished' {
    const signal = String(value ?? '')
      .trim()
      .toLowerCase();
    if (signal === 'live' || signal === 'inplay' || signal === 'replay_live') {
      return 'live';
    }
    if (signal === 'finished' || signal === 'ended') {
      return 'finished';
    }
    return 'upcoming';
  }

  private normalizeIsLive(value: unknown): boolean {
    return (
      value === true || value === 1 || value === '1' || String(value ?? '').toLowerCase() === 'true'
    );
  }

  private enrichLiveEnvelope(payload: any, fallbackSource: string) {
    const updatedAt = new Date().toISOString();
    const source = this.normalizeSource(payload?.source, fallbackSource);
    const items = Array.isArray(payload?.matches) ? payload.matches : [];
    const normalizedMatches = items
      .map((item: any) => this.normalizeLiveItem(item, source, updatedAt))
      .filter((item: any) => Boolean(item));

    return {
      ...(payload ?? {}),
      source,
      updatedAt: payload?.updatedAt ?? updatedAt,
      matches: normalizedMatches,
    };
  }

  private mapDbLiveToEnvelope(matches: Match[]) {
    const filteredMatches = matches.filter((m) => this.isAllowedLeague(m.league_name));

    return {
      source: 'fallback',
      updatedAt: new Date().toISOString(),
      minute: 0,
      matches: filteredMatches.map((m) => {
        const score = this.parseScore(m.score);
        return {
          id: String(m.external_id),
          source: 'fallback',
          status: m.phase === 'live' || m.is_live ? 'live' : (m.phase ?? 'unknown'),
          phase: m.phase ?? 'upcoming',
          is_live: m.is_live,
          competition: m.league_name ?? 'Liga',
          matchDate: m.match_time ?? '',
          kickoff: m.match_time ?? 'Ao vivo',
          minute: this.deriveMinute(m.match_time),
          homeTeam: m.home_team,
          awayTeam: m.away_team,
          score,
          odds: this.parseOdds(
            {
              home_odds: m.home_odds,
              draw_odds: m.draw_odds,
              away_odds: m.away_odds,
              source: 'fallback',
              market: '1x2',
              bookmaker: 'local-db',
            },
            'fallback',
            new Date().toISOString(),
          ),
          updatedAt: new Date().toISOString(),
          last_synced_at: m.last_synced_at?.toISOString?.() ?? null,
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
      phase: match.phase ?? 'upcoming',
      is_live: match.is_live,
      status: match.phase === 'live' || match.is_live ? 'live' : (match.phase ?? 'upcoming'),
      updatedAt: new Date().toISOString(),
      last_synced_at: match.last_synced_at?.toISOString?.() ?? null,
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
        phase: match.phase ?? 'upcoming',
        is_live: match.is_live,
        status: match.phase === 'live' || match.is_live ? 'live' : (match.phase ?? 'unknown'),
        updatedAt: new Date().toISOString(),
        last_synced_at: match.last_synced_at?.toISOString?.() ?? null,
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

  async getReplayMatch(matchId: string, minute = 67) {
    const betsapi = await this.tryFetchPython(`/betsapi/matches/${matchId}`);
    const betsapiNormalized = this.normalizeReplayDetail(betsapi, 'betsapi', 'live');
    if (betsapiNormalized) {
      return betsapiNormalized;
    }

    const statsbomb = await this.tryFetchPython(`/statsbomb/matches/${matchId}?minute=${minute}`);
    const statsbombNormalized = this.normalizeReplayDetail(
      { ...statsbomb, mode: 'replay' },
      'statsbomb-replay',
      'replay_live',
    );
    if (statsbombNormalized) {
      return statsbombNormalized;
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
      return {
        ...betsapi,
        source: this.normalizeSource(betsapi?.source, 'betsapi'),
        status: this.safeText(betsapi?.status, 'live'),
        minute: Math.max(0, this.safeNumber(betsapi?.minute, 0)),
        updatedAt: this.safeText(betsapi?.updatedAt, new Date().toISOString()),
      };
    }

    const statsbomb = await this.tryFetchPython(
      `/statsbomb/matches/${matchId}/timeline?minute=${minute}`,
    );
    if (Array.isArray(statsbomb?.events)) {
      return {
        ...statsbomb,
        source: 'statsbomb-replay',
        status: this.safeText(statsbomb?.status, 'replay_live'),
        minute: Math.max(0, this.safeNumber(statsbomb?.minute, minute)),
        mode: 'replay',
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      source: 'fallback',
      status: 'unavailable',
      updatedAt: new Date().toISOString(),
      matchId,
      minute: 0,
      events: [],
    };
  }

  async findAll() {
    const matches = await this.matchRepository.find({
      order: { match_time: 'DESC' },
    });

    return matches.filter((m) => this.isAllowedLeague(m.league_name));
  }

  async findByLeague(league_name: string) {
    if (!this.isAllowedLeague(league_name)) {
      return [];
    }

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
    const matches = await this.matchRepository.find({
      where: { phase: 'upcoming' },
      order: { match_time: 'ASC' },
    });

    return matches.filter((m) => this.isAllowedLeague(m.league_name));
  }

  async findLive() {
    const matches = await this.matchRepository.find({
      where: { phase: 'live', is_live: true },
    });

    return matches.filter((m) => this.isAllowedLeague(m.league_name));
  }

  async findEnded() {
    const matches = await this.matchRepository.find({
      where: { phase: 'finished' },
      order: { match_time: 'DESC' },
    });

    return matches.filter((m) => this.isAllowedLeague(m.league_name));
  }

  async markStaleLiveAsFinished(
    liveExternalIds: string[],
    options?: { reliableSnapshot?: boolean; graceMinutes?: number },
  ) {
    if (!options?.reliableSnapshot) {
      return;
    }

    const stale = await this.matchRepository.find({
      where: { phase: 'live', is_live: true },
      select: ['external_id', 'last_synced_at'],
    });

    if (stale.length === 0) {
      return;
    }

    const liveSet = new Set(liveExternalIds.map((id) => String(id)));
    const now = Date.now();
    const graceMs = Math.max(1, options?.graceMinutes ?? 15) * 60 * 1000;
    const staleIds = stale
      .filter((m) => {
        const id = String(m.external_id ?? '');
        if (!id || liveSet.has(id)) {
          return false;
        }

        const syncedAt = m.last_synced_at ? new Date(m.last_synced_at).getTime() : 0;
        return !syncedAt || now - syncedAt >= graceMs;
      })
      .map((m) => String(m.external_id));

    if (staleIds.length === 0) {
      return;
    }

    for (const externalId of staleIds) {
      await this.matchRepository.update(
        { external_id: externalId },
        {
          phase: 'finished',
          is_live: false,
          status: 'finished',
          time_status: '2',
          last_synced_at: new Date(),
        },
      );
    }
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

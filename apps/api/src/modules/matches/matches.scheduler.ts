import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MatchesService } from './matches.service';
import { OddsService } from '../odds/odds.service';
import { Odds } from '../odds/odds.entity';
import { ConfigService } from '@nestjs/config';

type MatchPhase = 'live' | 'upcoming' | 'finished';

type MatchClassification = {
  phase: MatchPhase;
  isLive: boolean;
  status: string;
  timeStatus: string;
};

@Injectable()
export class MatchesScheduler {
  private readonly logger = new Logger(MatchesScheduler.name);
  private readonly pythonApi: string;

  constructor(
    private http: HttpService,
    private matchesService: MatchesService,
    private oddsService: OddsService,
    private configService: ConfigService,
  ) {
    this.pythonApi = this.configService.get('PYTHON_API_URL', 'http://localhost:8000');
  }

  private asSignal(value: unknown): string {
    return String(value ?? '')
      .trim()
      .toLowerCase();
  }

  private toBool(value: unknown): boolean {
    return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
  }

  private toMinute(raw: any): number {
    const timer = raw?.timer && typeof raw.timer === 'object' ? raw.timer : {};
    const candidates = [
      raw?.minute,
      raw?.played_time,
      raw?.time,
      timer?.tm,
      timer?.minute,
      timer?.time,
    ];

    for (const candidate of candidates) {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 180) {
        return parsed;
      }
    }

    return 0;
  }

  private normalizeName(value: unknown): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private namesProbablyMatch(left: unknown, right: unknown): boolean {
    const a = this.normalizeName(left);
    const b = this.normalizeName(right);

    if (!a || !b) {
      return true;
    }

    if (a === b) {
      return true;
    }

    if (a.length >= 6 && b.length >= 6) {
      return a.includes(b) || b.includes(a);
    }

    return false;
  }

  private parseValidOdd(value: unknown): number | null {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 1 || parsed > 1000) {
      return null;
    }
    return parsed;
  }

  private hasIdentifierConflict(localMatch: any, remoteEventId: string, remoteFi: string): boolean {
    const localExternal = String(localMatch?.external_id ?? '').trim();
    const localFi = String(localMatch?.bet365_id ?? '').trim();

    if (localExternal && remoteEventId && localExternal !== remoteEventId) {
      return true;
    }

    if (localFi && remoteFi && localFi !== remoteFi) {
      return true;
    }

    return false;
  }

  private classifyMatch(raw: any, isInLiveFeed: boolean): MatchClassification {
    const statusSignal = this.asSignal(raw?.status);
    const timeStatusSignal = this.asSignal(raw?.time_status);
    const timerSignal = this.asSignal(raw?.timer?.state ?? raw?.timer?.status);
    const inplaySignal = this.toBool(raw?.inplay) || this.toBool(raw?.live);
    const minute = this.toMinute(raw);
    const composite = [statusSignal, timeStatusSignal, timerSignal].join(' ');

    const isFinishedSignal =
      timeStatusSignal === '2' ||
      timeStatusSignal === '3' ||
      /(finished|ended|ft|fulltime|completed|final|cancelled|abandoned)/.test(composite);

    const isLiveSignal =
      isInLiveFeed ||
      timeStatusSignal === '1' ||
      inplaySignal ||
      /(live|inplay|running|1st half|2nd half|halftime)/.test(composite) ||
      minute > 0;

    if (isFinishedSignal) {
      return {
        phase: 'finished',
        isLive: false,
        status: statusSignal || 'finished',
        timeStatus: '2',
      };
    }

    if (isLiveSignal) {
      return {
        phase: 'live',
        isLive: true,
        status: statusSignal || 'live',
        timeStatus: '1',
      };
    }

    return {
      phase: 'upcoming',
      isLive: false,
      status: statusSignal || 'upcoming',
      timeStatus: timeStatusSignal || '0',
    };
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncMatches() {
    try {
      const upcomingResponse = await this.http
        .get(`${this.pythonApi}/matches/upcoming`)
        .toPromise();

      let liveResponse: any = null;
      let reliableLiveSnapshot = false;
      try {
        liveResponse = await this.http
          .get(`${this.pythonApi}/betsapi/matches/live?limit=200`)
          .toPromise();
        reliableLiveSnapshot = true;
      } catch (error) {
        reliableLiveSnapshot = false;
        this.logger.warn(
          `Snapshot live indisponivel no ciclo atual: ${error?.message ?? 'erro desconhecido'}`,
        );
      }

      const data = upcomingResponse?.data?.results;
      const liveMatches = Array.isArray(liveResponse?.data?.matches)
        ? liveResponse.data.matches
        : [];
      const liveIds = new Set<string>(
        liveMatches
          .map((m: any) => String(m?.id ?? '').trim())
          .filter((id: string) => id.length > 0),
      );

      if (!data || data.length === 0) {
        this.logger.warn('Nenhuma partida recebida');
        return;
      }

      const syncedAt = new Date();
      const mapped = data
        .filter((m: any) => !m.league?.name?.toLowerCase().includes('esoccer'))
        .filter((m: any) => !m.league?.name?.toLowerCase().includes('esports'))
        .map((m: any) => {
          const eventId = String(m.id);
          const classification = this.classifyMatch(m, liveIds.has(eventId));

          return {
            external_id: eventId,
            bet365_id: m.bet365_id,
            home_team: m.home?.name,
            home_team_external_id: m.home?.id,
            away_team: m.away?.name,
            away_team_external_id: m.away?.id,
            league_id: m.league?.id,
            league_name: m.league?.name,
            league_country: m.league?.cc,
            match_time: m.time,
            time_status: classification.timeStatus,
            phase: classification.phase,
            is_live: classification.isLive,
            status: classification.status,
            score: m.ss,
            extra: m.extra,
            last_synced_at: syncedAt,
          };
        });

      await this.matchesService.bulkUpsert(mapped);
      await this.matchesService.markStaleLiveAsFinished(Array.from(liveIds), {
        reliableSnapshot: reliableLiveSnapshot,
        graceMinutes: 15,
      });
      this.logger.log(`✅ ${mapped.length} partidas sincronizadas`);
    } catch (error) {
      this.logger.error('❌ Erro ao sincronizar partidas:', error.message);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async syncOdds() {
    try {
      const response = await this.http.get(`${this.pythonApi}/matches/upcoming`).toPromise();
      const matchList = response?.data?.results;

      if (!matchList || matchList.length === 0) return;

      const eligibleMatches = matchList
        .filter((m: any) => !m.league?.name?.toLowerCase().includes('esoccer'))
        .filter((m: any) => !m.league?.name?.toLowerCase().includes('esports'))
        .filter((m: any) => Boolean(m.bet365_id))
        .slice(0, 20)
        .filter(
          (match: any, index: number, self: any[]) =>
            self.findIndex((item: any) => String(item.id) === String(match.id)) === index,
        );

      const oddsParaSalvar: Partial<Odds>[] = [];

      for (const match of eligibleMatches) {
        try {
          const oddsResponse = await this.http
            .get(`${this.pythonApi}/matches/${match.bet365_id}/odds`)
            .toPromise();

          const oddsData = oddsResponse?.data?.results?.[0];

          this.logger.log(
            `Odds para ${match.bet365_id}: ${JSON.stringify(oddsData?.schedule?.sp?.main)}`,
          );

          if (!oddsData) continue;

          const main = oddsData?.schedule?.sp?.main || [];
          const oddsCasa = this.parseValidOdd(main[0]?.odds);
          const oddsEmpate = this.parseValidOdd(main[1]?.odds);
          const oddsVisitante = this.parseValidOdd(main[2]?.odds);

          const localMatch = await this.matchesService.findByExternalId(String(match.id));
          if (!localMatch) {
            continue;
          }

          const remoteEventId = String(match.id ?? '').trim();
          const remoteFi = String(match.bet365_id ?? '').trim();

          if (this.hasIdentifierConflict(localMatch, remoteEventId, remoteFi)) {
            this.logger.warn(
              `Conflito de IDs detectado para odds (event=${remoteEventId}, fi=${remoteFi}). Odds ignoradas para preservar integridade.`,
            );
            continue;
          }

          const homeConflict = !this.namesProbablyMatch(localMatch.home_team, match.home?.name);
          const awayConflict = !this.namesProbablyMatch(localMatch.away_team, match.away?.name);
          if (homeConflict || awayConflict) {
            this.logger.warn(
              `Conflito de times para odds (event=${remoteEventId}). Odds marcadas como indisponiveis neste ciclo.`,
            );
            continue;
          }

          if (oddsCasa === null || oddsEmpate === null || oddsVisitante === null) {
            this.logger.warn(
              `Odds invalidas para event=${remoteEventId} fi=${remoteFi}. Associacao ignorada para evitar dados incorretos.`,
            );
            continue;
          }

          // salva na tabela odds
          oddsParaSalvar.push({
            fi: match.bet365_id,
            eventId: match.id,
            timeCasa: localMatch.home_team ?? match.home?.name,
            timeVisitante: localMatch.away_team ?? match.away?.name,
            liga: localMatch.league_name ?? match.league?.name,
            horario: match.time,
            status: match.time_status,
            oddsCasa,
            oddsEmpate,
            oddsVisitante,
            oddsRaw: oddsData,
          });

          // atualiza as odds na tabela matches
          await this.matchesService.updateOdds(match.id, {
            home_odds: oddsCasa,
            draw_odds: oddsEmpate,
            away_odds: oddsVisitante,
          });
        } catch {
          continue;
        }
      }

      if (oddsParaSalvar.length > 0) {
        const dedupedOdds = oddsParaSalvar.filter((row, index, self) => {
          const rowFi = String(row.fi ?? '').trim();
          const rowEvent = String(row.eventId ?? '').trim();

          return (
            self.findIndex((item) => {
              const itemFi = String(item.fi ?? '').trim();
              const itemEvent = String(item.eventId ?? '').trim();

              if (rowFi && itemFi) {
                return rowFi === itemFi;
              }

              return rowEvent.length > 0 && rowEvent === itemEvent;
            }) === index
          );
        });

        await this.oddsService.bulkUpsert(dedupedOdds);
        this.logger.log(`✅ ${dedupedOdds.length} odds sincronizadas`);
      }
    } catch (error) {
      this.logger.error('❌ Erro ao sincronizar odds:', error.message);
    }
  }
}

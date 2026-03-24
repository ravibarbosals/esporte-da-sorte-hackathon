import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MatchesService } from './matches.service';
import { OddsService } from '../odds/odds.service';
import { Odds } from '../odds/odds.entity';

@Injectable()
export class MatchesScheduler {
  private readonly logger = new Logger(MatchesScheduler.name);
  private readonly PYTHON_API = 'http://localhost:8000';

  constructor(
    private http: HttpService,
    private matchesService: MatchesService,
    private oddsService: OddsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncMatches() {
    try {
      const response = await this.http.get(`${this.PYTHON_API}/matches/upcoming`).toPromise();
      const data = response?.data?.results;

      if (!data || data.length === 0) {
        this.logger.warn('Nenhuma partida recebida');
        return;
      }

      const mapped = data
        .filter((m: any) => !m.league?.name?.toLowerCase().includes('esoccer'))
        .filter((m: any) => !m.league?.name?.toLowerCase().includes('esports'))
        .map((m: any) => ({
          external_id: m.id,
          bet365_id: m.bet365_id,
          home_team: m.home?.name,
          home_team_external_id: m.home?.id,
          away_team: m.away?.name,
          away_team_external_id: m.away?.id,
          league_id: m.league?.id,
          league_name: m.league?.name,
          league_country: m.league?.cc,
          match_time: m.time,
          time_status: m.time_status,
          score: m.ss,
          extra: m.extra,
        }));

      await this.matchesService.bulkUpsert(mapped);
      this.logger.log(`✅ ${mapped.length} partidas sincronizadas`);
    } catch (error) {
      this.logger.error('❌ Erro ao sincronizar partidas:', error.message);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async syncOdds() {
    try {
      const response = await this.http.get(`${this.PYTHON_API}/matches/upcoming`).toPromise();
      const matchList = response?.data?.results;

      if (!matchList || matchList.length === 0) return;

      const eligibleMatches = matchList
        .filter((m: any) => !m.league?.name?.toLowerCase().includes('esoccer'))
        .filter((m: any) => !m.league?.name?.toLowerCase().includes('esports'))
        .filter((m: any) => Boolean(m.bet365_id))
        .slice(0, 20);

      const oddsParaSalvar: Partial<Odds>[] = [];

      for (const match of eligibleMatches) {
        try {
          const oddsResponse = await this.http
            .get(`${this.PYTHON_API}/matches/${match.bet365_id}/odds`)
            .toPromise();

          const oddsData = oddsResponse?.data?.results?.[0];

          this.logger.log(
            `Odds para ${match.bet365_id}: ${JSON.stringify(oddsData?.schedule?.sp?.main)}`,
          );

          if (!oddsData) continue;

          const main = oddsData?.schedule?.sp?.main || [];
          const oddsCasa = parseFloat(main[0]?.odds);
          const oddsEmpate = parseFloat(main[1]?.odds);
          const oddsVisitante = parseFloat(main[2]?.odds);

          // salva na tabela odds
          oddsParaSalvar.push({
            fi: match.bet365_id,
            eventId: match.id,
            timeCasa: match.home?.name,
            timeVisitante: match.away?.name,
            liga: match.league?.name,
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
        await this.oddsService.bulkUpsert(oddsParaSalvar);
        this.logger.log(`✅ ${oddsParaSalvar.length} odds sincronizadas`);
      }
    } catch (error) {
      this.logger.error('❌ Erro ao sincronizar odds:', error.message);
    }
  }
}

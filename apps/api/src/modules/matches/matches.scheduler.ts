import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MatchesService } from './matches.service';
import { OddsService } from '../odds/odds.service';

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
      const response = await this.http.get(`${this.PYTHON_API}/insights`).toPromise();
      const data = response?.data;

      if (!data || data.length === 0) {
        this.logger.warn('Nenhuma partida recebida');
        return;
      }

      // Mapeia conforme sua estrutura
      const mapped = data.map((m) => ({
        external_id: m.id,
        home_team: m.home?.name,
        away_team: m.away?.name,
      }));

      await this.matchesService.bulkUpsert(mapped);
      this.logger.debug(`✅ ${mapped.length} partidas sincronizadas`);
    } catch (error) {
      this.logger.error('❌ Erro ao sincronizar partidas:', error.message);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async syncOdds() {
    try {
      const response = await this.http.get(`${this.PYTHON_API}/odds`).toPromise();
      const data = response?.data;

      if (!data || data.length === 0) {
        this.logger.warn('Nenhuma odd recebida');
        return;
      }

      await this.oddsService.bulkUpsert(data);
      this.logger.debug(`✅ ${data.length} odds sincronizadas`);
    } catch (error) {
      this.logger.error('❌ Erro ao sincronizar odds:', error.message);
    }
  }
}

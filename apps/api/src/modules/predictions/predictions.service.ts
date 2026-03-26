import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PredictionsService {
  private pythonApiUrl: string;
  private readonly pythonTimeoutMs = 7000;

  constructor(private configService: ConfigService) {
    this.pythonApiUrl = this.configService.get('PYTHON_API_URL', 'http://localhost:8000');
  }

  private async requestPython(path: string, fallback: any = null) {
    try {
      const { data } = await axios.get(`${this.pythonApiUrl}${path}`, {
        timeout: this.pythonTimeoutMs,
      });

      if (data === undefined || data === null) {
        return fallback;
      }

      return data;
    } catch (error: any) {
      const code = error?.code ?? 'unknown';
      const status = error?.response?.status ?? 'no-status';
      console.warn(`[predictions] falha python ${path} code=${code} status=${status}`);
      return fallback;
    }
  }

  private async requirePython(path: string, message: string) {
    const data = await this.requestPython(path, null);
    if (data === null) {
      throw new HttpException(message, HttpStatus.BAD_GATEWAY);
    }
    return data;
  }

  async predictMatch(homeTeam: string, awayTeam: string) {
    return this.requirePython(
      `/predictions/${encodeURIComponent(homeTeam)}/${encodeURIComponent(awayTeam)}`,
      'Erro ao buscar previsão',
    );
  }

  async getIndicators(homeTeam: string, awayTeam: string) {
    return this.requirePython(
      `/indicators/${encodeURIComponent(homeTeam)}/${encodeURIComponent(awayTeam)}`,
      'Erro ao buscar indicadores',
    );
  }

  async getFullAnalysis(homeTeam: string, awayTeam: string) {
    const [prediction, indicators] = await Promise.all([
      this.predictMatch(homeTeam, awayTeam),
      this.getIndicators(homeTeam, awayTeam),
    ]);

    return {
      prediction,
      indicators,
      generated_at: new Date().toISOString(),
    };
  }

  async getUpcomingMatches() {
    return this.requestPython('/matches/upcoming', []);
  }

  async getLiveMatches() {
    return this.requestPython('/matches/live', []);
  }

  async getMatchOdds(eventId: string) {
    return this.requestPython(`/matches/${eventId}/odds`, {
      source: 'fallback',
      updatedAt: new Date().toISOString(),
      results: [],
    });
  }
  async getMatchXg(matchId: string) {
    return this.requestPython(`/match/${matchId}/xg`, []);
  }

  async getTeamXgHistory(competitionId: string, teamName: string, limit = 10) {
    return this.requestPython(
      `/team/${competitionId}/${encodeURIComponent(teamName)}/xg-history?limit=${limit}`,
      [],
    );
  }

  async getH2hXg(competitionId: string, teamA: string, teamB: string) {
    return this.requestPython(
      `/h2h/${competitionId}/${encodeURIComponent(teamA)}/${encodeURIComponent(teamB)}`,
      [],
    );
  }

  async getTeamShotProfile(competitionId: string, teamName: string) {
    return this.requestPython(
      `/team/${competitionId}/${encodeURIComponent(teamName)}/shot-profile`,
      [],
    );
  }

  async getModelExplanation() {
    return this.requestPython('/model/explanation', []);
  }
}

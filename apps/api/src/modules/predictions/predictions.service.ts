import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PredictionsService {
  private pythonApiUrl: string;

  constructor(private configService: ConfigService) {
    this.pythonApiUrl = this.configService.get('PYTHON_API_URL', 'http://localhost:8000');
  }

  async predictMatch(homeTeam: string, awayTeam: string) {
    try {
      const response = await axios.get(
        `${this.pythonApiUrl}/predictions/${encodeURIComponent(homeTeam)}/${encodeURIComponent(awayTeam)}`,
      );
      return response.data;
    } catch (error) {
      throw new HttpException('Erro ao buscar previsão', HttpStatus.BAD_GATEWAY);
    }
  }

  async getIndicators(homeTeam: string, awayTeam: string) {
    try {
      const response = await axios.get(
        `${this.pythonApiUrl}/indicators/${encodeURIComponent(homeTeam)}/${encodeURIComponent(awayTeam)}`,
      );
      return response.data;
    } catch (error) {
      throw new HttpException('Erro ao buscar indicadores', HttpStatus.BAD_GATEWAY);
    }
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
    const { data } = await axios.get(`${this.pythonApiUrl}/matches/upcoming`);
    return data;
  }

  async getLiveMatches() {
    const { data } = await axios.get(`${this.pythonApiUrl}/matches/live`);
    return data;
  }

  async getMatchOdds(eventId: string) {
    const { data } = await axios.get(`${this.pythonApiUrl}/matches/${eventId}/odds`);
    return data;
  }
  async getMatchXg(matchId: string) {
    const { data } = await axios.get(`${this.pythonApiUrl}/match/${matchId}/xg`);
    return data;
  }

  async getTeamXgHistory(competitionId: string, teamName: string, limit = 10) {
    const { data } = await axios.get(
      `${this.pythonApiUrl}/team/${competitionId}/${encodeURIComponent(teamName)}/xg-history?limit=${limit}`,
    );
    return data;
  }

  async getH2hXg(competitionId: string, teamA: string, teamB: string) {
    const { data } = await axios.get(
      `${this.pythonApiUrl}/h2h/${competitionId}/${encodeURIComponent(teamA)}/${encodeURIComponent(teamB)}`,
    );
    return data;
  }

  async getTeamShotProfile(competitionId: string, teamName: string) {
    const { data } = await axios.get(
      `${this.pythonApiUrl}/team/${competitionId}/${encodeURIComponent(teamName)}/shot-profile`,
    );
    return data;
  }
}

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
}

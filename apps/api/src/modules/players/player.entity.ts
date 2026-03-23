import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('newtable')
export class Player {
  @PrimaryGeneratedColumn('increment', { type: 'int', comment: 'Ranking do jogador.' })
  @ApiProperty({ description: 'Ranking do jogador.', example: 1 })
  ranking: number;

  @Column({ name: 'player', type: 'varchar', nullable: true, comment: 'Nome completo do jogador.' })
  @ApiProperty({ description: 'Nome do jogador.', example: 'Brenden Aaronson' })
  nomeJogador: string;

  @Column({ name: 'nation', type: 'varchar', nullable: true, comment: 'Nacionalidade do jogador.' })
  @ApiProperty({ description: 'Nacionalidade.', example: 'us USA' })
  nacionalidade: string;

  @Column({ name: 'pos', type: 'varchar', nullable: true, comment: 'Posição em campo.' })
  @ApiProperty({ description: 'Posição.', example: 'MF,FW' })
  posicao: string;

  @Column({ name: 'squad', type: 'varchar', nullable: true, comment: 'Time atual do jogador.' })
  @ApiProperty({ description: 'Time.', example: 'Leeds United' })
  time: string;

  @Column({ name: 'comp', type: 'varchar', nullable: true, comment: 'Liga em que atua.' })
  @ApiProperty({ description: 'Liga.', example: 'eng Premier League' })
  liga: string;

  @Column({ name: 'born', type: 'varchar', nullable: true, comment: 'Ano de nascimento do jogador.' })
  @ApiProperty({ description: 'Ano de nascimento.', example: '2000' })
  anoNascimento: string;

  @Column({ name: 'mp', type: 'float', nullable: true, comment: 'Total de partidas jogadas na temporada.' })
  @ApiProperty({ description: 'Partidas jogadas.', example: 29 })
  partidasJogadas: number;

  @Column({ name: 'starts', type: 'float', nullable: true, comment: 'Partidas iniciadas como titular.' })
  @ApiProperty({ description: 'Partidas como titular.', example: 23 })
  partidasTitular: number;

  @Column({ name: 'min', type: 'float', nullable: true, comment: 'Total de minutos jogados na temporada.' })
  @ApiProperty({ description: 'Minutos jogados.', example: 1908 })
  minutosJogados: number;

  @Column({ name: '90s', type: 'float', nullable: true, comment: 'Equivalente em jogos completos de 90 minutos.' })
  @ApiProperty({ description: 'Jogos de 90 minutos equivalentes.', example: 21.2 })
  jogosCompletos: number;

  @Column({ name: 'gls', type: 'float', nullable: true, comment: 'Total de gols marcados na temporada.' })
  @ApiProperty({ description: 'Gols marcados.', example: 4 })
  gols: number;

  @Column({ name: 'ast', type: 'float', nullable: true, comment: 'Total de assistências na temporada.' })
  @ApiProperty({ description: 'Assistências.', example: 3 })
  assistencias: number;

  @Column({ name: 'G+A', type: 'float', nullable: true, comment: 'Soma de gols e assistências.' })
  @ApiProperty({ description: 'Gols + Assistências.', example: 7 })
  golsMaisAssistencias: number;

  @Column({ name: 'G-PK', type: 'float', nullable: true, comment: 'Gols marcados excluindo pênaltis.' })
  @ApiProperty({ description: 'Gols sem pênaltis.', example: 4 })
  golsSemPenalti: number;

  @Column({ name: 'pk', type: 'float', nullable: true, comment: 'Pênaltis convertidos.' })
  @ApiProperty({ description: 'Pênaltis convertidos.', example: 0 })
  penaltisConvertidos: number;

  @Column({ name: 'pkatt', type: 'float', nullable: true, comment: 'Total de pênaltis cobrados.' })
  @ApiProperty({ description: 'Pênaltis cobrados.', example: 0 })
  penaltisCobrados: number;

  @Column({ name: 'crdy', type: 'float', nullable: true, comment: 'Cartões amarelos recebidos.' })
  @ApiProperty({ description: 'Cartões amarelos.', example: 1 })
  cartoesAmarelos: number;

  @Column({ name: 'crdr', type: 'float', nullable: true, comment: 'Cartões vermelhos recebidos.' })
  @ApiProperty({ description: 'Cartões vermelhos.', example: 0 })
  cartoesVermelhos: number;

  @Column({ name: 'G+A-PK', type: 'float', nullable: true, comment: 'Gols e assistências excluindo pênaltis.' })
  @ApiProperty({ description: 'Gols + Assistências sem pênaltis.', example: 7 })
  golsMaisAssistenciasSemPenalti: number;

  @Column({ name: 'sh', type: 'float', nullable: true, comment: 'Total de chutes realizados.' })
  @ApiProperty({ description: 'Chutes totais.', example: 40 })
  chutesTotais: number;

  @Column({ name: 'sot', type: 'float', nullable: true, comment: 'Chutes que foram no alvo.' })
  @ApiProperty({ description: 'Chutes no alvo.', example: 15 })
  chutesNoAlvo: number;

  @Column({ name: 'SoT%', type: 'float', nullable: true, comment: 'Percentual de chutes no alvo sobre o total.' })
  @ApiProperty({ description: '% chutes no alvo.', example: 37.5 })
  percentualChutesNoAlvo: number;

  @Column({ name: 'Sh/90', type: 'float', nullable: true, comment: 'Média de chutes por 90 minutos jogados.' })
  @ApiProperty({ description: 'Chutes por 90 min.', example: 1.89 })
  chutesPor90min: number;

  @Column({ name: 'SoT/90', type: 'float', nullable: true, comment: 'Média de chutes no alvo por 90 minutos.' })
  @ApiProperty({ description: 'Chutes no alvo por 90 min.', example: 0.71 })
  chutesNoAlvoPor90min: number;

  @Column({ name: 'G/Sh', type: 'float', nullable: true, comment: 'Eficiência de finalização: gols por chute.' })
  @ApiProperty({ description: 'Gols por chute.', example: 0.1 })
  golsPorChute: number;

  @Column({ name: 'G/SoT', type: 'float', nullable: true, comment: 'Gols marcados por chute no alvo.' })
  @ApiProperty({ description: 'Gols por chute no alvo.', example: 0.27 })
  golsPorChuteNoAlvo: number;

  @Column({ name: 'pk_stats_shooting', type: 'float', nullable: true, comment: 'Pênaltis convertidos (estatísticas de chute).' })
  @ApiProperty({ description: 'Pênaltis convertidos (chute).', example: 0 })
  penaltisConvertidosChute: number;

  @Column({ name: 'pkatt_stats_shooting', type: 'float', nullable: true, comment: 'Pênaltis cobrados (estatísticas de chute).' })
  @ApiProperty({ description: 'Pênaltis cobrados (chute).', example: 0 })
  penaltisCobradosChute: number;

  @Column({ name: 'crs', type: 'float', nullable: true, comment: 'Total de cruzamentos realizados.' })
  @ApiProperty({ description: 'Cruzamentos.', example: 35 })
  cruzamentos: number;

  @Column({ name: 'tklw', type: 'float', nullable: true, comment: 'Desarmes vencidos.' })
  @ApiProperty({ description: 'Desarmes vencidos.', example: 22 })
  desarmesVencidos: number;

  @Column({ name: 'Int', type: 'float', nullable: true, comment: 'Total de interceptações realizadas.' })
  @ApiProperty({ description: 'Interceptações.', example: 13 })
  interceptacoes: number;

  @Column({ name: 'fld', type: 'float', nullable: true, comment: 'Faltas sofridas pelo jogador.' })
  @ApiProperty({ description: 'Faltas sofridas.', example: 41 })
  faltasSofridas: number;

  @Column({ name: 'crdy_stats_misc', type: 'float', nullable: true, comment: 'Cartões amarelos (estatísticas misc).' })
  @ApiProperty({ description: 'Cartões amarelos misc.', example: 1 })
  cartoesAmarelosMisc: number;

  @Column({ name: 'crdr_stats_misc', type: 'float', nullable: true, comment: 'Cartões vermelhos (estatísticas misc).' })
  @ApiProperty({ description: 'Cartões vermelhos misc.', example: 0 })
  cartoesVermelhosMisc: number;

  @Column({ name: '2CrdY', type: 'float', nullable: true, comment: 'Expulsões por segundo cartão amarelo.' })
  @ApiProperty({ description: 'Segundo cartão amarelo.', example: 0 })
  segundoCartaoAmarelo: number;

  @Column({ name: 'fls', type: 'float', nullable: true, comment: 'Faltas cometidas pelo jogador.' })
  @ApiProperty({ description: 'Faltas cometidas.', example: 17 })
  faltasCometidas: number;

  @Column({ name: 'og', type: 'float', nullable: true, comment: 'Gols contra marcados.' })
  @ApiProperty({ description: 'Gols contra.', example: 0 })
  golsContra: number;

  @Column({ name: 'ga', type: 'float', nullable: true, comment: 'Gols sofridos (goleiros).' })
  @ApiProperty({ description: 'Gols sofridos.', example: 0 })
  golsSofridos: number;

  @Column({ name: 'ga90', type: 'float', nullable: true, comment: 'Gols sofridos por 90 minutos (goleiros).' })
  @ApiProperty({ description: 'Gols sofridos por 90 min.', example: 0 })
  golsSofridosPor90min: number;

  @Column({ name: 'sota', type: 'float', nullable: true, comment: 'Chutes a gol sofridos (goleiros).' })
  @ApiProperty({ description: 'Chutes a gol sofridos.', example: 0 })
  chutesAGolSofridos: number;

  @Column({ name: 'saves', type: 'float', nullable: true, comment: 'Defesas realizadas (goleiros).' })
  @ApiProperty({ description: 'Defesas.', example: 0 })
  defesas: number;

  @Column({ name: 'Save%', type: 'float', nullable: true, comment: 'Percentual de defesas (goleiros).' })
  @ApiProperty({ description: '% defesas.', example: 0 })
  percentualDefesas: number;

  @Column({ name: 'w', type: 'float', nullable: true, comment: 'Vitórias do time quando o goleiro atuou.' })
  @ApiProperty({ description: 'Vitórias (goleiro).', example: 0 })
  vitorias: number;

  @Column({ name: 'd', type: 'float', nullable: true, comment: 'Empates do time quando o goleiro atuou.' })
  @ApiProperty({ description: 'Empates (goleiro).', example: 0 })
  empates: number;

  @Column({ name: 'l', type: 'float', nullable: true, comment: 'Derrotas do time quando o goleiro atuou.' })
  @ApiProperty({ description: 'Derrotas (goleiro).', example: 0 })
  derrotas: number;

  @Column({ name: 'cs', type: 'float', nullable: true, comment: 'Clean sheets (goleiros).' })
  @ApiProperty({ description: 'Clean sheets.', example: 0 })
  cleanSheets: number;

  @Column({ name: 'CS%', type: 'float', nullable: true, comment: 'Percentual de clean sheets (goleiros).' })
  @ApiProperty({ description: '% clean sheets.', example: 0 })
  percentualCleanSheets: number;

  @Column({ name: 'pkatt_stats_keeper', type: 'float', nullable: true, comment: 'Pênaltis cobrados contra o goleiro.' })
  @ApiProperty({ description: 'Pênaltis cobrados contra.', example: 0 })
  penaltisContraGoleiro: number;

  @Column({ name: 'pka', type: 'float', nullable: true, comment: 'Pênaltis sofridos (goleiros).' })
  @ApiProperty({ description: 'Pênaltis sofridos.', example: 0 })
  penaltisSofridos: number;

  @Column({ name: 'pksv', type: 'float', nullable: true, comment: 'Pênaltis defendidos pelo goleiro.' })
  @ApiProperty({ description: 'Pênaltis defendidos.', example: 0 })
  penaltisDefendidos: number;

  @Column({ name: 'pkm', type: 'float', nullable: true, comment: 'Pênaltis perdidos pelo adversário.' })
  @ApiProperty({ description: 'Pênaltis perdidos pelo adversário.', example: 0 })
  penaltisPerdidosAdversario: number;

  @Column({ name: 'age', type: 'float', nullable: true, comment: 'Idade atual do jogador.' })
  @ApiProperty({ description: 'Idade.', example: 26 })
  idade: number;
}
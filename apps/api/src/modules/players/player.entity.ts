import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('newtable')
export class Player {
  @PrimaryGeneratedColumn('increment', { type: 'int', comment: 'Ranking do jogador.' })
  @ApiProperty({ description: 'Ranking do jogador.', example: 1 })
  ranking: number;

  @Column({ name: 'nomejogador', type: 'varchar', nullable: true, comment: 'Nome completo do jogador.' })
  @ApiProperty({ description: 'Nome do jogador.', example: 'Brenden Aaronson' })
  nomejogador: string;

  @Column({ name: 'nacionalidade', type: 'varchar', nullable: true, comment: 'Nacionalidade do jogador.' })
  @ApiProperty({ description: 'Nacionalidade.', example: 'us USA' })
  nacionalidade: string;

  @Column({ name: 'posicao', type: 'varchar', nullable: true, comment: 'Posição em campo.' })
  @ApiProperty({ description: 'Posição.', example: 'MF,FW' })
  posicao: string;

  @Column({ name: 'time', type: 'varchar', nullable: true, comment: 'Time atual do jogador.' })
  @ApiProperty({ description: 'Time.', example: 'Leeds United' })
  time: string;

  @Column({ name: 'liga', type: 'varchar', nullable: true, comment: 'Liga em que atua.' })
  @ApiProperty({ description: 'Liga.', example: 'eng Premier League' })
  liga: string;

  @Column({ name: 'anonascimento', type: 'varchar', nullable: true, comment: 'Ano de nascimento do jogador.' })
  @ApiProperty({ description: 'Ano de nascimento.', example: '2000' })
  anonascimento: string;

  @Column({ name: 'partidasjogadas', type: 'float', nullable: true, comment: 'Total de partidas jogadas na temporada.' })
  @ApiProperty({ description: 'Partidas jogadas.', example: 29 })
  partidasjogadas: number;

  @Column({ name: 'partidastitular', type: 'float', nullable: true, comment: 'Partidas iniciadas como titular.' })
  @ApiProperty({ description: 'Partidas como titular.', example: 23 })
  partidastitular: number;

  @Column({ name: 'minutosjogados', type: 'float', nullable: true, comment: 'Total de minutos jogados na temporada.' })
  @ApiProperty({ description: 'Minutos jogados.', example: 1908 })
  minutosjogados: number;

  @Column({ name: 'jogoscompletos', type: 'float', nullable: true, comment: 'Equivalente em jogos completos de 90 minutos.' })
  @ApiProperty({ description: 'Jogos de 90 minutos equivalentes.', example: 21.2 })
  jogoscompletos: number;

  @Column({ name: 'gols', type: 'float', nullable: true, comment: 'Total de gols marcados na temporada.' })
  @ApiProperty({ description: 'Gols marcados.', example: 4 })
  gols: number;

  @Column({ name: 'assistencias', type: 'float', nullable: true, comment: 'Total de assistências na temporada.' })
  @ApiProperty({ description: 'Assistências.', example: 3 })
  assistencias: number;

  @Column({ name: 'golsmaisassistencias', type: 'float', nullable: true, comment: 'Soma de gols e assistências.' })
  @ApiProperty({ description: 'Gols + Assistências.', example: 7 })
  golsmaisassistencias: number;

  @Column({ name: 'golssempenalti', type: 'float', nullable: true, comment: 'Gols marcados excluindo pênaltis.' })
  @ApiProperty({ description: 'Gols sem pênaltis.', example: 4 })
  golssempenalti: number;

  @Column({ name: 'penaltisconvertidos', type: 'float', nullable: true, comment: 'Pênaltis convertidos.' })
  @ApiProperty({ description: 'Pênaltis convertidos.', example: 0 })
  penaltisconvertidos: number;

  @Column({ name: 'penaltiscobrados', type: 'float', nullable: true, comment: 'Total de pênaltis cobrados.' })
  @ApiProperty({ description: 'Pênaltis cobrados.', example: 0 })
  penaltiscobrados: number;

  @Column({ name: 'cartoesamarelos', type: 'float', nullable: true, comment: 'Cartões amarelos recebidos.' })
  @ApiProperty({ description: 'Cartões amarelos.', example: 1 })
  cartoesamarelos: number;

  @Column({ name: 'cartoesvermelhos', type: 'float', nullable: true, comment: 'Cartões vermelhos recebidos.' })
  @ApiProperty({ description: 'Cartões vermelhos.', example: 0 })
  cartoesvermelhos: number;

  @Column({ name: 'golsmaisassistenciassempenalti', type: 'float', nullable: true, comment: 'Gols e assistências excluindo pênaltis.' })
  @ApiProperty({ description: 'Gols + Assistências sem pênaltis.', example: 7 })
  golsmaisassistenciassempenalti: number;

  @Column({ name: 'chutestotais', type: 'float', nullable: true, comment: 'Total de chutes realizados.' })
  @ApiProperty({ description: 'Chutes totais.', example: 40 })
  chutestotais: number;

  @Column({ name: 'chutesnoalvo', type: 'float', nullable: true, comment: 'Chutes que foram no alvo.' })
  @ApiProperty({ description: 'Chutes no alvo.', example: 15 })
  chutesnoalvo: number;

  @Column({ name: 'percentualchutesnoalvo', type: 'float', nullable: true, comment: 'Percentual de chutes no alvo sobre o total.' })
  @ApiProperty({ description: '% chutes no alvo.', example: 37.5 })
  percentualchutesnoalvo: number;

  @Column({ name: 'chutespor90min', type: 'float', nullable: true, comment: 'Média de chutes por 90 minutos jogados.' })
  @ApiProperty({ description: 'Chutes por 90 min.', example: 1.89 })
  chutespor90min: number;

  @Column({ name: 'chutesnoalvopor90min', type: 'float', nullable: true, comment: 'Média de chutes no alvo por 90 minutos.' })
  @ApiProperty({ description: 'Chutes no alvo por 90 min.', example: 0.71 })
  chutesnoalvopor90min: number;

  @Column({ name: 'golsporchute', type: 'float', nullable: true, comment: 'Eficiência de finalização: gols por chute.' })
  @ApiProperty({ description: 'Gols por chute.', example: 0.1 })
  golsporchute: number;

  @Column({ name: 'golsporchutenoalvo', type: 'float', nullable: true, comment: 'Gols marcados por chute no alvo.' })
  @ApiProperty({ description: 'Gols por chute no alvo.', example: 0.27 })
  golsporchutenoalvo: number;

  @Column({ name: 'penaltisconvertidoschute', type: 'float', nullable: true, comment: 'Pênaltis convertidos (estatísticas de chute).' })
  @ApiProperty({ description: 'Pênaltis convertidos (chute).', example: 0 })
  penaltisconvertidoschute: number;

  @Column({ name: 'penaltiscobradoschute', type: 'float', nullable: true, comment: 'Pênaltis cobrados (estatísticas de chute).' })
  @ApiProperty({ description: 'Pênaltis cobrados (chute).', example: 0 })
  penaltiscobradoschute: number;

  @Column({ name: 'cruzamentos', type: 'float', nullable: true, comment: 'Total de cruzamentos realizados.' })
  @ApiProperty({ description: 'Cruzamentos.', example: 35 })
  cruzamentos: number;

  @Column({ name: 'desarmesvencidos', type: 'float', nullable: true, comment: 'Desarmes vencidos.' })
  @ApiProperty({ description: 'Desarmes vencidos.', example: 22 })
  desarmesvencidos: number;

  @Column({ name: 'interceptacoes', type: 'float', nullable: true, comment: 'Total de interceptações realizadas.' })
  @ApiProperty({ description: 'Interceptações.', example: 13 })
  interceptacoes: number;

  @Column({ name: 'faltassofridas', type: 'float', nullable: true, comment: 'Faltas sofridas pelo jogador.' })
  @ApiProperty({ description: 'Faltas sofridas.', example: 41 })
  faltassofridas: number;

  @Column({ name: 'cartoesamarelosmisc', type: 'float', nullable: true, comment: 'Cartões amarelos (estatísticas misc).' })
  @ApiProperty({ description: 'Cartões amarelos misc.', example: 1 })
  cartoesamarelosmisc: number;

  @Column({ name: 'cartoesvermelhosmisc', type: 'float', nullable: true, comment: 'Cartões vermelhos (estatísticas misc).' })
  @ApiProperty({ description: 'Cartões vermelhos misc.', example: 0 })
  cartoesvermelhosmisc: number;

  @Column({ name: 'segundocartaoamarelo', type: 'float', nullable: true, comment: 'Expulsões por segundo cartão amarelo.' })
  @ApiProperty({ description: 'Segundo cartão amarelo.', example: 0 })
  segundocartaoamarelo: number;

  @Column({ name: 'faltascometidas', type: 'float', nullable: true, comment: 'Faltas cometidas pelo jogador.' })
  @ApiProperty({ description: 'Faltas cometidas.', example: 17 })
  faltascometidas: number;

  @Column({ name: 'golscontra', type: 'float', nullable: true, comment: 'Gols contra marcados.' })
  @ApiProperty({ description: 'Gols contra.', example: 0 })
  golscontra: number;

  @Column({ name: 'golssofridos', type: 'float', nullable: true, comment: 'Gols sofridos (goleiros).' })
  @ApiProperty({ description: 'Gols sofridos.', example: 0 })
  golssofridos: number;

  @Column({ name: 'golssofridospor90min', type: 'float', nullable: true, comment: 'Gols sofridos por 90 minutos (goleiros).' })
  @ApiProperty({ description: 'Gols sofridos por 90 min.', example: 0 })
  golssofridospor90min: number;

  @Column({ name: 'chutesagolsofridos', type: 'float', nullable: true, comment: 'Chutes a gol sofridos (goleiros).' })
  @ApiProperty({ description: 'Chutes a gol sofridos.', example: 0 })
  chutesagolsofridos: number;

  @Column({ name: 'defesas', type: 'float', nullable: true, comment: 'Defesas realizadas (goleiros).' })
  @ApiProperty({ description: 'Defesas.', example: 0 })
  defesas: number;

  @Column({ name: 'percentualdefesas', type: 'float', nullable: true, comment: 'Percentual de defesas (goleiros).' })
  @ApiProperty({ description: '% defesas.', example: 0 })
  percentualdefesas: number;

  @Column({ name: 'vitorias', type: 'float', nullable: true, comment: 'Vitórias do time quando o goleiro atuou.' })
  @ApiProperty({ description: 'Vitórias (goleiro).', example: 0 })
  vitorias: number;

  @Column({ name: 'empates', type: 'float', nullable: true, comment: 'Empates do time quando o goleiro atuou.' })
  @ApiProperty({ description: 'Empates (goleiro).', example: 0 })
  empates: number;

  @Column({ name: 'derrotas', type: 'float', nullable: true, comment: 'Derrotas do time quando o goleiro atuou.' })
  @ApiProperty({ description: 'Derrotas (goleiro).', example: 0 })
  derrotas: number;

  @Column({ name: 'cleansheets', type: 'float', nullable: true, comment: 'Clean sheets (goleiros).' })
  @ApiProperty({ description: 'Clean sheets.', example: 0 })
  cleansheets: number;

  @Column({ name: 'percentualcleansheets', type: 'float', nullable: true, comment: 'Percentual de clean sheets (goleiros).' })
  @ApiProperty({ description: '% clean sheets.', example: 0 })
  percentualcleansheets: number;

  @Column({ name: 'penaltiscontragoleiro', type: 'float', nullable: true, comment: 'Pênaltis cobrados contra o goleiro.' })
  @ApiProperty({ description: 'Pênaltis cobrados contra.', example: 0 })
  penaltiscontragoleiro: number;

  @Column({ name: 'penaltissofridos', type: 'float', nullable: true, comment: 'Pênaltis sofridos (goleiros).' })
  @ApiProperty({ description: 'Pênaltis sofridos.', example: 0 })
  penaltissofridos: number;

  @Column({ name: 'penaltisdefendidos', type: 'float', nullable: true, comment: 'Pênaltis defendidos pelo goleiro.' })
  @ApiProperty({ description: 'Pênaltis defendidos.', example: 0 })
  penaltisdefendidos: number;

  @Column({ name: 'penaltisperdidosadversario', type: 'float', nullable: true, comment: 'Pênaltis perdidos pelo adversário.' })
  @ApiProperty({ description: 'Pênaltis perdidos pelo adversário.', example: 0 })
  penaltisperdidosadversario: number;

  @Column({ name: 'idade', type: 'float', nullable: true, comment: 'Idade atual do jogador.' })
  @ApiProperty({ description: 'Idade.', example: 26 })
  idade: number;
}
import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Unique(['fi', 'horario', 'status'])
@Entity('odds')
export class Odds {
  @PrimaryGeneratedColumn('increment', { type: 'int', comment: 'ID interno.' })
  @ApiProperty({ description: 'ID interno.', example: 1 })
  id: number;

  @Column({ type: 'varchar', comment: 'FI — ID do evento na Bet365.' })
  @ApiProperty({ description: 'ID Bet365.', example: '191757440' })
  fi: string;

  @Column({ type: 'varchar', nullable: true, comment: 'ID do evento na BetsAPI.' })
  @ApiProperty({ description: 'ID BetsAPI.', example: '11635785' })
  eventId: string;

  @Column({ type: 'varchar', nullable: true, comment: 'Nome do time da casa.' })
  @ApiProperty({ description: 'Time da casa.', example: 'Real Madrid' })
  timeCasa: string;

  @Column({ type: 'varchar', nullable: true, comment: 'Nome do time visitante.' })
  @ApiProperty({ description: 'Time visitante.', example: 'Barcelona' })
  timeVisitante: string;

  @Column({ type: 'varchar', nullable: true, comment: 'Nome da liga.' })
  @ApiProperty({ description: 'Liga.', example: 'La Liga' })
  liga: string;

  @Column({ type: 'float', nullable: true, comment: 'Odd de vitória do time da casa.' })
  @ApiProperty({ description: 'Odd casa.', example: 2.600 })
  oddsCasa: number;

  @Column({ type: 'float', nullable: true, comment: 'Odds de empate.' })
  @ApiProperty({ description: 'Odds empate.', example: 5.250 })
  oddsEmpate: number;

  @Column({ type: 'float', nullable: true, comment: 'Odds de vitória do time visitante.' })
  @ApiProperty({ description: 'Odds visitante.', example: 1.850 })
  oddsVisitante: number;

  @Column({ type: 'varchar', nullable: true, comment: 'Status da partida (0=próxima, 1=ao vivo, 2=encerrada).' })
  @ApiProperty({ description: 'Status.', example: '0' })
  status: string;

  @Column({ type: 'varchar', nullable: true, comment: 'Horário da partida em timestamp.' })
  @ApiProperty({ description: 'Horário.', example: '1774280700' })
  horario: string;

  @Column({ type: 'jsonb', nullable: true, comment: 'Dados brutos das oddss retornados pela API.' })
  @ApiProperty({ description: 'Oddss brutas.' })
  oddsRaw: object;

  @CreateDateColumn({ comment: 'Data de registro da odds.' })
  @ApiProperty({ description: 'Data de registro.' })
  registradoEm: Date;
}
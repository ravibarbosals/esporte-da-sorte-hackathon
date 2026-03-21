import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  external_id: string;

  @Column({ nullable: true })
  bet365_id: string;

  @Column()
  home_team: string;

  @Column()
  home_team_external_id: string;

  @Column({ nullable: true })
  home_image_id: string;

  @Column()
  away_team: string;

  @Column()
  away_team_external_id: string;

  @Column({ nullable: true })
  away_image_id: string;

  @Column({ nullable: true })
  league_id: string;

  @Column({ nullable: true })
  league_name: string;

  @Column({ nullable: true })
  league_country: string;

  @Column({ nullable: true })
  match_time: string;

  @Column({ default: '0' })
  time_status: string;
  // 0 = upcoming, 1 = inplay, 2 = ended, 3 = cancelled

  @Column({ nullable: true })
  score: string;

  @Column({ nullable: true, type: 'float' })
  home_odds: number;

  @Column({ nullable: true, type: 'float' })
  draw_odds: number;

  @Column({ nullable: true, type: 'float' })
  away_odds: number;

  @Column({ nullable: true, type: 'jsonb' })
  extra: object;

  @CreateDateColumn()
  created_at: Date;
}
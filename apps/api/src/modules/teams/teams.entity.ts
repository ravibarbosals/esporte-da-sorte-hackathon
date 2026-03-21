import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  comp: string;

  @Column({ nullable: true, type: 'int' })
  total_yellow_cards: number;

  @Column({ nullable: true, type: 'int' })
  total_red_cards: number;

  @Column({ nullable: true, type: 'float' })
  avg_yellow_cards: number;

  @Column({ nullable: true, type: 'float' })
  avg_goals: number;

  @Column({ nullable: true, type: 'float' })
  avg_assists: number;

  @CreateDateColumn()
  created_at: Date;
}
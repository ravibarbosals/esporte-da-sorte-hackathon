import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  squad: string;

  @Column()
  comp: string;

  @Column({ nullable: true })
  pos: string;

  @Column({ nullable: true, type: 'float' })
  age: number;

  @Column({ nullable: true, type: 'int' })
  goals: number;

  @Column({ nullable: true, type: 'int' })
  assists: number;

  @Column({ nullable: true, type: 'int' })
  yellow_cards: number;

  @Column({ nullable: true, type: 'int' })
  red_cards: number;

  @Column({ nullable: true, type: 'int' })
  minutes: number;

  @Column({ nullable: true, type: 'int' })
  shots: number;

  @Column({ nullable: true, type: 'int' })
  shots_on_target: number;

  @Column({ nullable: true, type: 'float' })
  goals_per_90: number;

  @CreateDateColumn()
  created_at: Date;
}
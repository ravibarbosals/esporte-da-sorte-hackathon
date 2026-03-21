import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('insights')
export class Insight {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('jsonb', { nullable: true })
  data: object;

  @CreateDateColumn()
  created_at: Date;
}
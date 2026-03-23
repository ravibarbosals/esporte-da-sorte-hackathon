import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from '../players/player.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Player])],
  controllers: [TeamsController],
  providers: [TeamsService]
})
export class TeamsModule {}

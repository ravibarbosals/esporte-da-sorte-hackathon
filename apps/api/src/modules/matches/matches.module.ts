import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './matches.entity';
import { MatchesScheduler } from './matches.scheduler';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([Match]), HttpModule],
  controllers: [MatchesController],
  providers: [MatchesService, MatchesScheduler]
})
export class MatchesModule {}

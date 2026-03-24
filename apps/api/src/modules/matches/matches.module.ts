import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './matches.entity';
import { MatchesScheduler } from './matches.scheduler';
import { HttpModule } from '@nestjs/axios';
import { OddsService } from '../odds/odds.service';
import { OddsModule } from '../odds/odds.module';

@Module({
  imports: [TypeOrmModule.forFeature([Match]), HttpModule, OddsModule],
  controllers: [MatchesController],
  providers: [MatchesService, MatchesScheduler]
})
export class MatchesModule {}

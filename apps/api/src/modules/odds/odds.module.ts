import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { OddsController } from './odds.controller';
import { OddsService } from './odds.service';
import { Odds } from './odds.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Odds]), ConfigModule],
  controllers: [OddsController],
  providers: [OddsService],
  exports: [OddsService],
})
export class OddsModule {}
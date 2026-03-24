import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [PredictionsController],
  providers: [PredictionsService],
  exports: [PredictionsService],
})
export class PredictionsModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';

@Module({
  imports: [ConfigModule],
  controllers: [PredictionsController],
  providers: [PredictionsService],
})
export class PredictionsModule {}
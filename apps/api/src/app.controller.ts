import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PredictionsService } from './modules/predictions/predictions.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly predictionsService: PredictionsService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('model/explanation')
  getModelExplanation() {
    return this.predictionsService.getModelExplanation();
  }
}

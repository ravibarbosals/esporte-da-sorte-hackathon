import { Controller, Get, Param } from '@nestjs/common';
import { InsightsService } from './insights.service';

@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get()
  findAll() {
    return this.insightsService.findAll();
  }

  @Get(':type')
  findByType(@Param('type') type: string) {
    return this.insightsService.findByType(type);
  }
}

import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('performance')
  getPerformance(@Query('botName') botName: string) {
    // In a real app, you'd get botName from query params or auth context
    return this.analyticsService.getPerformance(botName || 'bot-equities');
  }
}

import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { BotsController } from './bots.controller';
import { EventsGateway } from './events.gateway';
import { AnalyticsController } from './analytics/analytics.controller';
import { AnalyticsService } from './analytics/analytics.service';
import { StrategiesController } from './strategies/strategies.controller';

@Module({
  imports: [
    // Exposes a /metrics endpoint for Prometheus scraping
    PrometheusModule.register(), 
  ],
  controllers: [
    BotsController,
    AnalyticsController,
    StrategiesController,
  ],
  providers: [
    EventsGateway,
    AnalyticsService,
  ],
})
export class AppModule {}


import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Alerter } from '../../../packages/shared/src/alerter';
// import { PrismaService } from '../../../packages/shared/src/prisma.service';
// import { MessagingService } from '../../../packages/shared/src/messaging.service';

@Injectable()
export class RiskManagerService {
  private readonly logger = new Logger(RiskManagerService.name);
  private portfolioPeak = 100000; // This should be persisted in a real system

  constructor(
    // private prisma: PrismaService,
    // private messagingService: MessagingService,
    private alerter: Alerter,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.log('Running risk checks...');
    try {
      await this.checkStaleHeartbeats();
      await this.checkPortfolioDrawdown();
    } catch (error) {
      this.logger.error('Error during risk check cron job', error);
      await this.alerter.send(`🚨 **CRITICAL**: Risk Manager cron job failed!`, 'HIGH');
    }
  }

  private async checkStaleHeartbeats() {
    this.logger.log('Checking for stale heartbeats...');
    // const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    // const staleBots = await this.prisma.heartbeat.findMany({
    //   where: { timestamp: { lt: fiveMinutesAgo } },
    // });

    const staleBots = []; // Placeholder

    if (staleBots.length > 0) {
      const botNames = staleBots.map(b => b.service).join(', ');
      const message = `🚨 **EMERGENCY**: Stale heartbeats detected for bots: ${botNames}. System is halting.`;
      this.logger.warn(message);
      await this.alerter.send(message, 'HIGH');
      await this.triggerSystemHalt('Stale heartbeats detected.');
    }
  }

  private async checkPortfolioDrawdown() {
    this.logger.log('Checking portfolio drawdown...');
    // const positions = await this.prisma.position.findMany();
    // This would involve fetching current market prices to get the real-time value
    const currentPortfolioValue = 90000; // Placeholder value
    const drawdownPercentage = ((this.portfolioPeak - currentPortfolioValue) / this.portfolioPeak) * 100;

    const MAX_DRAWDOWN = 10; // 10%

    if (drawdownPercentage > MAX_DRAWDOWN) {
      const message = `🚨 **EMERGENCY**: Maximum portfolio drawdown of ${MAX_DRAWDOWN}% breached. Current DD: ${drawdownPercentage.toFixed(2)}%. System is halting.`;
      this.logger.warn(message);
      await this.alerter.send(message, 'HIGH');
      await this.triggerSystemHalt(`Max drawdown breached by ${drawdownPercentage.toFixed(2)}%`);
    } else {
       // Update peak if we've reached a new high
      if (currentPortfolioValue > this.portfolioPeak) {
        this.portfolioPeak = currentPortfolioValue;
        this.logger.log(`New portfolio peak reached: $${this.portfolioPeak.toFixed(2)}`);
      }
    }
  }

  private async triggerSystemHalt(reason: string) {
    this.logger.error(`Triggering system-wide halt. Reason: ${reason}`);
    const command = {
      command: 'LIQUIDATE_AND_HALT',
      reason: reason,
      timestamp: new Date().toISOString(),
    };
    // await this.messagingService.publishToTopic('system.commands', command);
    console.log('Published LIQUIDATE_AND_HALT to system.commands');
  }
}

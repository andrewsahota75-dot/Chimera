import { Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service'; // Assumes Prisma service exists

// Mock PrismaService for demonstration
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // TODO: Add PrismaService

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  
  constructor(private prisma: PrismaService) {}

  async getPerformance(botName: string) {
    try {
      const trades = await this.prisma.trade.findMany({
        where: { botName },
        orderBy: { timestamp: 'asc' },
      });

      if (trades.length === 0) {
        return {
          totalPnl: 0,
          totalTrades: 0,
          winRate: 0,
          equityCurve: []
        };
      }

      let runningPnl = 100000; // Starting capital
      const equityCurve = trades.map(trade => {
        runningPnl += trade.pnl;
        return {
          time: trade.timestamp.getTime(),
          equity: runningPnl
        };
      });

      const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
      const winningTrades = trades.filter(trade => trade.pnl > 0).length;
      const winRate = trades.length > 0 ? winningTrades / trades.length : 0;

      return {
        totalPnl,
        totalTrades: trades.length,
        winRate,
        equityCurve
      };
    } catch (error) {
      this.logger.error('Failed to fetch performance data:', error);
      throw new Error('Performance data fetch failed');
    }
  }

  async getBacktestResults(strategyId: string) {
    try {
      const strategy = await this.prisma.strategyConfiguration.findFirst({
        where: { id: strategyId },
        include: { backtestResult: true }
      });

      if (!strategy?.backtestResult) {
        return null;
      }

      return strategy.backtestResult;
    } catch (error) {
      this.logger.error('Failed to fetch backtest results:', error);
      throw new Error('Backtest results fetch failed');
    }

    if (trades.length === 0) {
      throw new NotFoundException(`No trades found for bot: ${botName}`);
    }

    let totalPnl = 0;
    let winningTrades = 0;
    let peakEquity = 100000; // Assuming initial capital
    let maxDrawdown = 0;
    let currentEquity = 100000;

    const equityCurve = trades.map(trade => {
      totalPnl += trade.pnl;
      currentEquity += trade.pnl;

      if (trade.pnl > 0) {
        winningTrades++;
      }

      if (currentEquity > peakEquity) {
        peakEquity = currentEquity;
      }

      const drawdown = (peakEquity - currentEquity) / peakEquity;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }

      return {
        time: trade.timestamp.getTime(),
        equity: currentEquity,
      };
    });

    const winRate = winningTrades / trades.length;

    // Fetch associated backtest result
    const activeConfig = await this.prisma.strategyConfiguration.findFirst({
        where: { botName, isActive: true },
        include: { backtestResult: true }
    });

    return {
      kpis: {
        totalPnl,
        winRate,
        maxDrawdown,
        totalTrades: trades.length,
      },
      liveEquityCurve: equityCurve,
      backtestResult: activeConfig?.backtestResult || null
    };
  }
}

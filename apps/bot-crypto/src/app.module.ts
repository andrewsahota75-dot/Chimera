
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrchestratorService } from './orchestrator.service';
import { IBroker, IDataFeed } from '../../../packages/shared/src/interfaces';
import { SimulatedBroker } from '../bot-equities/src/adapters/SimulatedBroker';
import { SimulatedDataFeed } from '../bot-equities/src/adapters/SimulatedDataFeed';
import { BinanceBroker } from './adapters/BinanceBroker';
import { BinanceDataFeed } from './adapters/BinanceDataFeed';
import { Alerter } from '../../../packages/shared/src/alerter';

const brokerProvider = {
  provide: 'BROKER',
  useFactory: (): IBroker => {
    const mode = process.env.TRADING_MODE; // 'live', 'paper', or 'sim'
    if (mode === 'live') {
      console.log('Using LIVE Binance broker.');
      return new BinanceBroker();
    } else if (mode === 'paper') {
      console.log('Using PAPER trading Binance broker.');
      return new BinanceBroker(); // Binance broker handles paper trading internally
    }
    console.log('Using SIMULATED broker for crypto.');
    return new SimulatedBroker();
  },
};

const dataFeedProvider = {
  provide: 'DATA_FEED',
  useFactory: (): IDataFeed => {
    const mode = process.env.TRADING_MODE;
    if (mode === 'live' || mode === 'paper') {
      console.log(`Using LIVE Binance data feed for ${mode?.toUpperCase()} mode.`);
      return new BinanceDataFeed();
    }
    console.log('Using SIMULATED data feed for crypto.');
    return new SimulatedDataFeed();
  },
};

@Module({
  imports: [ConfigModule.forRoot({
      isGlobal: true,
  })],
  providers: [
    OrchestratorService,
    brokerProvider,
    dataFeedProvider,
    Alerter,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrchestratorService } from './orchestrator.service';
import { IBroker, IDataFeed } from '../../../packages/shared/src/interfaces';
import { SimulatedBroker } from './adapters/SimulatedBroker';
import { SimulatedDataFeed } from './adapters/SimulatedDataFeed';
import { ZerodhaBroker } from './adapters/ZerodhaBroker';
import { ZerodhaDataFeed } from './adapters/ZerodhaDataFeed';
import { Alerter } from '../../../packages/shared/src/alerter';

const brokerProvider = {
  provide: 'BROKER',
  useFactory: (): IBroker => {
    const mode = process.env.BROKER_MODE; // 'live', 'paper', or 'sim'
    if (mode === 'live') {
      console.log('Using LIVE broker (Zerodha).');
      return new ZerodhaBroker();
    }
    // For both 'paper' and 'sim' modes, we use the simulated broker.
    console.log(`Using SIMULATED broker for ${mode?.toUpperCase()} mode.`);
    return new SimulatedBroker();
  },
};

const dataFeedProvider = {
  provide: 'DATA_FEED',
  useFactory: (): IDataFeed => {
    const mode = process.env.BROKER_MODE;
    if (mode === 'live' || mode === 'paper') {
      // For both 'live' and 'paper' modes, we use the live data feed.
      console.log(`Using LIVE data feed (Zerodha) for ${mode?.toUpperCase()} mode.`);
      return new ZerodhaDataFeed();
    }
    console.log('Using SIMULATED data feed for SIM mode.');
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
    Alerter, // Provide Alerter
  ],
})
export class AppModule {}

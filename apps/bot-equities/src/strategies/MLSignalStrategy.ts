import { IBroker, IStrategy } from "../../../../packages/shared/src/interfaces";
import { Order, Tick, OrderSide } from "../../../../types";
import axios from 'axios';
import { Logger } from "@nestjs/common";

const ML_INFERENCE_API_URL = 'http://localhost:3002/api/predict';

/**
 * An example strategy that makes trading decisions based on signals
 * from an external Machine Learning model inference service.
 */
export class MLSignalStrategy implements IStrategy {
    private readonly logger = new Logger(MLSignalStrategy.name);
    
    constructor(
        public readonly id: string,
        public readonly symbol: string,
        private readonly broker: IBroker,
    ) {
        this.logger.log(`Initialized MLSignalStrategy [${id}] for ${symbol}`);
    }

    public async onTick(tick: Tick): Promise<void> {
        this.logger.debug(`[${this.id}] Received tick: ${tick.price}`);

        try {
            // 1. Gather features for the model (e.g., last N candles, indicators)
            const features = {
                price: tick.price,
                // ... other relevant features like volume, moving averages, etc.
            };

            // 2. Call the ML inference service to get a prediction
            const response = await axios.post(`${ML_INFERENCE_API_URL}/my-btc-model`, {
                features: features,
            });

            const prediction = response.data.prediction; // e.g., 'BUY', 'SELL', or 'HOLD'
            this.logger.log(`[${this.id}] Received prediction: ${prediction}`);

            // 3. Act on the prediction
            if (prediction === 'BUY') {
                await this.broker.placeOrder({
                    symbol: this.symbol,
                    side: OrderSide.BUY,
                    type: 'MARKET',
                    quantity: 0.01,
                });
                this.logger.log(`[${this.id}] Placed BUY order based on ML signal.`);
            } else if (prediction === 'SELL') {
                // ... logic to place a sell order
            }

        } catch (error) {
            this.logger.error(`[${this.id}] Error during ML prediction or trading`, error.message);
        }
    }
    
    public async onFill(order: Order): Promise<void> {
        this.logger.log(`[${this.id}] Order filled: ${JSON.stringify(order)}`);
        // Handle post-fill logic, e.g., setting up stop-loss or take-profit orders
    }
}

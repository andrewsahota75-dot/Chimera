// This file should ideally live in the shared package, e.g., packages/shared/src/interfaces.ts
import { Order, Position, Tick, OrderSide, OrderType } from '../../../types';
import { PlaceOrderParams as PlaceOrderParamsType } from './zod-schemas';

// Re-exporting the Zod-generated type for use in services
export type PlaceOrderParams = PlaceOrderParamsType;

/**
 * Interface for a trading strategy.
 * Each strategy instance will be managed by the Orchestrator.
 */
export interface IStrategy {
  /** A unique identifier for this strategy instance */
  readonly id: string;
  /** The symbol this strategy trades */
  readonly symbol: string;

  /**
   * This method is called by the Orchestrator on every new tick for the subscribed symbol.
   * @param tick The latest market data tick.
   */
  onTick(tick: Tick): Promise<void>;

  /**
   * This method is called when an order belonging to this strategy is filled.
   * @param order The filled or partially filled order.
   */
  onFill(order: Order): Promise<void>;
}


/**
 * Interface for a brokerage connection.
 * All methods are async and return a Promise.
 */
export interface IBroker {
  connect(): Promise<void>;
  placeOrder(params: PlaceOrderParams): Promise<Order | Order[]>; // Can return multiple orders for Bracket
  cancelOrder(orderId: string): Promise<boolean>;
  getPositions(): Promise<Position[]>;
  getOpenOrders(): Promise<Order[]>;
}

/**
 * Interface for a market data feed connection.
 * All methods are async and return a Promise.
 */
export interface IDataFeed {
  connect(): Promise<void>;
  subscribe(symbols: string[]): Promise<void>;
  on(event: 'tick', listener: (tick: Tick) => void): this;
  on(event: 'connect' | 'disconnect', listener: () => void): this;
}

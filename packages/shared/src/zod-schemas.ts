import { z } from 'zod';

export const OrderSideSchema = z.enum(['BUY', 'SELL']);
export const OrderTypeSchema = z.enum(['LIMIT', 'MARKET']);

export const BaseOrderSchema = z.object({
  symbol: z.string(),
  side: OrderSideSchema,
  quantity: z.number().positive(),
});

export const MarketOrderSchema = BaseOrderSchema.extend({
  type: z.literal('MARKET'),
});

export const LimitOrderSchema = BaseOrderSchema.extend({
  type: z.literal('LIMIT'),
  price: z.number().positive(),
});

/**
 * A bracket order consists of three orders:
 * 1. The main entry order (limit or market).
 * 2. A take-profit order (limit order).
 * 3. A stop-loss order (stop-loss market order).
 * The take-profit and stop-loss are placed only after the main order is filled.
 * If either the take-profit or stop-loss is executed, the other is automatically cancelled.
 */
export const BracketOrderSchema = BaseOrderSchema.extend({
  type: z.literal('BRACKET'),
  price: z.number().positive(), // Entry price for the limit order
  takeProfitPrice: z.number().positive(),
  stopLossPrice: z.number().positive(),
});

/**
 * A cover order consists of two orders:
 * 1. The main entry order (market order).
 * 2. A mandatory stop-loss order.
 * This is used to enforce risk management on intraday positions.
 */
export const CoverOrderSchema = BaseOrderSchema.extend({
  type: z.literal('COVER'),
  stopLossPrice: z.number().positive(),
});

export const PlaceOrderParamsSchema = z.union([
  MarketOrderSchema,
  LimitOrderSchema,
  BracketOrderSchema,
  CoverOrderSchema,
]);

export type PlaceOrderParams = z.infer<typeof PlaceOrderParamsSchema>;
export type BracketOrderParams = z.infer<typeof BracketOrderSchema>;
export type CoverOrderParams = z.infer<typeof CoverOrderSchema>;

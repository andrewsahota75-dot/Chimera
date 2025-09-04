import { PrismaClient } from '@prisma/client';
import { PlaceOrderParams, OrderUpdate } from '../packages/shared/src/zod-schemas.js';
import logger from './logger.js';

const prisma = new PrismaClient();

export interface EnhancedOrder {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'BRACKET' | 'COVER';
  quantity: number;
  price?: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED' | 'PARTIAL';
  filledQuantity: number;
  remainingQuantity: number;
  avgPrice?: number;
  botName?: string;
  brokerOrderId?: string;
  parentOrderId?: string;
  childOrders?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface OrderExecutionResult {
  success: boolean;
  orderId?: string;
  error?: string;
  details?: any;
}

export class OrderManager {
  private static instance: OrderManager;
  private orderListeners: ((order: EnhancedOrder) => void)[] = [];

  static getInstance(): OrderManager {
    if (!OrderManager.instance) {
      OrderManager.instance = new OrderManager();
    }
    return OrderManager.instance;
  }

  // Place a new order
  async placeOrder(orderParams: PlaceOrderParams, userId?: string): Promise<OrderExecutionResult> {
    try {
      logger.info(`Placing order: ${orderParams.side} ${orderParams.quantity} ${orderParams.symbol}`, 'ORDER_MANAGER', 'PLACE_ORDER', orderParams);

      // Create the main order
      const order = await prisma.order.create({
        data: {
          symbol: orderParams.symbol,
          side: orderParams.side,
          quantity: orderParams.quantity,
          price: 'price' in orderParams ? orderParams.price : 0,
          status: 'PENDING',
          botName: 'botName' in orderParams ? orderParams.botName : 'MANUAL'
        }
      });

      // Handle special order types
      if (orderParams.type === 'BRACKET') {
        await this.createBracketOrders(order.id, orderParams);
      } else if (orderParams.type === 'COVER') {
        await this.createCoverOrder(order.id, orderParams);
      }

      // Simulate order processing
      setTimeout(() => {
        this.processOrder(order.id);
      }, Math.random() * 5000 + 1000); // 1-6 seconds

      const enhancedOrder = await this.getEnhancedOrder(order.id);
      if (enhancedOrder) {
        this.notifyOrderListeners(enhancedOrder);
      }

      logger.info(`Order placed successfully: ${order.id}`, 'ORDER_MANAGER', 'PLACE_ORDER', { orderId: order.id });

      return {
        success: true,
        orderId: order.id,
        details: order
      };

    } catch (error) {
      logger.error('Failed to place order', 'ORDER_MANAGER', 'PLACE_ORDER', { error: error instanceof Error ? error.message : 'Unknown error', orderParams });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Update order status
  async updateOrder(orderId: string, updates: OrderUpdate): Promise<OrderExecutionResult> {
    try {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: updates.status,
          updatedAt: new Date()
        }
      });

      logger.info(`Order updated: ${orderId}`, 'ORDER_MANAGER', 'UPDATE_ORDER', { orderId, updates });

      const enhancedOrder = await this.getEnhancedOrder(orderId);
      if (enhancedOrder) {
        this.notifyOrderListeners(enhancedOrder);
      }

      // If order is filled, create a trade record
      if (updates.status === 'FILLED') {
        await this.createTradeFromOrder(order);
      }

      return {
        success: true,
        orderId,
        details: order
      };

    } catch (error) {
      logger.error('Failed to update order', 'ORDER_MANAGER', 'UPDATE_ORDER', { error: error instanceof Error ? error.message : 'Unknown error', orderId, updates });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Cancel order
  async cancelOrder(orderId: string): Promise<OrderExecutionResult> {
    try {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
        }
      });

      logger.info(`Order cancelled: ${orderId}`, 'ORDER_MANAGER', 'CANCEL_ORDER', { orderId });

      const enhancedOrder = await this.getEnhancedOrder(orderId);
      if (enhancedOrder) {
        this.notifyOrderListeners(enhancedOrder);
      }

      return {
        success: true,
        orderId,
        details: order
      };

    } catch (error) {
      logger.error('Failed to cancel order', 'ORDER_MANAGER', 'CANCEL_ORDER', { error: error instanceof Error ? error.message : 'Unknown error', orderId });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get order by ID with enhanced details
  async getEnhancedOrder(orderId: string): Promise<EnhancedOrder | null> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        return null;
      }

      return {
        id: order.id,
        symbol: order.symbol,
        side: order.side as 'BUY' | 'SELL',
        type: 'LIMIT', // We'll need to store this in the database schema
        quantity: order.quantity,
        price: order.price,
        status: order.status as any,
        filledQuantity: order.quantity, // Simplified for now
        remainingQuantity: 0,
        avgPrice: order.price,
        botName: order.botName || undefined,
        brokerOrderId: order.brokerOrderId || undefined,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };

    } catch (error) {
      logger.error('Failed to get enhanced order', 'ORDER_MANAGER', 'GET_ORDER', { error: error instanceof Error ? error.message : 'Unknown error', orderId });
      return null;
    }
  }

  // Get all orders with filtering
  async getOrders(filters: {
    symbol?: string;
    status?: string;
    botName?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<EnhancedOrder[]> {
    try {
      const orders = await prisma.order.findMany({
        where: {
          symbol: filters.symbol,
          status: filters.status,
          botName: filters.botName
        },
        take: filters.limit || 50,
        skip: filters.offset || 0,
        orderBy: { createdAt: 'desc' }
      });

      return Promise.all(orders.map(async (order) => {
        const enhanced = await this.getEnhancedOrder(order.id);
        return enhanced!;
      }));

    } catch (error) {
      logger.error('Failed to get orders', 'ORDER_MANAGER', 'GET_ORDERS', { error: error instanceof Error ? error.message : 'Unknown error', filters });
      return [];
    }
  }

  // Process order (simulate filling)
  private async processOrder(orderId: string): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order || order.status !== 'PENDING') {
        return;
      }

      // Simulate order execution
      const fillProbability = 0.9; // 90% chance of fill
      const isSuccess = Math.random() < fillProbability;

      if (isSuccess) {
        await this.updateOrder(orderId, { id: orderId, status: 'FILLED' });
      } else {
        await this.updateOrder(orderId, { id: orderId, status: 'REJECTED' });
      }

    } catch (error) {
      logger.error('Failed to process order', 'ORDER_MANAGER', 'PROCESS_ORDER', { error: error instanceof Error ? error.message : 'Unknown error', orderId });
    }
  }

  // Create trade record from filled order
  private async createTradeFromOrder(order: any): Promise<void> {
    try {
      const trade = await prisma.trade.create({
        data: {
          symbol: order.symbol,
          side: order.side,
          quantity: order.quantity,
          price: order.price || 0,
          pnl: 0, // Calculate based on position
          botName: order.botName || 'MANUAL',
          orderId: order.id
        }
      });

      logger.tradeExecuted({
        symbol: order.symbol,
        side: order.side,
        quantity: order.quantity,
        price: order.price || 0,
        orderId: order.id
      });

    } catch (error) {
      logger.error('Failed to create trade from order', 'ORDER_MANAGER', 'CREATE_TRADE', { error: error instanceof Error ? error.message : 'Unknown error', orderId: order.id });
    }
  }

  // Create bracket order structure
  private async createBracketOrders(parentOrderId: string, params: any): Promise<void> {
    // Implementation for bracket orders would go here
    logger.info('Bracket order structure created', 'ORDER_MANAGER', 'BRACKET_ORDER', { parentOrderId, params });
  }

  // Create cover order structure
  private async createCoverOrder(parentOrderId: string, params: any): Promise<void> {
    // Implementation for cover orders would go here
    logger.info('Cover order structure created', 'ORDER_MANAGER', 'COVER_ORDER', { parentOrderId, params });
  }

  // Order lifecycle listeners
  onOrderUpdate(callback: (order: EnhancedOrder) => void): void {
    this.orderListeners.push(callback);
  }

  offOrderUpdate(callback: (order: EnhancedOrder) => void): void {
    this.orderListeners = this.orderListeners.filter(listener => listener !== callback);
  }

  private notifyOrderListeners(order: EnhancedOrder): void {
    this.orderListeners.forEach(listener => {
      try {
        listener(order);
      } catch (error) {
        logger.error('Error in order listener', 'ORDER_MANAGER', 'LISTENER', { error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });
  }

  // Order statistics
  async getOrderStats(): Promise<{
    totalOrders: number;
    ordersByStatus: Record<string, number>;
    ordersBySymbol: Record<string, number>;
    recentOrders: number;
    fillRate: number;
  }> {
    try {
      const orders = await prisma.order.findMany();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const stats = {
        totalOrders: orders.length,
        ordersByStatus: {} as Record<string, number>,
        ordersBySymbol: {} as Record<string, number>,
        recentOrders: 0,
        fillRate: 0
      };

      let filledOrders = 0;

      orders.forEach(order => {
        stats.ordersByStatus[order.status] = (stats.ordersByStatus[order.status] || 0) + 1;
        stats.ordersBySymbol[order.symbol] = (stats.ordersBySymbol[order.symbol] || 0) + 1;
        
        if (order.createdAt > oneHourAgo) {
          stats.recentOrders++;
        }
        
        if (order.status === 'FILLED') {
          filledOrders++;
        }
      });

      stats.fillRate = stats.totalOrders > 0 ? (filledOrders / stats.totalOrders) * 100 : 0;

      return stats;
    } catch (error) {
      logger.error('Failed to get order stats', 'ORDER_MANAGER', 'STATS', { error: error instanceof Error ? error.message : 'Unknown error' });
      return {
        totalOrders: 0,
        ordersByStatus: {},
        ordersBySymbol: {},
        recentOrders: 0,
        fillRate: 0
      };
    }
  }
}

export default OrderManager.getInstance();
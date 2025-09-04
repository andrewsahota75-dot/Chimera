-- Database Performance Optimization: Index Creation
-- This file contains SQL commands to create indexes for better query performance

-- Indexes for User table
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");
CREATE INDEX IF NOT EXISTS "idx_user_created_at" ON "User"("createdAt");

-- Indexes for Position table
CREATE INDEX IF NOT EXISTS "idx_position_symbol" ON "Position"("symbol");
CREATE INDEX IF NOT EXISTS "idx_position_bot_name" ON "Position"("botName");
CREATE INDEX IF NOT EXISTS "idx_position_symbol_bot_name" ON "Position"("symbol", "botName");
CREATE INDEX IF NOT EXISTS "idx_position_created_at" ON "Position"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_position_updated_at" ON "Position"("updatedAt");

-- Indexes for Trade table
CREATE INDEX IF NOT EXISTS "idx_trade_symbol" ON "Trade"("symbol");
CREATE INDEX IF NOT EXISTS "idx_trade_side" ON "Trade"("side");
CREATE INDEX IF NOT EXISTS "idx_trade_bot_name" ON "Trade"("botName");
CREATE INDEX IF NOT EXISTS "idx_trade_order_id" ON "Trade"("orderId");
CREATE INDEX IF NOT EXISTS "idx_trade_timestamp" ON "Trade"("timestamp");
CREATE INDEX IF NOT EXISTS "idx_trade_created_at" ON "Trade"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_trade_symbol_side" ON "Trade"("symbol", "side");
CREATE INDEX IF NOT EXISTS "idx_trade_symbol_timestamp" ON "Trade"("symbol", "timestamp");

-- Indexes for Order table
CREATE INDEX IF NOT EXISTS "idx_order_symbol" ON "Order"("symbol");
CREATE INDEX IF NOT EXISTS "idx_order_side" ON "Order"("side");
CREATE INDEX IF NOT EXISTS "idx_order_status" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "idx_order_bot_name" ON "Order"("botName");
CREATE INDEX IF NOT EXISTS "idx_order_broker_order_id" ON "Order"("brokerOrderId");
CREATE INDEX IF NOT EXISTS "idx_order_created_at" ON "Order"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_order_updated_at" ON "Order"("updatedAt");
CREATE INDEX IF NOT EXISTS "idx_order_symbol_status" ON "Order"("symbol", "status");
CREATE INDEX IF NOT EXISTS "idx_order_status_created_at" ON "Order"("status", "createdAt");

-- Indexes for StrategyConfiguration table
CREATE INDEX IF NOT EXISTS "idx_strategy_config_name" ON "StrategyConfiguration"("name");
CREATE INDEX IF NOT EXISTS "idx_strategy_config_symbol" ON "StrategyConfiguration"("symbol");
CREATE INDEX IF NOT EXISTS "idx_strategy_config_bot_name" ON "StrategyConfiguration"("botName");
CREATE INDEX IF NOT EXISTS "idx_strategy_config_is_active" ON "StrategyConfiguration"("isActive");
CREATE INDEX IF NOT EXISTS "idx_strategy_config_created_at" ON "StrategyConfiguration"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_strategy_config_name_symbol" ON "StrategyConfiguration"("name", "symbol");

-- Indexes for BacktestResult table
CREATE INDEX IF NOT EXISTS "idx_backtest_result_strategy_config_id" ON "BacktestResult"("strategyConfigId");
CREATE INDEX IF NOT EXISTS "idx_backtest_result_total_return" ON "BacktestResult"("totalReturn");
CREATE INDEX IF NOT EXISTS "idx_backtest_result_sharpe_ratio" ON "BacktestResult"("sharpeRatio");
CREATE INDEX IF NOT EXISTS "idx_backtest_result_created_at" ON "BacktestResult"("createdAt");

-- Indexes for Heartbeat table
CREATE INDEX IF NOT EXISTS "idx_heartbeat_service" ON "Heartbeat"("service");
CREATE INDEX IF NOT EXISTS "idx_heartbeat_timestamp" ON "Heartbeat"("timestamp");
CREATE INDEX IF NOT EXISTS "idx_heartbeat_status" ON "Heartbeat"("status");

-- Indexes for AlertLog table
CREATE INDEX IF NOT EXISTS "idx_alert_log_level" ON "AlertLog"("level");
CREATE INDEX IF NOT EXISTS "idx_alert_log_service" ON "AlertLog"("service");
CREATE INDEX IF NOT EXISTS "idx_alert_log_timestamp" ON "AlertLog"("timestamp");
CREATE INDEX IF NOT EXISTS "idx_alert_log_level_timestamp" ON "AlertLog"("level", "timestamp");
CREATE INDEX IF NOT EXISTS "idx_alert_log_service_level" ON "AlertLog"("service", "level");

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "idx_position_pnl_analysis" ON "Position"("symbol", "pnl", "dayChange");
CREATE INDEX IF NOT EXISTS "idx_trade_performance_analysis" ON "Trade"("symbol", "side", "pnl", "timestamp");
CREATE INDEX IF NOT EXISTS "idx_order_execution_analysis" ON "Order"("symbol", "status", "createdAt", "updatedAt");
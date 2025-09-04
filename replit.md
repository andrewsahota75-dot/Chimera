# Overview

This is a comprehensive trading terminal application called "Chimera Trading Terminal" built with React, TypeScript, and modern web technologies. The system provides a sophisticated interface for monitoring market data, managing trading positions, executing orders, and analyzing trading performance across multiple asset classes including equities and cryptocurrencies.

The application features a microservices architecture with separate modules for different trading functions, real-time data feeds, risk management, and analytics. It supports both live and paper trading modes, multiple broker integrations (Zerodha, Binance, WazirX), and includes backtesting capabilities for strategy development.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Styling**: Tailwind CSS with custom color variables for consistent theming
- **State Management**: Zustand for lightweight, efficient state management
- **Charts**: Recharts library for financial data visualization
- **Build Tool**: Vite for fast development and optimized builds
- **Component Structure**: Modular component design with separate pages for different features

## Backend Architecture
- **Microservices Design**: Multiple NestJS applications handling specific domains:
  - `terminal-api`: REST API and WebSocket gateway for frontend communication
  - `bot-equities`: Equity trading bot with strategy execution
  - `bot-crypto`: Cryptocurrency trading bot
  - `risk-manager`: Real-time risk monitoring and circuit breakers
  - `data-harvester`: Historical data collection and storage
  - `ml-inference`: Machine learning model inference service
  - `backtesting`: Strategy backtesting engine

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **Schema Design**: Separate tables for positions, orders, trades, historical candles, and bot heartbeats
- **Real-time Data**: WebSocket connections for live market data feeds
- **Caching**: In-memory state management for real-time trading data

## Authentication and Authorization
- **Trading Modes**: Support for live, paper, and simulated trading environments
- **Broker Authentication**: Environment-based API key management for multiple brokers
- **Session Management**: Basic user session handling with role-based access

## Real-time Communication
- **WebSocket Gateway**: Bidirectional communication between frontend and backend
- **Event-driven Architecture**: Real-time updates for positions, orders, and market data
- **Message Broadcasting**: Live updates pushed to all connected clients

## Trading Infrastructure
- **Broker Abstraction**: Common interface (`IBroker`) supporting multiple brokers
- **Strategy Framework**: Pluggable strategy system with `IStrategy` interface
- **Order Management**: Support for market, limit, bracket, and cover orders
- **Risk Controls**: Real-time portfolio monitoring and automatic circuit breakers

## Monitoring and Alerting
- **Telegram Integration**: Automated alerts for critical events and errors
- **Prometheus Metrics**: Application performance and business metrics collection
- **Heartbeat System**: Service health monitoring with automatic failure detection
- **Logging**: Structured logging across all services

# External Dependencies

## Trading Brokers
- **Zerodha (Kite Connect)**: Indian equity markets integration
- **Binance**: Cryptocurrency trading with both live and testnet support
- **WazirX**: Additional cryptocurrency exchange integration

## Market Data Providers
- **Zerodha Data Feed**: Real-time equity market data via WebSocket
- **Binance WebSocket**: Cryptocurrency market data streams
- **Simulated Data Feeds**: Mock data generation for testing and development

## Third-party Services
- **Telegram Bot API**: For real-time alerts and notifications
- **Prisma**: Database ORM and migration management
- **Prometheus**: Metrics collection and monitoring

## Development Tools
- **Docker**: Containerization for microservices deployment
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast JavaScript/TypeScript bundling

## Machine Learning Infrastructure
- **ML Inference Service**: Standalone service for model predictions
- **Strategy Integration**: ML signals fed into trading strategies
- **Feature Engineering**: Real-time feature extraction from market data

## External APIs
- **Historical Data APIs**: For backtesting and strategy development
- **Economic Calendar APIs**: For fundamental analysis integration
- **News APIs**: For sentiment analysis and event-driven strategies
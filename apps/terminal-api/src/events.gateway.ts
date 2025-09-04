
import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Logger } from '@nestjs/common';

@WebSocketGateway(8081, {
  cors: {
    origin: '*', // Allow connections from any origin
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: WebSocket) {
    this.logger.log('Frontend client connected');
  }

  handleDisconnect(client: WebSocket) {
    this.logger.log('Frontend client disconnected');
  }

  // This method would be called by a messaging service that listens to RabbitMQ
  public broadcastEvent(eventData: any) {
    if (this.server) {
      this.server.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(eventData));
        }
      });
    }
  }
  
  // Example of handling messages from the client (e.g., manual order placement from UI)
  @SubscribeMessage('place_order')
  handlePlaceOrder(@MessageBody() data: any): void {
    this.logger.log(`Received place_order request from UI: ${JSON.stringify(data)}`);
    // Here, you would publish this message to RabbitMQ for the correct bot to consume.
  }
}

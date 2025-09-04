
import { Controller, Post, Param, HttpCode, HttpStatus, Logger } from '@nestjs/common';

@Controller('api/bots')
export class BotsController {
  private readonly logger = new Logger(BotsController.name);

  // In a real application, this would inject a messaging service to send commands to RabbitMQ.
  constructor() {}

  @Post(':botName/start')
  @HttpCode(HttpStatus.ACCEPTED)
  startBot(@Param('botName') botName: string) {
    this.logger.log(`Received START command for bot: ${botName}`);
    // Logic to publish a 'start' message to a topic like 'commands.bot_equities'
    return { message: `Start command issued for ${botName}` };
  }

  @Post(':botName/stop')
  @HttpCode(HttpStatus.ACCEPTED)
  stopBot(@Param('botName') botName: string) {
    this.logger.log(`Received STOP command for bot: ${botName}`);
    // Logic to publish a 'stop' message to a topic like 'commands.bot_equities'
    return { message: `Stop command issued for ${botName}` };
  }
}

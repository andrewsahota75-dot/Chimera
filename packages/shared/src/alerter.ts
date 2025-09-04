
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class Alerter {
  private readonly botToken: string;
  private readonly chatId: string;
  private readonly isEnabled: boolean;

  constructor(private configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');
    this.isEnabled = !!(this.botToken && this.chatId);

    if (!this.isEnabled) {
      console.warn('Telegram Alerter is disabled. Provide TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID env vars to enable.');
    }
  }

  /**
   * Sends a message to the configured Telegram chat.
   * @param message The message string to send. Supports basic markdown.
   * @param priority High priority messages will be sent with notifications disabled.
   */
  async send(message: string, priority: 'HIGH' | 'LOW' = 'LOW'): Promise<void> {
    if (!this.isEnabled) {
      console.log(`[ALERT SKIPPED]: ${message}`);
      return;
    }

    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    const payload = {
      chat_id: this.chatId,
      text: message,
      parse_mode: 'Markdown',
      disable_notification: priority === 'LOW',
    };

    try {
      await axios.post(url, payload);
      console.log('Successfully sent alert to Telegram.');
    } catch (error) {
      console.error('Failed to send Telegram alert:', error.response?.data || error.message);
    }
  }
}

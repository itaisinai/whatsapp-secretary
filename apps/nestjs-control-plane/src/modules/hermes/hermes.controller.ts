import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
} from '@nestjs/common';
import { HermesService } from './hermes.service';
import {
  SendMessageDto,
  MessageResponseDto,
  SearchEmailsDto,
} from '../../common/dto/message.dto';
import type { SearchEmailsResult } from '@whatsapp-secretary/shared';

@Controller('hermes')
export class HermesController {
  private readonly logger = new Logger(HermesController.name);

  constructor(private readonly hermesService: HermesService) {}

  @Post('message')
  @HttpCode(HttpStatus.OK)
  async sendMessage(@Body() dto: SendMessageDto): Promise<MessageResponseDto> {
    this.logger.log(`Received message: "${dto.message}"`);

    const result = await this.hermesService.sendMessage(
      dto.message,
      dto.sessionId,
      dto.metadata,
    );

    return {
      sessionId: dto.sessionId || 'default',
      response: result.response,
      timestamp: new Date(),
      sources: result.sources,
      toolsUsed: result.toolsUsed,
    };
  }

  @Post('search-emails')
  @HttpCode(HttpStatus.OK)
  async searchEmails(@Body() dto: SearchEmailsDto): Promise<SearchEmailsResult> {
    this.logger.log('Direct email search requested');

    const params = {
      sender: dto.sender,
      text: dto.text,
      receivedAfter: dto.receivedAfter ? new Date(dto.receivedAfter) : undefined,
      receivedBefore: dto.receivedBefore ? new Date(dto.receivedBefore) : undefined,
      unreadOnly: dto.unreadOnly,
      limit: dto.limit,
    };

    return this.hermesService.searchEmails(params);
  }

  @Get('test')
  async testConnection(): Promise<{
    status: string;
    connections: {
      hermes: boolean;
      email: boolean;
      mcp: boolean;
    };
  }> {
    const connections = await this.hermesService.testConnection();

    return {
      status: 'ok',
      connections,
    };
  }

  @Get('sessions')
  async listSessions(): Promise<{
    sessions: Array<{
      id: string;
      createdAt: Date;
      lastActivity: Date;
      messageCount: number;
    }>;
  }> {
    const sessions = this.hermesService.listSessions();
    return { sessions };
  }

  @Get('session')
  async getSession(@Query('id') sessionId: string): Promise<{
    session: {
      id: string;
      createdAt: Date;
      lastActivity: Date;
      messageCount: number;
    } | null;
  }> {
    const session = this.hermesService.getSession(sessionId);
    return { session: session || null };
  }
}

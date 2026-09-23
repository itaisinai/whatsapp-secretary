import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class MessageResponseDto {
  sessionId!: string;
  response!: string;
  timestamp!: Date;
  sources?: string[];
  toolsUsed?: string[];
}

export class SearchEmailsDto {
  @IsString()
  @IsOptional()
  sender?: string;

  @IsString()
  @IsOptional()
  text?: string;

  @IsString()
  @IsOptional()
  receivedAfter?: string; // ISO date string

  @IsString()
  @IsOptional()
  receivedBefore?: string; // ISO date string

  @IsOptional()
  unreadOnly?: boolean;

  @IsOptional()
  limit?: number;
}

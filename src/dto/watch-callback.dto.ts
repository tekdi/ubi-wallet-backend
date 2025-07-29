import { IsString, IsOptional, IsObject } from 'class-validator';

export class WatchCallbackDto {
  @IsString()
  @IsOptional()
  identifier?: string;

  @IsString()
  @IsOptional()
  recordPublicId?: string;

  @IsString()
  @IsOptional()
  messageId?: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  timestamp?: string;
}

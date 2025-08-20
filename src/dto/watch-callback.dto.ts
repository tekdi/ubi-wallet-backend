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
  type?: string;

  @IsString()
  @IsOptional()
  message?: string;
}

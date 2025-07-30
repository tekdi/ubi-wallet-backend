import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class WatchVcDto {
  @IsString()
  @IsNotEmpty()
  vcPublicId: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsOptional()
  identifier?: string;

  @IsOptional()
  @IsString()
  callbackUrl?: string;

  @IsOptional()
  @IsString()
  forwardWatcherCallbackUrl?: string;
}

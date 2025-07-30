import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUrl,
  MaxLength,
} from 'class-validator';

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
  @IsUrl()
  @MaxLength(1500)
  callbackUrl?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(1500)
  forwardWatcherCallbackUrl?: string;
}

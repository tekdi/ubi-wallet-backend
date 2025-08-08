import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
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
  @IsString()
  @MaxLength(1500)
  callbackUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  forwardWatcherCallbackUrl?: string;
}

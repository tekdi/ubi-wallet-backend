import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class LoginRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  deviceInfo?: string;
}

export class LoginVerifyDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class ResendOtpDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
} 
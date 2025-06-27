import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { OnboardUserDto } from '../dto/onboard-user.dto';
import { UploadVcDto } from '../dto/upload-vc.dto';
import {
  LoginRequestDto,
  LoginVerifyDto,
  ResendOtpDto,
} from '../dto/login.dto';

@Controller('api/wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('onboard')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async onboardUser(@Body() data: OnboardUserDto) {
    return await this.walletService.onboardUser(data);
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async login(@Body() data: LoginRequestDto) {
    return await this.walletService.login(data);
  }

  @Post('login/verify')
  async verifyLogin(@Body() data: LoginVerifyDto) {
    return await this.walletService.verifyLogin(data);
  }

  @Post('login/resend-otp')
  async resendOtp(@Body() data: ResendOtpDto) {
    return await this.walletService.resendOtp(data);
  }

  @Get(':user_id/vcs')
  async getAllVCs(
    @Param('user_id') user_id: string,
    @Headers('authorization') authorization: string,
  ) {
    const token = this.extractToken(authorization);
    return await this.walletService.getAllVCs(user_id, token);
  }

  @Get(':user_id/vcs/:vcId')
  async getVCById(
    @Param('user_id') user_id: string,
    @Param('vcId') vcId: string,
    @Headers('authorization') authorization: string,
  ) {
    const token = this.extractToken(authorization);
    return await this.walletService.getVCById(user_id, vcId, token);
  }

  @Post(':user_id/vcs/upload-qr')
  async uploadVCFromQR(
    @Param('user_id') user_id: string,
    @Body() data: UploadVcDto,
    @Headers('authorization') authorization: string,
  ) {
    const token = this.extractToken(authorization);
    return await this.walletService.uploadVCFromQR(user_id, data, token);
  }

  private extractToken(authorization: string): string {
    if (!authorization) {
      throw new UnauthorizedException('Authorization header is required');
    }

    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      throw new UnauthorizedException(
        'Invalid authorization header format. Expected: Bearer <token>',
      );
    }

    return parts[1];
  }
}

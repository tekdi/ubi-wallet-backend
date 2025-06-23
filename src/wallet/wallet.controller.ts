import { Controller, Post, Get, Body, Param, UsePipes, ValidationPipe } from '@nestjs/common';
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
  async getAllVCs(@Param('user_id') user_id: string) {
    return await this.walletService.getAllVCs(user_id);
  }

  @Get(':user_id/vcs/:vcId')
  async getVCById(
    @Param('user_id') user_id: string,
    @Param('vcId') vcId: string,
  ) {
    return await this.walletService.getVCById(user_id, vcId);
  }

  @Post(':user_id/vcs/upload-qr')
  async uploadVCFromQR(
    @Param('user_id') user_id: string,
    @Body() data: UploadVcDto,
  ) {
    return await this.walletService.uploadVCFromQR(user_id, data);
  }
}

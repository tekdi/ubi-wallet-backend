import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WatcherCronService } from './watcher-cron.service';
import { OnboardUserDto } from '../dto/onboard-user.dto';
import { UploadVcDto } from '../dto/upload-vc.dto';
import { WatchVcDto } from '../dto/watch-vc.dto';
import { WatchCallbackDto } from '../dto/watch-callback.dto';
import {
  LoginRequestDto,
  LoginVerifyDto,
  ResendOtpDto,
} from '../dto/login.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentToken } from '../common/decorators/user.decorator';

@Controller('api/wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly watcherCronService: WatcherCronService,
  ) {}

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
  @UseGuards(AuthGuard)
  async getAllVCs(
    @Param('user_id') user_id: string,
    @CurrentToken() token: string,
  ) {
    return await this.walletService.getAllVCs(user_id, token);
  }

  @Get(':user_id/vcs/:vcId')
  @UseGuards(AuthGuard)
  async getVCById(
    @Param('user_id') user_id: string,
    @Param('vcId') vcId: string,
    @CurrentToken() token: string,
  ) {
    return await this.walletService.getVCById(user_id, vcId, token);
  }

  @Post(':user_id/vcs/upload-qr')
  @UseGuards(AuthGuard)
  async uploadVCFromQR(
    @Param('user_id') user_id: string,
    @Body() data: UploadVcDto,
    @CurrentToken() token: string,
  ) {
    return await this.walletService.uploadVCFromQR(user_id, data, token);
  }

  @Post('vcs/watch')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async watchVC(@Body() data: WatchVcDto, @CurrentToken() token: string) {
    return await this.walletService.watchVC(data, token);
  }

  @Post('vcs/watch/callback')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  watchCallback(@Body() data: WatchCallbackDto) {
    return this.walletService.processWatchCallback(data);
  }
}

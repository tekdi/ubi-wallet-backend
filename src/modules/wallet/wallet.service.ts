import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  IWalletAdapter,
  IWalletAdapterWithOtp,
} from '../../adapters/interfaces/wallet-adapter.interface';
import { OnboardUserDto } from '../../dto/onboard-user.dto';
import { UploadVcDto } from '../../dto/upload-vc.dto';
import {
  LoginRequestDto,
  LoginVerifyDto,
  ResendOtpDto,
} from '../../dto/login.dto';

@Injectable()
export class WalletService {
  constructor(
    @Inject('WALLET_ADAPTER') private readonly walletAdapter: IWalletAdapter,
  ) {}

  async onboardUser(data: OnboardUserDto) {
    console.log('=============')
    return await this.walletAdapter.onboardUser(data);
  }

  async login(data: LoginRequestDto) {
    return await this.walletAdapter.login(data);
  }

  async verifyLogin(data: LoginVerifyDto) {
    if (!this.isOtpSupported()) {
      throw new BadRequestException(
        'OTP verification not supported by this wallet provider',
      );
    }
    return await (this.walletAdapter as IWalletAdapterWithOtp).verifyLogin(
      data,
    );
  }

  async resendOtp(data: ResendOtpDto) {
    if (!this.isOtpSupported()) {
      throw new BadRequestException(
        'OTP resend not supported by this wallet provider',
      );
    }
    return await (this.walletAdapter as IWalletAdapterWithOtp).resendOtp(data);
  }

  private isOtpSupported(): boolean {
    return (
      'verifyLogin' in this.walletAdapter && 'resendOtp' in this.walletAdapter
    );
  }

  async getAllVCs(user_id: string) {
    return await this.walletAdapter.getAllVCs(user_id);
  }

  async getVCById(user_id: string, vcId: string) {
    return await this.walletAdapter.getVCById(user_id, vcId);
  }

  async uploadVCFromQR(user_id: string, data: UploadVcDto) {
    return await this.walletAdapter.uploadVCFromQR(user_id, data.qrData);
  }
}

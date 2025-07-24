import { Injectable, Inject } from '@nestjs/common';
import {
  IWalletAdapter,
  IWalletAdapterWithOtp,
  LoginVerifyResponse,
  ResendOtpResponse,
  WatchVcDto,
  WatchVcResponse,
} from '../adapters/interfaces/wallet-adapter.interface';
import { OnboardUserDto } from '../dto/onboard-user.dto';
import { UploadVcDto } from '../dto/upload-vc.dto';
import { WatchCallbackDto } from '../dto/watch-callback.dto';
import {
  LoginRequestDto,
  LoginVerifyDto,
  ResendOtpDto,
} from '../dto/login.dto';

@Injectable()
export class WalletService {
  constructor(
    @Inject('WALLET_ADAPTER') private readonly walletAdapter: IWalletAdapter,
  ) {}

  async onboardUser(data: OnboardUserDto) {
    return await this.walletAdapter.onboardUser(data);
  }

  async login(data: LoginRequestDto) {
    return await this.walletAdapter.login(data);
  }

  async verifyLogin(data: LoginVerifyDto): Promise<LoginVerifyResponse> {
    if (!this.isOtpSupported()) {
      return {
        statusCode: 400,
        message: 'OTP verification not supported by this wallet provider',
      };
    }
    return await (this.walletAdapter as IWalletAdapterWithOtp).verifyLogin(
      data,
    );
  }

  async resendOtp(data: ResendOtpDto): Promise<ResendOtpResponse> {
    if (!this.isOtpSupported()) {
      return {
        statusCode: 400,
        message: 'OTP resend not supported by this wallet provider',
      };
    }
    return await (this.walletAdapter as IWalletAdapterWithOtp).resendOtp(data);
  }

  private isOtpSupported(): boolean {
    return (
      'verifyLogin' in this.walletAdapter && 'resendOtp' in this.walletAdapter
    );
  }

  async getAllVCs(user_id: string, token: string) {
    return await this.walletAdapter.getAllVCs(user_id, token);
  }

  async getVCById(user_id: string, vcId: string, token: string) {
    return await this.walletAdapter.getVCById(user_id, vcId, token);
  }

  async uploadVCFromQR(user_id: string, data: UploadVcDto, token: string) {
    return await this.walletAdapter.uploadVCFromQR(user_id, data.qrData, token);
  }

  async watchVC(data: WatchVcDto, token: string): Promise<WatchVcResponse> {
    if (!this.isWatchSupported()) {
      return {
        statusCode: 400,
        message: 'Watch functionality not supported by this wallet provider',
      };
    }
    return await this.walletAdapter.watchVC!(data, token);
  }

  private isWatchSupported(): boolean {
    return (
      'watchVC' in this.walletAdapter &&
      typeof this.walletAdapter.watchVC === 'function'
    );
  }

  processWatchCallback(data: WatchCallbackDto) {
    // Process watch callback notification
    // This method can be extended to implement custom logic
    // such as sending notifications to users, updating local cache, etc.

    console.log('Processing watch callback:', data);

    // Example: You could implement notification logic here
    // await this.notificationService.sendNotification(data);

    return {
      statusCode: 200,
      message: 'Watch callback processed successfully',
      data: {
        processed: true,
        timestamp: new Date().toISOString(),
        recordPublicId: data.recordPublicId,
      },
    };
  }
}

import { Injectable, Inject } from '@nestjs/common';
import axios from 'axios';
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
import { WalletVCService } from './wallet-vc.service';
import { WalletVCWatcherService } from './wallet-vc-watcher.service';
import { LoggerService } from '../common/logger/logger.service';
import { UserService } from '../users/user.service';

@Injectable()
export class WalletService {
  constructor(
    @Inject('WALLET_ADAPTER') private readonly walletAdapter: IWalletAdapter,
    private readonly walletVCService: WalletVCService,
    private readonly walletVCWatcherService: WalletVCWatcherService,
    private readonly logger: LoggerService,
    private readonly userService: UserService,
  ) {}

  async onboardUser(data: OnboardUserDto) {
    try {
      // Check if username already exists
      const usernameExists = await this.userService.checkUsernameExists(
        data.username,
      );
      if (usernameExists) {
        return {
          statusCode: 409,
          message: 'Username already exists',
        };
      }

      // Check if email already exists (if email is provided)
      if (data.email) {
        const emailExists = await this.userService.checkEmailExists(data.email);
        if (emailExists) {
          return {
            statusCode: 409,
            message: 'Email already registered',
          };
        }
      }

      // Call adapter to create user in external wallet service
      const result = await this.walletAdapter.onboardUser(data);

      // If external service creation is successful, create user in local database
      if (result.statusCode === 200 && result.data) {
        try {
          const user = await this.userService.createUser({
            firstName: data.firstName,
            lastName: data.lastName,
            accountId: result.data.accountId,
            username: data.username,
            password: data.password,
            token: result.data.token,
            did: result.data.did,
            phone: data.phone,
            email: data.email,
            createdBy: '',
          });

          // Update the response with the created user data
          return {
            ...result,
            data: {
              ...result.data,
              user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                accountId: user.accountId,
                status: user.status,
              },
            },
          };
        } catch (dbError) {
          this.logger.logError(
            'Failed to create user in local database',
            dbError,
            'WalletService.onboardUser',
          );
          return {
            statusCode: 500,
            message: 'User created in wallet but failed to save locally',
          };
        }
      }

      return result;
    } catch (error) {
      this.logger.logError(
        'Failed to onboard user',
        error,
        'WalletService.onboardUser',
      );
      return {
        statusCode: 500,
        message: 'Failed to onboard user',
      };
    }
  }

  async login(data: LoginRequestDto) {
    try {
      // Find user in local database
      const user = await this.userService.findByUsername(data.username);
      if (!user) {
        return {
          statusCode: 401,
          message: 'Invalid credentials',
        };
      }

      // Validate password
      const isValidPassword = await this.userService.validatePassword(
        user,
        data.password,
      );
      if (!isValidPassword) {
        return {
          statusCode: 401,
          message: 'Invalid credentials',
        };
      }

      // Check if user is blocked
      if (user.blocked) {
        return {
          statusCode: 403,
          message: 'User account is blocked',
        };
      }

      // Call adapter for login (if needed for external service validation)
      const result = await this.walletAdapter.login(data);

      // If adapter login is successful, return user data from local database
      if (result.statusCode === 200) {
        return {
          statusCode: 200,
          message: 'Login successful',
          data: {
            token: user.token,
            accountId: user.accountId,
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              username: user.username,
            },
          },
        };
      }

      return result;
    } catch (error) {
      this.logger.logError('Failed to login', error, 'WalletService.login');
      return {
        statusCode: 500,
        message: 'Failed to login',
      };
    }
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
    try {
      // Upload VC to wallet provider with user DID
      const uploadResult = await this.walletAdapter.uploadVCFromQR(
        user_id,
        data.qrData,
        token,
      );

      // If upload is successful, create a record in wallet_vcs table
      if (uploadResult.statusCode === 200 || uploadResult.statusCode === 201) {
        try {
          // Extract VC public ID from QR data URL
          const vcPublicId = data.qrData.split('/').pop();
          if (vcPublicId) {
            // Get provider name from adapter
            const providerName = this.getProviderName();

            // Get user ID from token
            const user = await this.userService.findByToken(token);
            if (!user) {
              this.logger.logError(
                'User not found for token during VC upload',
                new Error('User not found'),
                'WalletService.uploadVCFromQR',
              );
              // Continue with upload even if user lookup fails
            }

            // Create wallet VC record
            await this.walletVCService.createWalletVC(
              vcPublicId,
              providerName,
              user?.id || '',
              user?.id || '', // Use user UUID for createdBy
              uploadResult.data?.vcJson,
            );

            this.logger.log(
              `Wallet VC record created for VC: ${vcPublicId}`,
              'WalletService.uploadVCFromQR',
            );

            // Attempt to register watcher for the uploaded VC using existing watchVC method
            try {
              const watchData: WatchVcDto = {
                vcPublicId,
                identifier: '', // Will be set by the adapter
              };
              await this.watchVC(watchData, token);
            } catch (watchError) {
              this.logger.logError(
                `Error registering watcher for VC: ${vcPublicId}`,
                watchError,
                'WalletService.uploadVCFromQR',
              );
            }
          }
        } catch (dbError) {
          this.logger.logError(
            'Failed to create wallet VC record',
            dbError,
            'WalletService.uploadVCFromQR',
          );
          // Don't fail the upload if database record creation fails
        }
      }

      return uploadResult;
    } catch (error) {
      this.logger.logError(
        'Failed to upload VC from QR',
        error,
        'WalletService.uploadVCFromQR',
      );
      return {
        statusCode: 500,
        message: 'Failed to upload VC from QR',
      };
    }
  }

  async watchVC(data: WatchVcDto, token: string): Promise<WatchVcResponse> {
    if (!this.isWatchSupported()) {
      return {
        statusCode: 400,
        message: 'Watch functionality not supported by this wallet provider',
      };
    }

    try {
      // Get user ID from token
      const user = await this.userService.findByToken(token);
      if (!user) {
        return {
          statusCode: 401,
          message: 'Invalid token or user not found',
        };
      }

      let forwardWatcherCallbackUrl = '';

      // Check if the provided callback URL is external (not the wallet backend)
      if (data.callbackUrl) {
        const walletBackendUrl = process.env.WALLET_SERVICE_BASE_URL || '';
        const isExternalUrl =
          !walletBackendUrl || !data.callbackUrl.includes(walletBackendUrl);

        if (isExternalUrl) {
          forwardWatcherCallbackUrl = data.callbackUrl;
          this.logger.log(
            `Setting external forward callback URL: ${data.callbackUrl}`,
            'WalletService.watchVC',
          );
        }
      }

      // Set callback URL to the wallet backend service URL
      data.callbackUrl = `${process.env.WALLET_SERVICE_BASE_URL}/api/wallet/vcs/watch/callback`;

      // Call the adapter to register watcher
      const result = await this.walletAdapter.watchVC!(data);

      // If successful, create or update watcher record
      if (result.statusCode === 200 || result.statusCode === 201) {
        try {
          const provider = this.getProviderName();
          const watcherEmail = result.data?.watcherEmail || '';
          const watcherCallbackUrl = data.callbackUrl;

          // First check if watcher exists with the specific combination
          const existingWatcher =
            await this.walletVCWatcherService.findWatcherByCombination(
              data.vcPublicId,
              user.id,
              provider,
              watcherEmail,
              watcherCallbackUrl,
            );

          if (!existingWatcher) {
            // Create new watcher record
            this.logger.log(
              `Creating new watcher record for VC: ${data.vcPublicId}`,
              'WalletService.watchVC',
            );
            await this.walletVCWatcherService.createWatcher(
              data.vcPublicId,
              user.id,
              provider,
              watcherEmail,
              watcherCallbackUrl,
              user.id, // createdBy
              forwardWatcherCallbackUrl || '', // forward callback URL (undefined if not external)
            );
          }

          if (forwardWatcherCallbackUrl) {
            await this.walletVCWatcherService.updateWatcherForwardCallbackUrl(
              data.vcPublicId,
              user.id,
              provider,
              watcherEmail,
              forwardWatcherCallbackUrl,
              user.id,
            );
          }

          // Now update the watcher status
          const updateResult =
            await this.walletVCWatcherService.updateWatcherStatus(
              data.vcPublicId,
              user.id,
              provider,
              watcherEmail,
              true,
              user.id, // updatedBy
            );

          if (updateResult.success) {
            this.logger.log(updateResult.message, 'WalletService.watchVC');
          } else {
            this.logger.logError(
              updateResult.message,
              new Error(updateResult.message),
              'WalletService.watchVC',
            );
          }
        } catch (dbError) {
          this.logger.logError(
            `Failed to update watcher status in database for VC: ${data.vcPublicId}`,
            dbError,
            'WalletService.watchVC',
          );
          // Don't fail the watch operation if database update fails
        }
      } else {
        this.logger.logError(
          `Failed to register watcher for VC: ${data.vcPublicId}. Status: ${result.statusCode}, Message: ${result.message}`,
          new Error(result.message),
          'WalletService.watchVC',
        );
      }

      return result;
    } catch (error) {
      this.logger.logError(
        `Error registering watcher for VC: ${data.vcPublicId}`,
        error,
        'WalletService.watchVC',
      );
      return {
        statusCode: 500,
        message: `Failed to register watcher for VC: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private getProviderName(): string {
    // Get provider name from adapter class name
    const adapterClassName = this.walletAdapter.constructor.name;
    return adapterClassName.replace('Adapter', '').toLowerCase();
  }

  private isWatchSupported(): boolean {
    return (
      'watchVC' in this.walletAdapter &&
      typeof this.walletAdapter.watchVC === 'function'
    );
  }

  async processWatchCallback(data: WatchCallbackDto) {
    try {
      this.logger.log(
        `Processing watch callback for recordPublicId: ${data.recordPublicId}`,
        'WalletService.processWatchCallback',
      );

      // Validate input
      if (!data.recordPublicId) {
        return this.createErrorResponse(400, 'recordPublicId is required');
      }

      // Get watchers
      const watchers = await this.getWatchersForCallback(data.recordPublicId);
      if (!watchers || watchers.length === 0) {
        return this.createErrorResponse(
          404,
          'No watchers found for the given recordPublicId',
          {
            recordPublicId: data.recordPublicId,
          },
        );
      }

      // Process callbacks
      const callbackResults = await this.processAllCallbacks(watchers, data);

      // Process with adapter
      const adapterResults = await this.processAdapterCallback(data);

      // Create success response
      return this.createSuccessResponse(
        data.recordPublicId,
        callbackResults,
        adapterResults,
      );
    } catch (error) {
      this.logger.logError(
        'Failed to process watch callback',
        error,
        'WalletService.processWatchCallback',
      );

      return this.createErrorResponse(500, 'Failed to process watch callback', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async getWatchersForCallback(recordPublicId: string) {
    return await this.walletVCWatcherService.getWatchersByVcPublicId(
      recordPublicId,
    );
  }

  private async processAllCallbacks(watchers: any[], data: WatchCallbackDto) {
    const walletBackendUrl = process.env.WALLET_SERVICE_BASE_URL || '';
    let forwardedCallbacks = 0;
    let failedCallbacks = 0;

    for (const watcher of watchers) {
      const result = await this.processSingleCallback(
        watcher,
        data,
        walletBackendUrl,
      );
      if (result.success) {
        forwardedCallbacks++;
      } else {
        failedCallbacks++;
      }
    }

    return { forwardedCallbacks, failedCallbacks };
  }

  private async processSingleCallback(
    watcher: any,
    data: WatchCallbackDto,
    walletBackendUrl: string,
  ) {
    const callbackUrl =
      watcher.forwardWatcherCallbackUrl?.trim() ||
      watcher.watcherCallbackUrl?.trim();

    if (!callbackUrl) {
      this.logger.log(
        `No callback URL set for watcher: ${watcher.id}`,
        'WalletService.processSingleCallback',
      );
      return { success: false };
    }

    if (this.isWalletBackendUrl(callbackUrl, walletBackendUrl)) {
      this.logger.log(
        `Skipping callback forwarding to wallet backend URL: ${callbackUrl}`,
        'WalletService.processSingleCallback',
      );
      return { success: false };
    }

    try {
      const response = await this.forwardCallbackToExternalUrl(callbackUrl, data);
      
      if (response.success) {
        this.logger.log(
          `Successfully forwarded callback to: ${callbackUrl}`,
          'WalletService.processSingleCallback',
        );
        return { success: true };
      } else {
        this.logger.logError(
          `Failed to forward callback to: ${callbackUrl}. Status: ${response.statusCode}, Message: ${response.message}`,
          new Error(response.message),
          'WalletService.processSingleCallback',
        );
        return { success: false };
      }
    } catch (error) {
      this.logger.logError(
        `Error forwarding callback to: ${callbackUrl}`,
        error,
        'WalletService.processSingleCallback',
      );
      return { success: false };
    }
  }

  private isWalletBackendUrl(
    callbackUrl: string,
    walletBackendUrl: string,
  ): boolean {
    return !walletBackendUrl || callbackUrl.includes(walletBackendUrl);
  }

  private async processAdapterCallback(data: WatchCallbackDto) {
    if (typeof this.walletAdapter.processCallback !== 'function') {
      this.logger.log(
        'Wallet adapter does not support processCallback method',
        'WalletService.processAdapterCallback',
      );
      return { success: false, processed: false };
    }

    try {
      this.logger.log(
        'Processing callback with wallet adapter',
        'WalletService.processAdapterCallback',
      );

      const adapterResult = await this.walletAdapter.processCallback(data);

      if (adapterResult.success) {
        this.logger.log(
          `Successfully processed callback with wallet adapter: ${adapterResult.message}`,
          'WalletService.processAdapterCallback',
        );
        return { success: true, processed: true };
      } else {
        this.logger.logError(
          `Failed to process callback with wallet adapter: ${adapterResult.message}`,
          new Error(adapterResult.message),
          'WalletService.processAdapterCallback',
        );
        return { success: false, processed: false };
      }
    } catch (error) {
      this.logger.logError(
        'Error processing callback with wallet adapter',
        error,
        'WalletService.processAdapterCallback',
      );
      return { success: false, processed: false };
    }
  }

  private createErrorResponse(
    statusCode: number,
    message: string,
    additionalData?: any,
  ) {
    return {
      statusCode,
      message,
      data: {
        processed: false,
        timestamp: new Date().toISOString(),
        ...additionalData,
      },
    };
  }

  private createSuccessResponse(
    recordPublicId: string,
    callbackResults: any,
    adapterResults: any,
  ) {
    const { forwardedCallbacks, failedCallbacks } = callbackResults;
    const adapterProcessedCallbacks = adapterResults.processed ? 1 : 0;
    const totalProcessed = forwardedCallbacks + adapterProcessedCallbacks;

    const message = `Watch callback processed successfully. Forwarded: ${forwardedCallbacks}, Adapter processed: ${adapterProcessedCallbacks}, Failed: ${failedCallbacks}`;

    this.logger.log(message, 'WalletService.createSuccessResponse');

    return {
      statusCode: 200,
      message,
      data: {
        processed: true,
        timestamp: new Date().toISOString(),
        recordPublicId,
        forwardedCallbacks,
        adapterProcessedCallbacks,
        failedCallbacks,
        totalProcessed,
      },
    };
  }

  /**
   * Forward callback data to external URL
   */
  private async forwardCallbackToExternalUrl(
    callbackUrl: string,
    data: WatchCallbackDto,
  ): Promise<{ success: boolean; statusCode: number; message: string }> {
    try {
      // Validate URL format
      try {
        new URL(callbackUrl);
      } catch (e) {
        this.logger.logError(
          `Invalid callback URL format: ${callbackUrl}`,
          e,
          'WalletService.forwardCallbackToExternalUrl',
        );
        return {
          success: false,
          statusCode: 400,
          message: 'Invalid callback URL format',
        };
      }

      const response = await axios.post(callbackUrl, data, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      // Consider 200 or 201 as success status codes
      const isSuccess = response.status === 200 || response.status === 201;

      return {
        success: isSuccess,
        statusCode: response.status,
        message: isSuccess
          ? `Successfully forwarded callback (HTTP ${response.status})`
          : `Callback forwarded but returned status ${response.status}`,
      };
    } catch (error: any) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        return {
          success: false,
          statusCode: error.response.status,
          message: `HTTP ${error.response.status}: ${error.response.statusText || 'Unknown error'}`,
        };
      } else if (error.request) {
        // The request was made but no response was received
        return {
          success: false,
          statusCode: 0,
          message: 'No response received from callback URL',
        };
      } else {
        // Something happened in setting up the request that triggered an Error
        return {
          success: false,
          statusCode: 0,
          message: error.message || 'Unknown error occurred',
        };
      }
    }
  }

  async getVCJsonByVcIdentifier(
    userId: string,
    vcIdentifier: string,
    token: string,
  ) {
    // Check if the adapter supports this method
    if (!this.walletAdapter.getVCJsonByVcIdentifier) {
      return {
        success: false,
        message: 'VC JSON retrieval not supported by this wallet provider',
        statusCode: 501,
      };
    }

    return await this.walletAdapter.getVCJsonByVcIdentifier(
      userId,
      vcIdentifier,
      token,
    );
  }
}

import { Injectable, Inject } from '@nestjs/common';
import { WalletVCService } from './wallet-vc.service';
import { LoggerService } from '../common/logger/logger.service';
import { IWalletAdapter, WatchVcDto } from '../adapters/interfaces/wallet-adapter.interface';

export interface WatcherRegistrationResult {
  success: boolean;
  statusCode: number;
  message: string;
  watcherEmail?: string;
  watcherCallbackUrl?: string;
}

@Injectable()
export class WatcherRegistrationService {
  constructor(
    private readonly walletVCService: WalletVCService,
    @Inject('WALLET_ADAPTER') private readonly walletAdapter: IWalletAdapter,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Register watcher for a single VC
   * @param vcPublicId - The public ID of the VC
   * @param provider - The wallet provider name
   * @param triggeredBy - Who triggered the registration (e.g., 'user-upload', 'cron-job', 'manual')
   * @param userId - The user ID who triggered the registration (optional)
   * @returns WatcherRegistrationResult
   */
  async registerWatcherForVC(
    vcPublicId: string,
    provider: string,
    triggeredBy: string,
    userId?: string,
  ): Promise<WatcherRegistrationResult> {
    try {
      this.logger.log(
        `Attempting to register watcher for VC: ${vcPublicId} (triggered by: ${triggeredBy})`,
        'WatcherRegistrationService.registerWatcherForVC',
      );

      // Check if watcher is already registered
      const existingVC = await this.walletVCService.getVCByPublicId(
        vcPublicId,
        provider,
      );
      if (existingVC?.watcherRegistered) {
        return {
          success: true,
          statusCode: 200,
          message: 'Watcher already registered for this VC',
          watcherEmail: existingVC.watcherEmail || '',
          watcherCallbackUrl: existingVC.watcherCallbackUrl || '',
        };
      }

      // Check if watch functionality is supported
      if (!this.isWatchSupported()) {
        return {
          success: false,
          statusCode: 400,
          message: 'Watch functionality not supported by this wallet provider',
        };
      }

      // Create watch data
      const watchData: WatchVcDto = {
        vcPublicId,
        identifier: '', // Will be set by the adapter based on the provider
      };

      // Register watcher using adapter directly
      const result = await this.walletAdapter.watchVC!(watchData);

      if (result && (result.statusCode === 200 || result.statusCode === 201)) {
        // Update database to mark watcher as registered
        await this.walletVCService.updateWatcherStatus(
          vcPublicId,
          provider,
          true,
          userId || triggeredBy,
          result.data?.watcherEmail || '',
          result.data?.watcherCallbackUrl || '',
        );

        this.logger.log(
          `Successfully registered watcher for VC: ${vcPublicId}`,
          'WatcherRegistrationService.registerWatcherForVC',
        );

        return {
          success: true,
          statusCode: result.statusCode,
          message: result.message,
          watcherEmail: result.data?.watcherEmail || '',
          watcherCallbackUrl: result.data?.watcherCallbackUrl || '',
        };
      } else {
        const errorMessage = result?.message || 'Unknown error';
        this.logger.logError(
          `Failed to register watcher for VC: ${vcPublicId}. Status: ${result?.statusCode}, Message: ${errorMessage}`,
          new Error(errorMessage),
          'WatcherRegistrationService.registerWatcherForVC',
        );

        return {
          success: false,
          statusCode: result?.statusCode || 500,
          message: errorMessage,
        };
      }
    } catch (error) {
      this.logger.logError(
        `Error registering watcher for VC: ${vcPublicId}`,
        error,
        'WatcherRegistrationService.registerWatcherForVC',
      );

      return {
        success: false,
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Register watchers for multiple VCs (used by cron job)
   * @param triggeredBy - Who triggered the registration (e.g., 'cron-job', 'manual-trigger')
   * @returns Summary of registration results
   */
  async registerWatchersForMultipleVCs(triggeredBy: string): Promise<{
    successCount: number;
    failureCount: number;
    totalProcessed: number;
    results: WatcherRegistrationResult[];
  }> {
    try {
      this.logger.log(
        `Starting bulk watcher registration (triggered by: ${triggeredBy})`,
        'WatcherRegistrationService.registerWatchersForMultipleVCs',
      );

      // Get all VCs without watchers
      const vcsWithoutWatcher = await this.walletVCService.getVCsWithoutWatcher();

      if (vcsWithoutWatcher.length === 0) {
        this.logger.log(
          'No VCs found without watchers',
          'WatcherRegistrationService.registerWatchersForMultipleVCs',
        );
        return {
          successCount: 0,
          failureCount: 0,
          totalProcessed: 0,
          results: [],
        };
      }

      this.logger.log(
        `Found ${vcsWithoutWatcher.length} VCs without watchers. Starting registration...`,
        'WatcherRegistrationService.registerWatchersForMultipleVCs',
      );

      let successCount = 0;
      let failureCount = 0;
      const results: WatcherRegistrationResult[] = [];

      // Process VCs in parallel with a concurrency limit
      const concurrencyLimit = 5;
      const chunks = this.chunkArray(vcsWithoutWatcher, concurrencyLimit);

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (walletVC) => {
          const result = await this.registerWatcherForVC(
            walletVC.vcPublicId,
            walletVC.provider,
            triggeredBy,
          );

          results.push(result);

          if (result.success) {
            successCount++;
          } else {
            failureCount++;
          }

          return result;
        });

        await Promise.all(chunkPromises);
      }

      this.logger.log(
        `Bulk watcher registration completed. Success: ${successCount}, Failures: ${failureCount}`,
        'WatcherRegistrationService.registerWatchersForMultipleVCs',
      );

      return {
        successCount,
        failureCount,
        totalProcessed: vcsWithoutWatcher.length,
        results,
      };
    } catch (error) {
      this.logger.logError(
        'Error in bulk watcher registration',
        error,
        'WatcherRegistrationService.registerWatchersForMultipleVCs',
      );
      throw error;
    }
  }

  /**
   * Register watcher for VC uploaded via QR (used by uploadVCFromQR)
   * @param vcPublicId - The public ID of the VC
   * @param provider - The wallet provider name
   * @param userId - The user ID who uploaded the VC
   * @returns WatcherRegistrationResult
   */
  async registerWatcherForUploadedVC(
    vcPublicId: string,
    provider: string,
    userId: string,
  ): Promise<WatcherRegistrationResult> {
    return await this.registerWatcherForVC(
      vcPublicId,
      provider,
      'user-upload',
      userId,
    );
  }

  /**
   * Check if watch functionality is supported by the adapter
   */
  private isWatchSupported(): boolean {
    return (
      'watchVC' in this.walletAdapter &&
      typeof this.walletAdapter.watchVC === 'function'
    );
  }

  /**
   * Helper method to chunk array for parallel processing
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

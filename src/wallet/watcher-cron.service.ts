import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoggerService } from '../common/logger/logger.service';
import { WalletService } from './wallet.service';
import { WalletVCService } from './wallet-vc.service';
import { WatchVcDto } from '../dto/watch-vc.dto';

@Injectable()
export class WatcherCronService {
  private readonly logger = new Logger(WatcherCronService.name);

  constructor(
    private readonly customLogger: LoggerService,
    private readonly walletService: WalletService,
    private readonly walletVCService: WalletVCService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async registerWatchersForVCs() {
    try {
      this.logger.log('Starting watcher registration cron job');

      // Get all VCs without watchers
      const vcsWithoutWatcher = await this.walletVCService.getVCsWithoutWatcher();

      if (vcsWithoutWatcher.length === 0) {
        this.logger.log('No VCs found without watchers');
        return;
      }

      this.logger.log(
        `Found ${vcsWithoutWatcher.length} VCs without watchers. Starting registration...`,
      );

      let successCount = 0;
      let failureCount = 0;

      // Process VCs in parallel with a concurrency limit
      const concurrencyLimit = 5;
      const chunks = this.chunkArray(vcsWithoutWatcher, concurrencyLimit);

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (walletVC) => {
          try {
            const watchData: WatchVcDto = {
              vcPublicId: walletVC.vcPublicId,
              identifier: '', // Will be set by the adapter
            };

            const result = await this.walletService.watchVC(watchData);

            if (result.statusCode === 200 || result.statusCode === 201) {
              successCount++;
              this.logger.log(
                `Successfully registered watcher for VC: ${walletVC.vcPublicId}`,
              );
            } else {
              failureCount++;
              this.logger.error(
                `Failed to register watcher for VC: ${walletVC.vcPublicId}. Status: ${result.statusCode}, Message: ${result.message}`,
                new Error(result.message),
                'WatcherCronService.registerWatchersForVCs',
              );
            }
          } catch (error) {
            failureCount++;
            this.customLogger.logError(
              `Error registering watcher for VC: ${walletVC.vcPublicId}`,
              error,
              'WatcherCronService.registerWatchersForVCs',
            );
          }
        });

        await Promise.all(chunkPromises);
      }

      this.logger.log(
        `Watcher registration cron job completed. Success: ${successCount}, Failures: ${failureCount}`,
      );
    } catch (error) {
      this.customLogger.logError(
        'Error in watcher registration cron job',
        error,
        'WatcherCronService.registerWatchersForVCs',
      );
    }
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

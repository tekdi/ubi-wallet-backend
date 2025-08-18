import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoggerService } from '../common/logger/logger.service';
import { WalletService } from './wallet.service';
import { WalletVCService } from './wallet-vc.service';
import { WalletVCWatcherService } from './wallet-vc-watcher.service';
import { UserService } from '../users/user.service';
import { WatchVcDto } from '../dto/watch-vc.dto';

@Injectable()
export class WatcherCronService {
  private readonly logger = new Logger(WatcherCronService.name);

  constructor(
    private readonly customLogger: LoggerService,
    private readonly walletService: WalletService,
    private readonly walletVCService: WalletVCService,
    private readonly walletVCWatcherService: WalletVCWatcherService,
    private readonly userService: UserService,
  ) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async registerWatchersForVCs() {
    try {
      this.logger.log('Starting watcher registration cron job');

      // Get all unregistered watchers
      const unregisteredWatchers =
        await this.walletVCWatcherService.getUnregisteredWatchers();

      if (unregisteredWatchers.length === 0) {
        this.logger.log('No unregistered watchers found');
        return;
      }

      this.logger.log(
        `Found ${unregisteredWatchers.length} unregistered watchers. Starting registration...`,
      );

      let successCount = 0;
      let failureCount = 0;

      // Process watchers in parallel with a concurrency limit
      const concurrencyLimit = 5;
      const chunks = this.chunkArray(unregisteredWatchers, concurrencyLimit);

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (watcher) => {
          try {
            // Check if watcher has a user ID
            if (!watcher.userId) {
              this.logger.warn(
                `Skipping watcher ${watcher.id} - no user ID associated`,
              );
              return;
            }

            // Get user by ID to retrieve the token
            const user = await this.userService.findById(watcher.userId);
            if (!user || !user.token) {
              this.logger.warn(
                `Skipping watcher ${watcher.id} - user not found or no token available`,
              );
              return;
            }

            const watchData: WatchVcDto = {
              vcPublicId: watcher.vcPublicId,
              identifier: '', // Will be set by the adapter
            };

            const result = await this.walletService.watchVC(
              watchData,
              user.token,
            );

            if (result.statusCode === 200 || result.statusCode === 201) {
              successCount++;
              this.logger.log(
                `Successfully registered watcher for VC: ${watcher.vcPublicId}`,
              );
            } else {
              failureCount++;
              this.logger.error(
                `Failed to register watcher for VC: ${watcher.vcPublicId}. Status: ${result.statusCode}, Message: ${result.message}`,
                new Error(result.message),
                'WatcherCronService.registerWatchersForVCs',
              );
            }
          } catch (error) {
            failureCount++;
            this.customLogger.logError(
              `Error registering watcher for VC: ${watcher.vcPublicId}`,
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

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoggerService } from '../common/logger/logger.service';
import { WatcherRegistrationService } from './watcher-registration.service';

@Injectable()
export class WatcherCronService {
  private readonly logger = new Logger(WatcherCronService.name);

  constructor(
    private readonly customLogger: LoggerService,
    private readonly watcherRegistrationService: WatcherRegistrationService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async registerWatchersForVCs() {
    try {
      this.logger.log('Starting watcher registration cron job');

      const result =
        await this.watcherRegistrationService.registerWatchersForMultipleVCs(
          'cron-job',
        );

      this.logger.log(
        `Watcher registration cron job completed. Success: ${result.successCount}, Failures: ${result.failureCount}`,
      );
    } catch (error) {
      this.customLogger.logError(
        'Error in watcher registration cron job',
        error,
        'WatcherCronService.registerWatchersForVCs',
      );
    }
  }

  // Manual trigger method for testing or immediate execution
  async triggerWatcherRegistration(): Promise<{
    successCount: number;
    failureCount: number;
    totalProcessed: number;
  }> {
    try {
      this.logger.log('Manually triggering watcher registration');

      const result =
        await this.watcherRegistrationService.registerWatchersForMultipleVCs(
          'manual-trigger',
        );

      return {
        successCount: result.successCount,
        failureCount: result.failureCount,
        totalProcessed: result.totalProcessed,
      };
    } catch (error) {
      this.customLogger.logError(
        'Error in manual watcher registration',
        error,
        'WatcherCronService.triggerWatcherRegistration',
      );
      throw error;
    }
  }
}

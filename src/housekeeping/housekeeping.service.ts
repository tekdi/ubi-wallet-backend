import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletVC } from '../wallet/wallet-vc.entity';
import { WalletVCWatcher } from '../wallet/wallet-vc-watcher.entity';
import { User } from '../users/user.entity';
import { LoggerService } from '../common/logger/logger.service';
import { UserService } from '../users/user.service';

@Injectable()
export class HousekeepingService {
  constructor(
    @InjectRepository(WalletVC)
    private readonly walletVCRepository: Repository<WalletVC>,
    @InjectRepository(WalletVCWatcher)
    private readonly walletVCWatcherRepository: Repository<WalletVCWatcher>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly logger: LoggerService,
    private readonly userService: UserService,
  ) {}

  /**
   * Add watchers for wallet VCs that don't have watchers registered
   * This method finds all wallet VCs and ensures they have corresponding watcher records
   * Processes records in chunks to avoid memory issues with large datasets
   */
  async addWatchersForMissingWalletVCs(chunkSize: number = 100): Promise<{
    success: boolean;
    message: string;
    stats: {
      totalWalletVCs: number;
      existingWatchers: number;
      newWatchersCreated: number;
      errors: number;
      chunksProcessed: number;
    };
  }> {
    try {
      this.logger.log(
        `Starting housekeeping task: Add watchers for missing wallet VCs (chunk size: ${chunkSize})`,
        'HousekeepingService.addWatchersForMissingWalletVCs',
      );

      // Get total count first
      const totalCount = await this.walletVCRepository.count();
      this.logger.log(
        `Found ${totalCount} total wallet VCs to process`,
        'HousekeepingService.addWatchersForMissingWalletVCs',
      );

      let existingWatchers = 0;
      let newWatchersCreated = 0;
      let errors = 0;
      let chunksProcessed = 0;
      let offset = 0;

      while (offset < totalCount) {
        // Get chunk of wallet VCs
        const walletVCsChunk = await this.walletVCRepository.find({
          skip: offset,
          take: chunkSize,
          order: { id: 'ASC' }, // Ensure consistent ordering
        });

        this.logger.log(
          `Processing chunk ${chunksProcessed + 1} (offset: ${offset}, size: ${walletVCsChunk.length})`,
          'HousekeepingService.addWatchersForMissingWalletVCs',
        );

        for (const walletVC of walletVCsChunk) {
          try {
            // Check if there's already a watcher for this VC
            const existingWatcher =
              await this.walletVCWatcherRepository.findOne({
                where: { vcPublicId: walletVC.vcPublicId },
              });

            if (existingWatcher) {
              existingWatchers++;
              this.logger.log(
                `Watcher already exists for VC: ${walletVC.vcPublicId}`,
                'HousekeepingService.addWatchersForMissingWalletVCs',
              );
              continue;
            }

            // If no watcher exists, create one
            if (walletVC.userId) {
              // Get user details to create a proper watcher record
              const user = await this.userService.findById(walletVC.userId);
              if (user) {
                const newWatcher = this.walletVCWatcherRepository.create({
                  vcPublicId: walletVC.vcPublicId,
                  userId: walletVC.userId,
                  provider: walletVC.provider,
                  watcherRegistered: false, // Will be registered by cron job
                  watcherEmail: user.email || '',
                  watcherCallbackUrl: '', // Can be set later if needed
                  createdBy: walletVC.userId, // Use the user's UUID
                  updatedBy: walletVC.userId, // Use the user's UUID
                });

                await this.walletVCWatcherRepository.save(newWatcher);
                newWatchersCreated++;

                this.logger.log(
                  `Created new watcher for VC: ${walletVC.vcPublicId} with user: ${user.email}`,
                  'HousekeepingService.addWatchersForMissingWalletVCs',
                );
              } else {
                errors++;
                this.logger.logError(
                  `User not found for wallet VC: ${walletVC.vcPublicId}, userId: ${walletVC.userId}`,
                  new Error('User not found'),
                  'HousekeepingService.addWatchersForMissingWalletVCs',
                );
              }
            } else {
              // Create watcher without user ID (for VCs without user association)
              const newWatcher = this.walletVCWatcherRepository.create({
                vcPublicId: walletVC.vcPublicId,
                userId: null as any,
                provider: walletVC.provider,
                watcherRegistered: false,
                watcherEmail: '',
                watcherCallbackUrl: '',
                createdBy: null as any, // No user association
                updatedBy: null as any, // No user association
              });

              await this.walletVCWatcherRepository.save(newWatcher);
              newWatchersCreated++;

              this.logger.log(
                `Created new watcher for VC: ${walletVC.vcPublicId} (no user association)`,
                'HousekeepingService.addWatchersForMissingWalletVCs',
              );
            }
          } catch (error) {
            errors++;
            this.logger.logError(
              `Error processing wallet VC: ${walletVC.vcPublicId}`,
              error,
              'HousekeepingService.addWatchersForMissingWalletVCs',
            );
          }
        }

        // Move to next chunk
        offset += chunkSize;
        chunksProcessed++;

        this.logger.log(
          `Completed chunk ${chunksProcessed}. Progress: ${Math.min(offset, totalCount)}/${totalCount} VCs processed`,
          'HousekeepingService.addWatchersForMissingWalletVCs',
        );
      }

      const stats = {
        totalWalletVCs: totalCount,
        existingWatchers,
        newWatchersCreated,
        errors,
        chunksProcessed,
      };

      const message = `Housekeeping task completed. Total VCs: ${stats.totalWalletVCs}, Existing watchers: ${stats.existingWatchers}, New watchers created: ${stats.newWatchersCreated}, Errors: ${stats.errors}, Chunks processed: ${stats.chunksProcessed}`;

      this.logger.log(
        message,
        'HousekeepingService.addWatchersForMissingWalletVCs',
      );

      return {
        success: true,
        message,
        stats,
      };
    } catch (error) {
      this.logger.logError(
        'Failed to add watchers for missing wallet VCs',
        error,
        'HousekeepingService.addWatchersForMissingWalletVCs',
      );

      return {
        success: false,
        message: `Failed to add watchers: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stats: {
          totalWalletVCs: 0,
          existingWatchers: 0,
          newWatchersCreated: 0,
          errors: 1,
          chunksProcessed: 0,
        },
      };
    }
  }

  /**
   * Get statistics about wallet VCs and their watcher status
   */
  async getWalletVCWatcherStats(): Promise<{
    success: boolean;
    data: {
      totalWalletVCs: number;
      totalWatchers: number;
      registeredWatchers: number;
      unregisteredWatchers: number;
      vcsWithoutWatchers: number;
    };
  }> {
    try {
      const totalWalletVCs = await this.walletVCRepository.count();
      const totalWatchers = await this.walletVCWatcherRepository.count();
      const registeredWatchers = await this.walletVCWatcherRepository.count({
        where: { watcherRegistered: true },
      });
      const unregisteredWatchers = await this.walletVCWatcherRepository.count({
        where: { watcherRegistered: false },
      });

      // Count VCs that don't have any watchers
      const vcsWithWatchers = await this.walletVCWatcherRepository
        .createQueryBuilder('watcher')
        .select('DISTINCT watcher.vcPublicId', 'vcPublicId')
        .getRawMany();

      const vcsWithoutWatchers = totalWalletVCs - vcsWithWatchers.length;

      return {
        success: true,
        data: {
          totalWalletVCs,
          totalWatchers,
          registeredWatchers,
          unregisteredWatchers,
          vcsWithoutWatchers,
        },
      };
    } catch (error) {
      this.logger.logError(
        'Failed to get wallet VC watcher statistics',
        error,
        'HousekeepingService.getWalletVCWatcherStats',
      );

      return {
        success: false,
        data: {
          totalWalletVCs: 0,
          totalWatchers: 0,
          registeredWatchers: 0,
          unregisteredWatchers: 0,
          vcsWithoutWatchers: 0,
        },
      };
    }
  }
}

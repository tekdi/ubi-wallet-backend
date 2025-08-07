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

  /**
   * Sync VCs from provider and add watchers for all users
   * This method gets all users, fetches their VCs from the provider,
   * syncs missing VCs to our database, and adds watchers for them
   */
  async syncVCsAndAddWatchersForAllUsers(
    provider: string = 'dhiway',
    chunkSize: number = 100,
  ): Promise<{
    success: boolean;
    message: string;
    stats: {
      totalUsers: number;
      totalVCsFromProvider: number;
      newVCsAdded: number;
      existingVCsFound: number;
      newWatchersCreated: number;
      existingWatchersFound: number;
      errors: number;
      usersProcessed: number;
    };
  }> {
    try {
      this.logger.log(
        `Starting housekeeping task: Sync VCs and add watchers for all users (provider: ${provider}, chunk size: ${chunkSize})`,
        'HousekeepingService.syncVCsAndAddWatchersForAllUsers',
      );

      // Get adapter for the provider
      const { getAdapterBasedOnEnv } = await import(
        '../adapters/adapter.factory'
      );
      const AdapterClass = getAdapterBasedOnEnv(provider);
      const adapter = new AdapterClass(
        this.logger,
        this.userService,
        this.walletVCRepository,
      );

      // Get total count of users
      const totalUsers = await this.userRepository.count();
      this.logger.log(
        `Found ${totalUsers} total users to process`,
        'HousekeepingService.syncVCsAndAddWatchersForAllUsers',
      );

      let totalVCsFromProvider = 0;
      let newVCsAdded = 0;
      let existingVCsFound = 0;
      let newWatchersCreated = 0;
      let existingWatchersFound = 0;
      let errors = 0;
      let usersProcessed = 0;
      let offset = 0;

      while (offset < totalUsers) {
        // Get chunk of users
        const usersChunk = await this.userRepository.find({
          skip: offset,
          take: chunkSize,
          order: { id: 'ASC' },
        });

        this.logger.log(
          `Processing user chunk ${Math.floor(offset / chunkSize) + 1} (offset: ${offset}, size: ${usersChunk.length})`,
          'HousekeepingService.syncVCsAndAddWatchersForAllUsers',
        );

        for (const user of usersChunk) {
          try {
            this.logger.log(
              `Processing user: ${user.email} (ID: ${user.id})`,
              'HousekeepingService.syncVCsAndAddWatchersForAllUsers',
            );

            // Get user's token (you might need to adjust this based on your token storage)
            const userToken = user.token || user.accountId; // Adjust based on your user entity
            if (!userToken) {
              this.logger.log(
                `No token found for user: ${user.email}`,
                'HousekeepingService.syncVCsAndAddWatchersForAllUsers',
              );
              continue;
            }

            // Get VCs from provider for this user
            const vcListResponse = await adapter.getAllVCs(user.accountId || user.id, userToken);
            
            if (!vcListResponse.success || vcListResponse.statusCode !== 200) {
              this.logger.logError(
                `Failed to get VCs from provider for user: ${user.email}`,
                new Error(vcListResponse.message || 'Provider API error'),
                'HousekeepingService.syncVCsAndAddWatchersForAllUsers',
              );
              errors++;
              continue;
            }

            const vcsFromProvider = vcListResponse.data || [];
            totalVCsFromProvider += vcsFromProvider.length;

            this.logger.log(
              `Found ${vcsFromProvider.length} VCs from provider for user: ${user.email}`,
              'HousekeepingService.syncVCsAndAddWatchersForAllUsers',
            );

            // Process each VC from provider
            for (const vcFromProvider of vcsFromProvider) {
              try {
                // Check if VC already exists in our database
                const existingVC = await this.walletVCRepository.findOne({
                  where: { 
                    vcPublicId: vcFromProvider.id,
                    userId: user.id 
                  },
                });

                if (existingVC) {
                  existingVCsFound++;
                  this.logger.log(
                    `VC already exists in database: ${vcFromProvider.id} for user: ${user.email}`,
                    'HousekeepingService.syncVCsAndAddWatchersForAllUsers',
                  );
                } else {
                  // Add new VC to database
                  const newVC = this.walletVCRepository.create({
                    vcPublicId: vcFromProvider.id,
                    userId: user.id,
                    provider: provider,
                    vcJson: JSON.stringify(vcFromProvider),
                    createdBy: user.id,
                    updatedBy: user.id,
                  });

                  await this.walletVCRepository.save(newVC);
                  newVCsAdded++;

                  this.logger.log(
                    `Added new VC to database: ${vcFromProvider.id} for user: ${user.email}`,
                    'HousekeepingService.syncVCsAndAddWatchersForAllUsers',
                  );
                }

                // Check if watcher already exists for this VC
                const existingWatcher = await this.walletVCWatcherRepository.findOne({
                  where: { vcPublicId: vcFromProvider.id },
                });

                if (existingWatcher) {
                  existingWatchersFound++;
                  this.logger.log(
                    `Watcher already exists for VC: ${vcFromProvider.id}`,
                    'HousekeepingService.syncVCsAndAddWatchersForAllUsers',
                  );
                } else {
                  // Create new watcher
                  const newWatcher = this.walletVCWatcherRepository.create({
                    vcPublicId: vcFromProvider.id,
                    userId: user.id,
                    provider: provider,
                    watcherRegistered: false,
                    watcherEmail: user.email || '',
                    watcherCallbackUrl: '',
                    createdBy: user.id,
                    updatedBy: user.id,
                  });

                  await this.walletVCWatcherRepository.save(newWatcher);
                  newWatchersCreated++;

                  this.logger.log(
                    `Created new watcher for VC: ${vcFromProvider.id} with user: ${user.email}`,
                    'HousekeepingService.syncVCsAndAddWatchersForAllUsers',
                  );
                }

              } catch (error) {
                errors++;
                this.logger.logError(
                  `Error processing VC: ${vcFromProvider.id} for user: ${user.email}`,
                  error,
                  'HousekeepingService.syncVCsAndAddWatchersForAllUsers',
                );
              }
            }

            usersProcessed++;

          } catch (error) {
            errors++;
            this.logger.logError(
              `Error processing user: ${user.email}`,
              error,
              'HousekeepingService.syncVCsAndAddWatchersForAllUsers',
            );
          }
        }

        // Move to next chunk
        offset += chunkSize;

        this.logger.log(
          `Completed user chunk. Progress: ${Math.min(offset, totalUsers)}/${totalUsers} users processed`,
          'HousekeepingService.syncVCsAndAddWatchersForAllUsers',
        );
      }

      const stats = {
        totalUsers,
        totalVCsFromProvider,
        newVCsAdded,
        existingVCsFound,
        newWatchersCreated,
        existingWatchersFound,
        errors,
        usersProcessed,
      };

      const message = `Housekeeping task completed. Total users: ${stats.totalUsers}, Total VCs from provider: ${stats.totalVCsFromProvider}, New VCs added: ${stats.newVCsAdded}, Existing VCs found: ${stats.existingVCsFound}, New watchers created: ${stats.newWatchersCreated}, Existing watchers found: ${stats.existingWatchersFound}, Errors: ${stats.errors}, Users processed: ${stats.usersProcessed}`;

      this.logger.log(
        message,
        'HousekeepingService.syncVCsAndAddWatchersForAllUsers',
      );

      return {
        success: true,
        message,
        stats,
      };

    } catch (error) {
      this.logger.logError(
        'Failed to sync VCs and add watchers for all users',
        error,
        'HousekeepingService.syncVCsAndAddWatchersForAllUsers',
      );

      return {
        success: false,
        message: `Failed to sync VCs and add watchers: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stats: {
          totalUsers: 0,
          totalVCsFromProvider: 0,
          newVCsAdded: 0,
          existingVCsFound: 0,
          newWatchersCreated: 0,
          existingWatchersFound: 0,
          errors: 1,
          usersProcessed: 0,
        },
      };
    }
  }
}

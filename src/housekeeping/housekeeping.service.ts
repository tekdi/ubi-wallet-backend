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
                  watcherEmail: `${process.env.DHIWAY_WATCHER_EMAIL}` || '',
                  watcherCallbackUrl: '', // Can be set later if needed
                  createdBy: walletVC.userId, // Use the user's UUID
                  updatedBy: walletVC.userId, // Use the user's UUID
                });

                await this.walletVCWatcherRepository.save(newWatcher);
                newWatchersCreated++;

                this.logger.log(
                  `Created new watcher for VC: ${walletVC.vcPublicId} with user: ${user.username}`,
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

      const adapter = await this.createAdapter(provider);
      const totalUsers = await this.userRepository.count();

      this.logger.log(
        `Found ${totalUsers} total users to process`,
        'HousekeepingService.syncVCsAndAddWatchersForAllUsers',
      );

      const stats = await this.processAllUsers(
        adapter,
        totalUsers,
        chunkSize,
        provider,
      );

      const message = this.createCompletionMessage(stats);
      this.logger.log(
        message,
        'HousekeepingService.syncVCsAndAddWatchersForAllUsers',
      );

      return { success: true, message, stats };
    } catch (error) {
      return this.handleSyncError(error);
    }
  }

  private async createAdapter(provider: string) {
    const { getAdapterBasedOnEnv } = await import('../adapters/adapter.factory');
    const AdapterClass = getAdapterBasedOnEnv(provider);
    return new AdapterClass(
      this.logger,
      this.userService,
      this.walletVCRepository,
    );
  }

  private async processAllUsers(
    adapter: any,
    totalUsers: number,
    chunkSize: number,
    provider: string,
  ) {
    const stats = this.initializeStats();
    let offset = 0;

    while (offset < totalUsers) {
      const usersChunk = await this.getUserChunk(offset, chunkSize);
      await this.processUserChunk(usersChunk, adapter, stats, provider);
      offset += chunkSize;

      this.logProgress(offset, totalUsers);
    }

    return stats;
  }

  private initializeStats() {
    return {
      totalUsers: 0,
      totalVCsFromProvider: 0,
      newVCsAdded: 0,
      existingVCsFound: 0,
      newWatchersCreated: 0,
      existingWatchersFound: 0,
      errors: 0,
      usersProcessed: 0,
    };
  }

  private async getUserChunk(offset: number, chunkSize: number) {
    return await this.userRepository.find({
      skip: offset,
      take: chunkSize,
      order: { id: 'ASC' },
    });
  }

  private async processUserChunk(
    usersChunk: any[],
    adapter: any,
    stats: any,
    provider: string,
  ) {
    this.logger.log(
      `Processing user chunk (size: ${usersChunk.length})`,
      'HousekeepingService.processUserChunk',
    );

    for (const user of usersChunk) {
      await this.processUser(user, adapter, stats, provider);
    }
  }

  private async processUser(
    user: any,
    adapter: any,
    stats: any,
    provider: string,
  ) {
    try {
      this.logger.log(
        `Processing user: ${user.username} (ID: ${user.id})`,
        'HousekeepingService.processUser',
      );

      if (!user.token) {
        this.logger.log(
          `No token found for user: ${user.username}`,
          'HousekeepingService.processUser',
        );
        return;
      }

      const vcsFromProvider = await this.getVCsFromProvider(adapter, user);
      if (!vcsFromProvider) {
        stats.errors++;
        return;
      }

      stats.totalVCsFromProvider += vcsFromProvider.length;
      await this.processVCsForUser(vcsFromProvider, user, stats, provider);
      stats.usersProcessed++;

    } catch (error) {
      stats.errors++;
      this.logger.logError(
        `Error processing user: ${user.username}`,
        error,
        'HousekeepingService.processUser',
      );
    }
  }

  private async getVCsFromProvider(adapter: any, user: any) {
    try {
      const vcListResponse = await Promise.race([
        adapter.getAllVCs(user.accountId || user.id, user.token),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000)),
      ]);

      if (vcListResponse.statusCode !== 200) {
        this.logger.logError(
          `Failed to get VCs from provider for user: ${user.username}. Status: ${vcListResponse.statusCode}, Message: ${vcListResponse.message}`,
          new Error(`Provider API error: ${vcListResponse.message || 'Unknown error'}`),
          'HousekeepingService.getVCsFromProvider',
        );
        return null;
      }

      const vcIdentifiers = vcListResponse.data || [];
      this.logger.log(
        `Found ${vcIdentifiers.length} VC identifiers from provider for user: ${user.username}`,
        'HousekeepingService.getVCsFromProvider',
      );

      // Get complete VCs for each identifier
      const completeVCs: any = [];
      for (const vcIdentifier of vcIdentifiers) {
        try {
          const completeVC = await adapter.getVCJsonByVcIdentifier(
            user.username,
            vcIdentifier.identifier,
            user.token
          );
          let completeVCData = completeVC.data;

          if (completeVCData && typeof completeVCData === 'object') {
            completeVCs.push(completeVCData);
          } else {
            this.logger.log(
              `Failed to get complete VC for identifier: ${vcIdentifier.identifier}`,
              'HousekeepingService.getVCsFromProvider',
            );
          }
        } catch (vcError) {
          this.logger.log(
            `Error getting complete VC for identifier: ${vcIdentifier.identifier}`,
            'HousekeepingService.getVCsFromProvider',
          );
          // Continue with other VCs even if one fails
        }
      }

      this.logger.log(
        `Successfully retrieved ${completeVCs.length} complete VCs from provider for user: ${user.username}`,
        'HousekeepingService.getVCsFromProvider',
      );

      return completeVCs;
    } catch (error) {
      this.logger.logError(
        `Error getting VCs from provider for user: ${user.username}`,
        error,
        'HousekeepingService.getVCsFromProvider',
      );
      return null;
    }
  }

  private async processVCsForUser(vcsFromProvider: any[], user: any, stats: any, provider: string) {
    for (const vcFromProvider of vcsFromProvider) {
      try {
        await this.processSingleVC(vcFromProvider, user, stats, provider);
      } catch (error) {
        stats.errors++;
        this.logger.logError(
          `Error processing VC: ${vcFromProvider.publicId} for user: ${user.username}`,
          error,
          'HousekeepingService.processVCsForUser',
        );
      }
    }
  }

  private async processSingleVC(vcFromProvider: any, user: any, stats: any, provider: string) {
    await this.handleVCExistence(vcFromProvider, user, stats, provider);
    await this.handleWatcherExistence(vcFromProvider, user, stats, provider);
  }

  private async handleVCExistence(vcFromProvider: any, user: any, stats: any, provider: string) {
    const existingVC = await this.walletVCRepository.findOne({
      where: { vcPublicId: vcFromProvider.publicId, userId: user.id },
    });

    if (existingVC) {
      stats.existingVCsFound++;
      this.logger.log(
        `VC already exists in database: ${vcFromProvider.publicId} for user: ${user.id}`,
        'HousekeepingService.handleVCExistence',
      );
    } else {
      await this.createNewVC(vcFromProvider, user, provider);
      stats.newVCsAdded++;
    }
  }

  private async createNewVC(vcFromProvider: any, user: any, provider: string) {
    const newVC = this.walletVCRepository.create({
      vcPublicId: vcFromProvider.publicId,
      userId: user.id,
      provider: provider,
      vcJson: JSON.stringify(vcFromProvider),
      createdBy: user.id,
      updatedBy: user.id,
    });

    await this.walletVCRepository.save(newVC);
    this.logger.log(
      `Added new VC to database: ${vcFromProvider.publicId} for user: ${user.username}`,
      'HousekeepingService.createNewVC',
    );
  }

  private async handleWatcherExistence(vcFromProvider: any, user: any, stats: any, provider: string) {
    const existingWatcher = await this.walletVCWatcherRepository.findOne({
      where: { vcPublicId: vcFromProvider.publicId },
    });

    if (existingWatcher) {
      stats.existingWatchersFound++;
      this.logger.log(
        `Watcher already exists for VC: ${vcFromProvider.publicId}`,
        'HousekeepingService.handleWatcherExistence',
      );
    } else {
      await this.createNewWatcher(vcFromProvider, user, provider);
      stats.newWatchersCreated++;
    }
  }

  private async createNewWatcher(vcFromProvider: any, user: any, provider: string) {
    const newWatcher = this.walletVCWatcherRepository.create({
      vcPublicId: vcFromProvider.publicId,
      userId: user.id,
      provider: provider,
      watcherRegistered: false,
      watcherEmail: `${process.env.DHIWAY_WATCHER_EMAIL}` || '',
      watcherCallbackUrl: `${process.env.WALLET_SERVICE_BASE_URL}/api/wallet/vcs/watch/callback`,
      createdBy: user.id,
      updatedBy: user.id,
    });

    await this.walletVCWatcherRepository.save(newWatcher);
    this.logger.log(
      `Created new watcher for VC: ${vcFromProvider.publicId} with user: ${user.username}`,
      'HousekeepingService.createNewWatcher',
    );
  }

  private logProgress(offset: number, totalUsers: number) {
    this.logger.log(
      `Completed user chunk. Progress: ${Math.min(offset, totalUsers)}/${totalUsers} users processed`,
      'HousekeepingService.logProgress',
    );
  }

  private createCompletionMessage(stats: any): string {
    return `Housekeeping task completed. Total users: ${stats.totalUsers}, Total VCs from provider: ${stats.totalVCsFromProvider}, New VCs added: ${stats.newVCsAdded}, Existing VCs found: ${stats.existingVCsFound}, New watchers created: ${stats.newWatchersCreated}, Existing watchers found: ${stats.existingWatchersFound}, Errors: ${stats.errors}, Users processed: ${stats.usersProcessed}`;
  }

  private handleSyncError(error: any) {
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

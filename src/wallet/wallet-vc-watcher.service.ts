import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletVCWatcher } from './wallet-vc-watcher.entity';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class WalletVCWatcherService {
  constructor(
    @InjectRepository(WalletVCWatcher)
    private readonly walletVCWatcherRepository: Repository<WalletVCWatcher>,
    private readonly logger: LoggerService,
  ) {}

  async createWatcher(
    vcPublicId: string,
    userId: string | null,
    provider: string,
    watcherEmail: string,
    watcherCallbackUrl: string,
    createdBy: string = '',
    forwardWatcherCallbackUrl?: string,
  ): Promise<WalletVCWatcher> {
    try {
      // Check if a watcher already exists for this combination
      const whereCondition: Partial<{
        vcPublicId: string;
        userId: string | null;
        provider: string;
        watcherEmail: string;
      }> = { vcPublicId, provider, watcherEmail };
      if (userId !== null) {
        whereCondition.userId = userId;
      }

      const existingWatcher = await this.walletVCWatcherRepository.findOne({
        where: whereCondition as any,
      });

      if (existingWatcher) {
        this.logger.log(
          `Watcher already exists for vcPublicId: ${vcPublicId}, userId: ${userId}, watcherEmail: ${watcherEmail}`,
          'WalletVCWatcherService.createWatcher',
        );
        return existingWatcher;
      }

      // Create new watcher record
      const watcher = this.walletVCWatcherRepository.create({
        vcPublicId,
        userId,
        provider,
        watcherRegistered: false,
        watcherEmail,
        watcherCallbackUrl,
        forwardWatcherCallbackUrl,
        createdBy,
      });

      return await this.walletVCWatcherRepository.save(watcher);
    } catch (error) {
      this.logger.logError(
        'Failed to create wallet VC watcher record',
        error,
        'WalletVCWatcherService.createWatcher',
      );
      throw error;
    }
  }

  async updateWatcherForwardCallbackUrl(
    vcPublicId: string,
    userId: string | null,
    provider: string,
    watcherEmail: string,
    forwardWatcherCallbackUrl: string,
    updatedBy: string = '',
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Find existing watcher
      const whereCondition: Partial<{
        vcPublicId: string;
        userId: string | null;
        provider: string;
        watcherEmail: string;
      }> = { vcPublicId, provider, watcherEmail };
      if (userId !== null) {
        whereCondition.userId = userId;
      }

      const existingWatcher = await this.walletVCWatcherRepository.findOne({
        where: whereCondition as any,
      });

      if (!existingWatcher) {
        return {
          success: false,
          message: `Watcher not found for vcPublicId: ${vcPublicId}, userId: ${userId}, watcherEmail: ${watcherEmail}`,
        };
      }

      // Update only watcher forward callback URL
      await this.walletVCWatcherRepository.update(whereCondition as any, {
        forwardWatcherCallbackUrl,
        updatedBy,
      });

      return {
        success: true,
        message: `Watcher forward callback URL updated successfully for VC: ${vcPublicId}`,
      };
    } catch (error) {
      this.logger.logError(
        'Failed to update watcher forward callback URL',
        error,
        'WalletVCWatcherService.updateWatcherForwardCallbackUrl',
      );
      throw error;
    }
  }

  async updateWatcherStatus(
    vcPublicId: string,
    userId: string | null,
    provider: string,
    watcherEmail: string,
    watcherRegistered: boolean,
    updatedBy: string = '',
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Find existing watcher
      const whereCondition: Partial<{
        vcPublicId: string;
        userId: string | null;
        provider: string;
        watcherEmail: string;
      }> = { vcPublicId, provider, watcherEmail };
      if (userId !== null) {
        whereCondition.userId = userId;
      }

      const existingWatcher = await this.walletVCWatcherRepository.findOne({
        where: whereCondition as any,
      });

      if (!existingWatcher) {
        return {
          success: false,
          message: `Watcher not found for vcPublicId: ${vcPublicId}, userId: ${userId}, watcherEmail: ${watcherEmail}`,
        };
      }

      if (existingWatcher.watcherRegistered) {
        return {
          success: true,
          message: `Watcher is already registered for VC: ${vcPublicId}`,
        };
      }

      // Update only watcher status
      const updateWhereCondition: Partial<{
        vcPublicId: string;
        userId: string | null;
        provider: string;
        watcherEmail: string;
      }> = { vcPublicId, provider, watcherEmail };
      if (userId !== null) {
        updateWhereCondition.userId = userId;
      }

      await this.walletVCWatcherRepository.update(updateWhereCondition as any, {
        watcherRegistered,
        updatedBy,
      });

      return {
        success: true,
        message: `Watcher status updated successfully for VC: ${vcPublicId}`,
      };
    } catch (error) {
      this.logger.logError(
        'Failed to update watcher status',
        error,
        'WalletVCWatcherService.updateWatcherStatus',
      );
      throw error;
    }
  }

  async getWatchersByVcPublicId(
    vcPublicId: string,
  ): Promise<WalletVCWatcher[]> {
    try {
      return await this.walletVCWatcherRepository.find({
        where: { vcPublicId },
      });
    } catch (error) {
      this.logger.logError(
        'Failed to get watchers by VC public ID',
        error,
        'WalletVCWatcherService.getWatchersByVcPublicId',
      );
      throw error;
    }
  }

  async getUnregisteredWatchers(): Promise<WalletVCWatcher[]> {
    try {
      return await this.walletVCWatcherRepository.find({
        where: { watcherRegistered: false },
      });
    } catch (error) {
      this.logger.logError(
        'Failed to get unregistered watchers',
        error,
        'WalletVCWatcherService.getUnregisteredWatchers',
      );
      throw error;
    }
  }

  async getWatcherByVcPublicIdAndUserId(
    vcPublicId: string,
    userId: string,
  ): Promise<WalletVCWatcher | null> {
    try {
      return await this.walletVCWatcherRepository.findOne({
        where: { vcPublicId, userId },
      });
    } catch (error) {
      this.logger.logError(
        'Failed to get watcher by VC public ID and user ID',
        error,
        'WalletVCWatcherService.getWatcherByVcPublicIdAndUserId',
      );
      throw error;
    }
  }

  async findWatcherByCombination(
    vcPublicId: string,
    userId: string | null,
    provider: string,
    watcherEmail: string,
    watcherCallbackUrl: string,
  ): Promise<WalletVCWatcher | null> {
    try {
      const whereCondition: Partial<{
        vcPublicId: string;
        userId: string | null;
        provider: string;
        watcherEmail: string;
        watcherCallbackUrl: string;
      }> = {
        vcPublicId,
        provider,
        watcherEmail,
        watcherCallbackUrl,
      };
      if (userId !== null) {
        whereCondition.userId = userId;
      }

      return await this.walletVCWatcherRepository.findOne({
        where: whereCondition as any,
      });
    } catch (error) {
      this.logger.logError(
        'Failed to find watcher by combination',
        error,
        'WalletVCWatcherService.findWatcherByCombination',
      );
      throw error;
    }
  }
}

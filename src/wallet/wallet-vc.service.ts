import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletVC } from './wallet-vc.entity';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class WalletVCService {
  constructor(
    @InjectRepository(WalletVC)
    private walletVCRepository: Repository<WalletVC>,
    private readonly logger: LoggerService,
  ) {}

  async createWalletVC(
    vcPublicId: string,
    provider: string,
    createdBy: string = '',
  ): Promise<WalletVC> {
    try {
      const walletVC = this.walletVCRepository.create({
        vcPublicId,
        provider,
        watcherRegistered: false,
        createdBy,
        updatedBy: createdBy,
      });

      return await this.walletVCRepository.save(walletVC);
    } catch (error) {
      this.logger.logError(
        'Failed to create wallet VC record',
        error,
        'WalletVCService.createWalletVC',
      );
      throw error;
    }
  }

  async updateWatcherStatus(
    vcPublicId: string,
    provider: string,
    watcherRegistered: boolean,
    updatedBy: string = '',
    watcherEmail: string,
    watcherCallbackUrl: string,
  ): Promise<void> {
    try {
      await this.walletVCRepository.update(
        { vcPublicId, provider },
        { watcherRegistered, updatedBy, watcherEmail, watcherCallbackUrl},
      );
    } catch (error) {
      this.logger.logError(
        'Failed to update watcher status',
        error,
        'WalletVCService.updateWatcherStatus',
      );
      throw error;
    }
  }

  async getVCsWithoutWatcher(provider?: string): Promise<WalletVC[]> {
    try {
      const query = this.walletVCRepository
        .createQueryBuilder('walletVC')
        .where('walletVC.watcherRegistered = :watcherRegistered', {
          watcherRegistered: false,
        });

      if (provider) {
        query.andWhere('walletVC.provider = :provider', { provider });
      }

      return await query.getMany();
    } catch (error) {
      this.logger.logError(
        'Failed to get VCs without watcher',
        error,
        'WalletVCService.getVCsWithoutWatcher',
      );
      throw error;
    }
  }

  async getVCByPublicId(
    vcPublicId: string,
    provider: string,
  ): Promise<WalletVC | null> {
    try {
      return await this.walletVCRepository.findOne({
        where: { vcPublicId, provider },
      });
    } catch (error) {
      this.logger.logError(
        'Failed to get VC by public ID',
        error,
        'WalletVCService.getVCByPublicId',
      );
      throw error;
    }
  }

  async getVCsByPublicId(vcPublicId: string): Promise<WalletVC[]> {
    try {
      return await this.walletVCRepository.find({
        where: { vcPublicId },
      });
    } catch (error) {
      this.logger.logError(
        'Failed to get VCs by public ID',
        error,
        'WalletVCService.getVCsByPublicId',
      );
      throw error;
    }
  }

  async getAllVCs(provider?: string): Promise<WalletVC[]> {
    try {
      const query = this.walletVCRepository.createQueryBuilder('walletVC');

      if (provider) {
        query.where('walletVC.provider = :provider', { provider });
      }

      return await query.getMany();
    } catch (error) {
      this.logger.logError(
        'Failed to get all VCs',
        error,
        'WalletVCService.getAllVCs',
      );
      throw error;
    }
  }
}

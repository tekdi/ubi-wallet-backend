import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletVC } from './wallet-vc.entity';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class WalletVCService {
  constructor(
    @InjectRepository(WalletVC)
    private readonly walletVCRepository: Repository<WalletVC>,
    private readonly logger: LoggerService,
  ) {}

  async createWalletVC(
    vcPublicId: string,
    provider: string,
    userId: string,
    createdBy: string = '',
    vcJson?: string,
  ): Promise<WalletVC> {
    try {
      // Check if a record already exists for this combination
      const existingVC = await this.walletVCRepository.findOne({
        where: { vcPublicId, provider, userId },
      });

      if (existingVC) {
        this.logger.log(
          `Wallet VC record already exists for vcPublicId: ${vcPublicId}, provider: ${provider}, userId: ${userId}. Updating VC JSON.`,
          'WalletVCService.createWalletVC',
        );

        // Update the VC JSON if provided
        if (vcJson !== undefined) {
          existingVC.vcJson = vcJson;
          existingVC.updatedBy = createdBy;
          existingVC.updatedAt = new Date();

          const updatedVC = await this.walletVCRepository.save(existingVC);
          this.logger.log(
            `VC JSON updated for existing record: ${vcPublicId}`,
            'WalletVCService.createWalletVC',
          );
          return updatedVC;
        }

        return existingVC;
      }

      // Create new record only if it doesn't exist
      const walletVC = this.walletVCRepository.create({
        vcPublicId,
        provider,
        userId,
        createdBy,
        vcJson,
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

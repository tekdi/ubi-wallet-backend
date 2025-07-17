import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { UserModule } from '../users/user.module';
import { DhiwayAdapter } from '../adapters/dhiway.adapter';
import { LoggerModule } from '../common/logger/logger.module';

@Module({
  imports: [UserModule, LoggerModule],
  providers: [
    DhiwayAdapter,
    {
      provide: 'WALLET_ADAPTER',
      useExisting: DhiwayAdapter,
    },
    WalletService,
  ],
  controllers: [WalletController],
})
export class WalletModule {}

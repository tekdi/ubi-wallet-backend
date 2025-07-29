import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletVC } from './wallet-vc.entity';
import { WalletVCService } from './wallet-vc.service';
import { WalletVCWatcher } from './wallet-vc-watcher.entity';
import { WalletVCWatcherService } from './wallet-vc-watcher.service';
import { WatcherCronService } from './watcher-cron.service';

import { DhiwayAdapter } from '../adapters/dhiway.adapter';
import { UserModule } from '../users/user.module';
import { LoggerModule } from '../common/logger/logger.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletVC, WalletVCWatcher]),
    UserModule,
    LoggerModule,
    CommonModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [WalletController],
  providers: [
    WalletService,
    WalletVCService,
    WalletVCWatcherService,
    WatcherCronService,
    {
      provide: 'WALLET_ADAPTER',
      useExisting: DhiwayAdapter,
    },
    DhiwayAdapter,
  ],
  exports: [WalletService, WalletVCService, WatcherCronService],
})
export class WalletModule {}

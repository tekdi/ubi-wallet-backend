import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HousekeepingService } from './housekeeping.service';
import { HousekeepingController } from './housekeeping.controller';
import { WalletVC } from '../wallet/wallet-vc.entity';
import { WalletVCWatcher } from '../wallet/wallet-vc-watcher.entity';
import { User } from '../users/user.entity';
import { UserModule } from '../users/user.module';
import { LoggerModule } from '../common/logger/logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletVC, WalletVCWatcher, User]),
    UserModule,
    LoggerModule,
  ],
  controllers: [HousekeepingController],
  providers: [HousekeepingService],
  exports: [HousekeepingService],
})
export class HousekeepingModule {}

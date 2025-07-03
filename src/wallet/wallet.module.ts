import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { UserModule } from '../users/user.module';
import { UserService } from '../users/user.service';
import { DhiwayAdapter } from '../adapters/dhiway.adapter';

@Module({
  imports: [UserModule],
  providers: [
    {
      provide: 'WALLET_ADAPTER',
      useFactory: (userService: UserService) => {
        return new DhiwayAdapter(userService);
      },
      inject: [UserService],
    },
    WalletService,
  ],
  controllers: [WalletController],
})
export class WalletModule {}

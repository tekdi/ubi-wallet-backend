import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { getAdapterBasedOnEnv } from '../adapters/adapter.factory';

@Module({
  providers: [
    {
      provide: 'WALLET_ADAPTER',
      useFactory: () => {
        const AdapterClass = getAdapterBasedOnEnv(
          process.env.WALLET_PROVIDER || '',
        );
        return new AdapterClass();
      },
    },
    WalletService,
  ],
  controllers: [WalletController],
})
export class WalletModule {}

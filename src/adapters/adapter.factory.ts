import { DhiwayAdapter } from './dhiway.adapter';
import {
  IWalletAdapter,
  IWalletAdapterWithOtp,
} from './interfaces/wallet-adapter.interface';

export function getAdapterBasedOnEnv(provider: string): any {
  switch (provider?.toLowerCase()) {
    case 'dhiway':
    default:
      return DhiwayAdapter; // Default to Dhiway
  }
}

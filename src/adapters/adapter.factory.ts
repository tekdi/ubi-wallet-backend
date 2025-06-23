import { DhiwayAdapter } from './dhiway.adapter';
import {
  IWalletAdapter,
  IWalletAdapterWithOtp,
} from './interfaces/wallet-adapter.interface';

export function getAdapterBasedOnEnv(
  provider: string,
): new () => IWalletAdapter | IWalletAdapterWithOtp {
  switch (provider?.toLowerCase()) {
    case 'dhiway':
      return DhiwayAdapter;
    // Add more providers here as needed
    // case 'digilocker':
    //   return DigiLockerAdapter;
    // case 'custom':
    //   return CustomAdapter;
    default:
      return DhiwayAdapter; // Default to Dhiway
  }
}

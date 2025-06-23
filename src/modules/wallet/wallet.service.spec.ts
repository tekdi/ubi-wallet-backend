import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { IWalletAdapter } from '../../adapters/interfaces/wallet-adapter.interface';

describe('WalletService', () => {
  let service: WalletService;
  let mockAdapter: jest.Mocked<IWalletAdapter>;

  beforeEach(async () => {
    mockAdapter = {
      onboardUser: jest.fn(),
      login: jest.fn(),
      verifyLogin: jest.fn(),
      resendOtp: jest.fn(),
      getAllVCs: jest.fn(),
      getVCById: jest.fn(),
      uploadVCFromQR: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: 'WALLET_ADAPTER',
          useValue: mockAdapter,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call login on adapter', async () => {
    const loginData = { email: 'test@example.com' };
    const expectedResponse = { sessionId: 'session123', message: 'OTP sent' };
    mockAdapter.login.mockResolvedValue(expectedResponse);

    const result = await service.login(loginData);
    expect(mockAdapter.login).toHaveBeenCalledWith(loginData);
    expect(result).toEqual(expectedResponse);
  });

  it('should call verifyLogin on adapter', async () => {
    const verifyData = { sessionId: 'session123', otp: '123456' };
    const expectedResponse = {
      token: 'token123',
      accountId: 'user123',
      message: 'Login successful',
    };
    mockAdapter.verifyLogin.mockResolvedValue(expectedResponse);

    const result = await service.verifyLogin(verifyData);
    expect(mockAdapter.verifyLogin).toHaveBeenCalledWith(verifyData);
    expect(result).toEqual(expectedResponse);
  });

  it('should call resendOtp on adapter', async () => {
    const resendData = { sessionId: 'session123' };
    const expectedResponse = { message: 'OTP resent successfully' };
    mockAdapter.resendOtp.mockResolvedValue(expectedResponse);

    const result = await service.resendOtp(resendData);
    expect(mockAdapter.resendOtp).toHaveBeenCalledWith(resendData);
    expect(result).toEqual(expectedResponse);
  });
});

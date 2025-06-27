import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { IWalletAdapterWithOtp } from '../adapters/interfaces/wallet-adapter.interface';
import { UserService } from '../users/user.service';

describe('WalletService', () => {
  let service: WalletService;
  let mockAdapter: jest.Mocked<IWalletAdapterWithOtp>;
  let mockUserService: Partial<UserService>;

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

    mockUserService = {
      createUser: jest.fn(),
      findByUsername: jest.fn(),
      findByAccountId: jest.fn(),
      updateToken: jest.fn(),
      validatePassword: jest.fn(),
      blockUser: jest.fn(),
      unblockUser: jest.fn(),
      updateStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: 'WALLET_ADAPTER',
          useValue: mockAdapter,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call onboardUser on adapter', async () => {
    const onboardData = {
      firstName: 'John',
      lastName: 'Doe',
      externalUserId: 'user123',
      username: 'johndoe',
      password: 'password123',
      email: 'john@example.com',
    };
    const expectedResponse = {
      accountId: 'user123',
      token: 'token123',
      did: 'did:example:123',
      user: {
        id: 'uuid-123',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        accountId: 'user123',
        status: 'active',
      },
    };
    mockAdapter.onboardUser.mockResolvedValue(expectedResponse);

    const result = await service.onboardUser(onboardData);
    expect(mockAdapter.onboardUser).toHaveBeenCalledWith(onboardData);
    expect(result).toEqual(expectedResponse);
  });

  it('should call login on adapter', async () => {
    const loginData = { username: 'johndoe', password: 'password123' };
    const expectedResponse = {
      statusCode: 200,
      message: 'Login successful',
      data: {
        token: 'token123',
        accountId: 'user123',
        user: {
          id: 'uuid-123',
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
        },
      },
    };
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

  it('should call getAllVCs on adapter with token', async () => {
    const userId = 'user123';
    const token = 'bearer-token-123';
    const expectedResponse = [
      {
        id: 'vc1',
        name: 'Test Credential',
        issuer: 'Test Issuer',
        issuedAt: '2023-01-01T00:00:00Z',
      },
    ];
    mockAdapter.getAllVCs.mockResolvedValue(expectedResponse);

    const result = await service.getAllVCs(userId, token);
    expect(mockAdapter.getAllVCs).toHaveBeenCalledWith(userId, token);
    expect(result).toEqual(expectedResponse);
  });

  it('should call getVCById on adapter with token', async () => {
    const userId = 'user123';
    const vcId = 'vc123';
    const token = 'bearer-token-123';
    const expectedResponse = {
      id: 'vc123',
      type: 'TestCredential',
      issuer: 'Test Issuer',
      credentialSubject: { name: 'Test User' },
    };
    mockAdapter.getVCById.mockResolvedValue(expectedResponse);

    const result = await service.getVCById(userId, vcId, token);
    expect(mockAdapter.getVCById).toHaveBeenCalledWith(userId, vcId, token);
    expect(result).toEqual(expectedResponse);
  });

  it('should call uploadVCFromQR on adapter with token', async () => {
    const userId = 'user123';
    const uploadData = { qrData: 'qr-code-data' };
    const token = 'bearer-token-123';
    const expectedResponse = {
      status: 'success',
      vcId: 'uploaded-vc-123',
    };
    mockAdapter.uploadVCFromQR.mockResolvedValue(expectedResponse);

    const result = await service.uploadVCFromQR(userId, uploadData, token);
    expect(mockAdapter.uploadVCFromQR).toHaveBeenCalledWith(
      userId,
      uploadData.qrData,
      token,
    );
    expect(result).toEqual(expectedResponse);
  });
});

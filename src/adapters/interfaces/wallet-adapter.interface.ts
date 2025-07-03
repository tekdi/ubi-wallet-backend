export interface OnboardUserDto {
  firstName: string;
  lastName: string;
  externalUserId?: string;
  username: string;
  password: string;
  email?: string;
  phone?: string;
}

export interface OnboardedUserResponse {
  statusCode: number;
  message: string;
  data?: {
    accountId: string;
    token: string;
    did?: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      username: string;
      accountId: string;
      status: string;
    };
  };
}

export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface LoginVerifyDto {
  sessionId: string;
  otp: string;
}

export interface LoginResponse {
  statusCode: number;
  message: string;
  data?: {
    token: string;
    accountId: string;
    user: any;
  };
}

export interface LoginVerifyResponse {
  statusCode: number;
  message: string;
  data?: {
    token: string;
    accountId: string;
  };
}

export interface ResendOtpDto {
  sessionId: string;
}

export interface ResendOtpResponse {
  statusCode: number;
  message: string;
}

export interface VCListResponse {
  statusCode: number;
  message: string;
  data?: Array<{
    id: string;
    name: string;
    issuer: string;
    issuedAt: string;
  }>;
}

export interface VCDetailsResponse {
  statusCode: number;
  message: string;
  data?: {
    id: string;
    type: string;
    issuer: string;
    credentialSubject: any;
  };
}

export interface UploadResponse {
  statusCode: number;
  message: string;
  data?: {
    status: string;
    vcId: string;
  };
}

export interface IWalletAdapter {
  onboardUser(data: OnboardUserDto): Promise<OnboardedUserResponse>;
  login(data: LoginRequestDto): Promise<LoginResponse>;
  getAllVCs(accountId: string, token: string): Promise<VCListResponse>;
  getVCById(
    accountId: string,
    vcId: string,
    token: string,
  ): Promise<VCDetailsResponse>;
  uploadVCFromQR(
    accountId: string,
    qrData: string,
    token: string,
  ): Promise<UploadResponse>;
}

export interface IWalletAdapterWithOtp extends IWalletAdapter {
  verifyLogin(data: LoginVerifyDto): Promise<LoginVerifyResponse>;
  resendOtp(data: ResendOtpDto): Promise<ResendOtpResponse>;
}

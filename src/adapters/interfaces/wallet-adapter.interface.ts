export interface OnboardUserDto {
  name: string;
  phone: string;
  externalUserId: string;
}

export interface OnboardedUserResponse {
  accountId: string;
  token: string;
  did?: string;
}

export interface LoginRequestDto {
  email: string;
  deviceInfo?: string;
}

export interface LoginVerifyDto {
  sessionId: string;
  otp: string;
}

export interface LoginResponse {
  sessionId: string;
  message: string;
}

export interface LoginVerifyResponse {
  token: string;
  accountId: string;
  message: string;
}

export interface ResendOtpDto {
  sessionId: string;
}

export interface ResendOtpResponse {
  message: string;
}

export interface VCListResponse {
  id: string;
  name: string;
  issuer: string;
  issuedAt: string;
}

export interface VCDetailsResponse {
  id: string;
  type: string;
  issuer: string;
  credentialSubject: any;
}

export interface UploadResponse {
  status: string;
  vcId: string;
}

export interface IWalletAdapter {
  onboardUser(data: OnboardUserDto): Promise<OnboardedUserResponse>;
  login(data: LoginRequestDto): Promise<LoginResponse>;
  getAllVCs(accountId: string): Promise<VCListResponse[]>;
  getVCById(accountId: string, vcId: string): Promise<VCDetailsResponse>;
  uploadVCFromQR(accountId: string, qrData: string): Promise<UploadResponse>;
}

export interface IWalletAdapterWithOtp extends IWalletAdapter {
  verifyLogin(data: LoginVerifyDto): Promise<LoginVerifyResponse>;
  resendOtp(data: ResendOtpDto): Promise<ResendOtpResponse>;
}

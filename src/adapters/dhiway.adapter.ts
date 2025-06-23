import { Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  IWalletAdapterWithOtp,
  OnboardUserDto,
  OnboardedUserResponse,
  LoginRequestDto,
  LoginResponse,
  LoginVerifyDto,
  LoginVerifyResponse,
  ResendOtpDto,
  ResendOtpResponse,
  VCListResponse,
  VCDetailsResponse,
  UploadResponse,
} from './interfaces/wallet-adapter.interface';

@Injectable()
export class DhiwayAdapter implements IWalletAdapterWithOtp {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = process.env.DHIWAY_API_BASE || '';
    this.apiKey = process.env.DHIWAY_API_KEY || '';
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async onboardUser(data: OnboardUserDto): Promise<OnboardedUserResponse> {
    console.log(data,'=========')
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/custom-user/create`,
        {
          accountId: data.externalUserId,
          name: data.name,
          phone: data.phone,
        },
        { headers: this.getHeaders() },
      );

      const responseData = response.data as any;
      console.log(responseData)
      return {
        accountId: responseData.accountId || data.externalUserId,
        token: responseData.token,
        did: responseData?.did
      };
    } catch (error: any) {
      throw new Error(`Failed to onboard user: ${error.message}`);
    }
  }

  async login(data: LoginRequestDto): Promise<LoginResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/otp/login`,
        {
          email: data.email,
          deviceInfo: data.deviceInfo || 'Web Application',
        },
        { headers: this.getHeaders() },
      );

      const responseData = response.data as any;
      return {
        sessionId: responseData.sessionId || responseData.id,
        message: responseData.message || 'OTP sent successfully',
      };
    } catch (error: any) {
      throw new Error(`Failed to initiate login: ${error.message}`);
    }
  }

  async verifyLogin(data: LoginVerifyDto): Promise<LoginVerifyResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/otp/login-verify`,
        {
          sessionId: data.sessionId,
          otp: data.otp,
        },
        { headers: this.getHeaders() },
      );

      const responseData = response.data as any;
      return {
        token: responseData.token,
        accountId: responseData.accountId || responseData.userId,
        message: responseData.message || 'Login successful',
      };
    } catch (error: any) {
      throw new Error(`Failed to verify login: ${error.message}`);
    }
  }

  async resendOtp(data: ResendOtpDto): Promise<ResendOtpResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/otp/resendOtp`,
        {
          sessionId: data.sessionId,
        },
        { headers: this.getHeaders() },
      );

      const responseData = response.data as any;
      return {
        message: responseData.message || 'OTP resent successfully',
      };
    } catch (error: any) {
      throw new Error(`Failed to resend OTP: ${error.message}`);
    }
  }

  async getAllVCs(accountId: string): Promise<VCListResponse[]> {
    try {
      // First, we need to get the user's DID
      const userResponse = await axios.get(
        `${this.baseUrl}/api/v1/users/${accountId}`,
        { headers: this.getHeaders() },
      );

      const userData = userResponse.data as any;
      const token = userData.token;

      // Then get the credentials for this DID
      const credentialsResponse = await axios.get(
        `${this.baseUrl}/api/v1/cred`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const credentialsData = credentialsResponse.data as any;
      // Transform the response to match our interface
      return credentialsData.credentials?.map((cred: any) => ({
        id: cred.id,
        name: cred.type || 'Verifiable Credential',
        issuer: cred.issuer?.name || 'Unknown Issuer',
        issuedAt: cred.issuanceDate || new Date().toISOString(),
      })) || [];
    } catch (error: any) {
      throw new Error(`Failed to get VCs: ${error.message}`);
    }
  }

  async getVCById(accountId: string, vcId: string): Promise<VCDetailsResponse> {
    try {
      // First, we need to get the user's DID
      const userResponse = await axios.get(
        `${this.baseUrl}/api/v1/users/${accountId}`,
        { headers: this.getHeaders() },
      );

      const userData = userResponse.data as any;
      const did = userData.did;

      // Get the specific credential
      const credentialResponse = await axios.get(
        `${this.baseUrl}/api/v1/cred`,
        {
          headers: {
            ...this.getHeaders(),
            Authorization: `Bearer ${userData.token}`,
          },
        },
      );

      const credentialsData = credentialResponse.data as any;
      const credential = credentialsData.credentials?.find(
        (cred: any) => cred.id === vcId,
      );

      if (!credential) {
        throw new Error('Credential not found');
      }

      return {
        id: credential.id,
        type: credential.type,
        issuer: credential.issuer?.name || 'Unknown Issuer',
        credentialSubject: credential.credentialSubject || {},
      };
    } catch (error: any) {
      throw new Error(`Failed to get VC by ID: ${error.message}`);
    }
  }

  async uploadVCFromQR(accountId: string, qrData: string): Promise<UploadResponse> {
    try {
      // First, we need to get the user's DID
      const userResponse = await axios.get(
        `${this.baseUrl}/api/v1/users/${accountId}`,
        { headers: this.getHeaders() },
      );

      const userData = userResponse.data as any;
      const did = userData?.did;

      // Parse the QR data to extract VC
      const parsedVC = this.extractVCFromQR(qrData);
console.log(parsedVC,'=========')
      // Create a message with the VC
      const messageResponse = await axios.post(
        `${this.baseUrl}/api/v1/message/create/${did}`,
          parsedVC,
        {
          headers: {
            ...this.getHeaders()
          },
        },
      );
      const messageData = messageResponse.data as any;
      return {
        status: 'success',
        vcId: messageData.messageId || 'vc-uploaded',
      };
    } catch (error: any) {
      throw new Error(`Failed to upload VC from QR: ${error.message}`);
    }
  }

  private extractVCFromQR(qrData: string): any {
    try {
      // This is a simplified implementation
      // In a real scenario, you would need to properly parse the QR data
      // which might be a JWT, JSON-LD, or other format
      const parsed = JSON.parse(qrData);
      return parsed;
    } catch {
      // If it's not JSON, assume it's a JWT or other format
      // For now, return a basic structure
      return {
        type: 'VerifiableCredential',
        credentialSubject: {},
        issuer: 'QR Upload',
        issuanceDate: new Date().toISOString(),
      };
    }
  }
}

// 240996
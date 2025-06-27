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
import { UserService } from '../users/user.service';

interface ApiResponse {
  accountId?: string;
  token?: string;
  did?: string;
  message?: string;
  statusCode?: number;
  data?: Record<string, unknown>;
  userId?: string;
  credentials?: Array<{
    id: string;
    type?: string;
    issuer?: { name?: string };
    issuanceDate?: string;
    credentialSubject?: Record<string, unknown>;
  }>;
  messageId?: string;
}

interface ErrorWithMessage {
  message: string;
}

interface Credential {
  id: string;
  active: boolean;
  identifier: string;
  did: string;
  details?: {
    user?: string;
    meta?: string;
    documentTitle?: string;
  };
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class DhiwayAdapter implements IWalletAdapterWithOtp {
  private readonly dhiwayBaseUrl: string;
  private readonly DHIWAY_VC_ISSUER_INSTANCE_URI: string;
  private readonly apiKey: string;

  constructor(private readonly userService: UserService) {
    this.dhiwayBaseUrl = process.env.DHIWAY_API_BASE || '';
    this.apiKey = process.env.DHIWAY_API_KEY || '';
    this.DHIWAY_VC_ISSUER_INSTANCE_URI = process.env.DHIWAY_VC_ISSUER_INSTANCE_URI || '';
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private getAuthHeaders(token: string) {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async onboardUser(data: OnboardUserDto): Promise<OnboardedUserResponse> {
    try {
      // First, create user in Dhiway wallet service
      const response = await axios.post(
        `${this.dhiwayBaseUrl}/api/v1/custom-user/create`,
        {
          accountId: data.externalUserId,
          name: `${data.firstName} ${data.lastName}`,
          phone: data.phone,
        },
        { headers: this.getHeaders() },
      );

      const responseData = response.data as ApiResponse;
      const accountId = responseData.accountId || data.externalUserId;
      const token = responseData.token || '';
      const did = responseData.did;

      // Then create user in local database
      const user = await this.userService.createUser({
        firstName: data.firstName,
        lastName: data.lastName,
        accountId,
        username: data.username,
        password: data.password,
        token,
        did,
        phone: data.phone,
        email: data.email,
        createdBy: 'system',
      });

      return {
        accountId,
        token,
        did,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          accountId: user.accountId,
          status: user.status,
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        (error as ErrorWithMessage).message || 'Unknown error';
      throw new Error(`Failed to onboard user: ${errorMessage}`);
    }
  }

  async login(data: LoginRequestDto): Promise<LoginResponse> {
    const returnData: LoginResponse = {
      statusCode: 200,
      message: '',
      data: {
        token: '',
        accountId: '',
        user: { id: '', firstName: '', lastName: '', username: '' },
      },
    };

    try {
      // Find user in local database
      const user = await this.userService.findByUsername(data.username);
      if (!user) {
        returnData.statusCode = 401;
        returnData.message = 'Invalid credentials';

        return returnData;
      }

      // Validate password
      const isValidPassword = await this.userService.validatePassword(
        user,
        data.password,
      );
      if (!isValidPassword) {
        returnData.statusCode = 401;
        returnData.message = 'Invalid credentials';

        return returnData;
      }

      // Check if user is blocked
      if (user.blocked) {
        returnData.statusCode = 403;
        returnData.message = 'User account is blocked';

        return returnData;
      }

      // Get fresh token from Dhiway if needed
      let token = user.token;
      if (!token) {
        // Regenerate token from Dhiway
        const tokenResponse = await axios.post(
          `${this.dhiwayBaseUrl}/api/v1/custom-user/regenerate-token`,
          {
            accountId: user.accountId,
          },
          { headers: this.getHeaders() },
        );

        const tokenData = tokenResponse.data as ApiResponse;
        token = tokenData.token || '';

        // Update token in local database
        await this.userService.updateToken(user.accountId, token);
      }

      return {
        statusCode: 200,
        message: 'Login successful',
        data: {
          token,
          accountId: user.accountId,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
          },
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        (error as ErrorWithMessage).message || 'Unknown error';
      throw new Error(`Failed to login: ${errorMessage}`);
    }
  }

  async verifyLogin(data: LoginVerifyDto): Promise<LoginVerifyResponse> {
    try {
      const response = await axios.post(
        `${this.dhiwayBaseUrl}/api/v1/otp/login-verify`,
        {
          sessionId: data.sessionId,
          otp: data.otp,
        },
        { headers: this.getHeaders() },
      );

      const responseData = response.data as ApiResponse;

      return {
        token: responseData.token || '',
        accountId: responseData.accountId || responseData.userId || '',
        message: responseData.message || 'Login successful',
      };
    } catch (error: unknown) {
      const errorMessage =
        (error as ErrorWithMessage).message || 'Unknown error';
      throw new Error(`Failed to verify login: ${errorMessage}`);
    }
  }

  async resendOtp(data: ResendOtpDto): Promise<ResendOtpResponse> {
    try {
      const response = await axios.post(
        `${this.dhiwayBaseUrl}/api/v1/otp/resendOtp`,
        {
          sessionId: data.sessionId,
        },
        { headers: this.getHeaders() },
      );

      const responseData = response.data as ApiResponse;

      return {
        message: responseData.message || 'OTP resent successfully',
      };
    } catch (error: unknown) {
      const errorMessage =
        (error as ErrorWithMessage).message || 'Unknown error';
      throw new Error(`Failed to resend OTP: ${errorMessage}`);
    }
  }

  async getAllVCs(accountId: string, token: string): Promise<VCListResponse[]> {
    try {
      // Get the credentials using the provided token
      const credentialsResponse = await axios.get(
        `${this.dhiwayBaseUrl}/api/v1/cred`,
        {
          headers: this.getAuthHeaders(token),
        },
      );

      const credentialsData = credentialsResponse.data as Array<Credential>;

      const credentials = credentialsData.map((cred) => ({
        id: cred.id,
        name: cred.details?.documentTitle || 'Verifiable Credential',
        issuer: cred.details?.user || 'Unknown Issuer',
        issuedAt: cred.createdAt || new Date().toISOString(),
      }));

      return credentials || [];
    } catch (error: unknown) {
      const errorMessage =
        (error as ErrorWithMessage).message || 'Unknown error';
      throw new Error(`Failed to get VCs: ${errorMessage}`);
    }
  }

  async getVCById(
    accountId: string,
    vcId: string,
    token: string,
  ): Promise<VCDetailsResponse> {
    try {
      // Get the specific credential using the provided token
      const credentialResponse = await axios.get(
        `${this.dhiwayBaseUrl}/api/v1/cred`,
        {
          headers: this.getAuthHeaders(token),
        },
      );

      const credentialsData = credentialResponse.data;
      const credential = credentialsData.find((cred) => cred.id === vcId);
      if (!credential) {
        throw new Error('Credential not found');
      }

      return {
        id: credential.id,
        type: credential.type || 'VerifiableCredential',
        issuer: credential.issuer?.name || 'Unknown Issuer',
        credentialSubject: credential.credentialSubject || {},
      };
    } catch (error: unknown) {
      const errorMessage =
        (error as ErrorWithMessage).message || 'Unknown error';
      throw new Error(`Failed to get VC by ID: ${errorMessage}`);
    }
  }

  private formatMessagePayload({
    id,
    fromDid,
    toDid,
    document,
    vc,
    detailsMeta = '',
    detailsDocumentTitle = '',
    detailsUser = 'custom',
    type = 'document',
  }: {
    id: string;
    fromDid: string;
    toDid: string;
    document: string;
    vc: Record<string, unknown>;
    detailsMeta?: string;
    detailsDocumentTitle?: string;
    detailsUser?: string;
    type?: string;
  }) {
    return {
      id,
      fromDid,
      toDid,
      message: {
        document,
        vc,
      },
      details: {
        meta: detailsMeta,
        documentTitle: detailsDocumentTitle,
        user: detailsUser,
      },
      type,
    };
  }

  async uploadVCFromQR(
    accountId: string,
    qrData: string,
    token: string,
  ): Promise<UploadResponse> {
    try {
      // Get the user's DID from local database
      const user = await this.userService.findByToken(token);
      if (!user) {
        throw new Error('User not found');
      }

      const did = user.did;
      if (!did) {
        throw new Error('User DID not found');
      }

      // Parse the QR data to extract VC
      const parsedVC = await this.extractVCFromQR(qrData);

      // Format the message payload
      const messagePayload = this.formatMessagePayload({
        id: typeof parsedVC.id === 'string' ? parsedVC.id : 'generated-id',
        fromDid: did,
        toDid: did, // You may want to adjust this as needed
        document: 'string',
        vc: parsedVC,
        detailsMeta: 'string',
        detailsDocumentTitle: typeof parsedVC.credentialSubject === 'object' && parsedVC.credentialSubject && 'name' in parsedVC.credentialSubject ? String((parsedVC.credentialSubject as any).name) : '',
        detailsUser: 'custom',
        type: 'document',
      });
      // Create a message with the VC
      const messageResponse = await axios.post(
        `${this.dhiwayBaseUrl}/api/v1/message/create/${did}`,
        messagePayload,
        {
          headers: this.getAuthHeaders(this.apiKey),
        },
      );
     
      const messageData = messageResponse.data as ApiResponse;

      return {
        status: 'success',
        vcId: messageData.messageId || 'vc-uploaded',
      };
    } catch (error: unknown) {
      const errorMessage =
        (error as ErrorWithMessage).message || 'Unknown error';
      throw new Error(`Failed to upload VC from QR: ${errorMessage}`);
    }
  }

  private async extractVCFromQR(qrData: string): Promise<Record<string, unknown>> {
    if (!qrData) {
      throw new Error('QR data is required');
    }
    try {
      const splitqrData = qrData.split('/');
      const issuinceId = splitqrData[splitqrData.length - 1];
      const response = await axios.get(
        `${this.DHIWAY_VC_ISSUER_INSTANCE_URI}/m/${issuinceId}.vc`
      );
      const vcData = response?.data;
      if (!vcData) {
        throw new Error('No verifiable credential data found in response');
      }
      return vcData;
    } catch (error) {
      throw new Error('Failed to extract verifiable credential from QR: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}

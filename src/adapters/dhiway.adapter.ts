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
  WatchVcDto,
  WatchVcResponse,
} from './interfaces/wallet-adapter.interface';
import { UserService } from '../users/user.service';
import { LoggerService } from '../common/logger/logger.service';

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
  type?: string;
  credentialVC?: string | Record<string, unknown>;
}

@Injectable()
export class DhiwayAdapter implements IWalletAdapterWithOtp {
  private readonly dhiwayBaseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly userService: UserService,
    private readonly logger: LoggerService,
  ) {
    this.dhiwayBaseUrl = process.env.DHIWAY_API_BASE || '';
    this.apiKey = process.env.DHIWAY_API_KEY || '';
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
      // Check if username already exists
      const usernameExists = await this.userService.checkUsernameExists(
        data.username,
      );
      if (usernameExists) {
        return {
          statusCode: 409,
          message: 'Username already exists',
        };
      }

      // Check if email already exists (if email is provided)
      if (data.email) {
        const emailExists = await this.userService.checkEmailExists(data.email);
        if (emailExists) {
          return {
            statusCode: 409,
            message: 'Email already registered',
          };
        }
      }

      // First, create user in Dhiway wallet service
      const externalUserId = data.externalUserId || data.username;
      const response = await axios.post(
        `${this.dhiwayBaseUrl}/api/v1/custom-user/create`,
        {
          accountId: externalUserId,
          name: `${data.firstName} ${data.lastName}`,
          phone: data.phone,
        },
        { headers: this.getHeaders() },
      );

      const responseData = response.data as ApiResponse;
      const accountId = externalUserId;
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
        statusCode: 200,
        message: 'User onboarded successfully',
        data: {
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
        },
      };
    } catch (error: unknown) {
      // Handle specific database constraint errors
      if (error instanceof Error) {
        return {
          statusCode: 409,
          message: error.message || 'Failed to onboard user',
        };
      }

      this.logger.logError('Failed to onboard user', error, 'onboardUser');
      return {
        statusCode: 500,
        message: 'Failed to onboard user',
      };
    }
  }

  async login(data: LoginRequestDto): Promise<LoginResponse> {
    try {
      // Find user in local database
      const user = await this.userService.findByUsername(data.username);
      if (!user) {
        return {
          statusCode: 401,
          message: 'Invalid credentials',
        };
      }

      // Validate password
      const isValidPassword = await this.userService.validatePassword(
        user,
        data.password,
      );
      if (!isValidPassword) {
        return {
          statusCode: 401,
          message: 'Invalid credentials',
        };
      }

      // Check if user is blocked
      if (user.blocked) {
        return {
          statusCode: 403,
          message: 'User account is blocked',
        };
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
      this.logger.logError('Failed to login', error, 'login');
      return {
        statusCode: 500,
        message: 'Failed to login',
      };
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
        statusCode: 200,
        message: responseData.message || 'Login verification successful',
        data: {
          token: responseData.token || '',
          accountId: responseData.accountId || responseData.userId || '',
        },
      };
    } catch (error: unknown) {
      this.logger.logError('Failed to verify login', error, 'verifyLogin');
      return {
        statusCode: 500,
        message: 'Failed to verify login',
      };
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
        statusCode: 200,
        message: responseData.message || 'OTP resent successfully',
      };
    } catch (error: unknown) {
      this.logger.logError('Failed to resend OTP', error, 'resendOtp');
      return {
        statusCode: 500,
        message: 'Failed to resend OTP',
      };
    }
  }

  async getAllVCs(accountId: string, token: string): Promise<VCListResponse> {
    try {
      // Get the credentials using the provided token
      const credentialsResponse = await axios.get(
        `${this.dhiwayBaseUrl}/api/v1/cred`,
        {
          headers: this.getAuthHeaders(token),
        },
      );

      const credentialsData = credentialsResponse.data as Credential[];

      // Map over the credentials data to extract relevant fields and format them
      const credentials = credentialsData.map((cred) => {
        let expiresAt = '';
        let issuedAt = '';
        let vcName = '';
        let documentTitle = '';

        // If the credentialVC is a string, try to parse it as JSON to extract dates
        if (typeof cred.credentialVC === 'string') {
          try {
            const parsedVC = JSON.parse(cred.credentialVC);

            vcName =
              (typeof parsedVC?.credentialSchema?.title === 'string'
                ? parsedVC.credentialSchema.title.split(':')[0]
                : '') || 'Verifiable Credential';

            // Check if the parsed object has 'validFrom' and 'validUntil' fields
            if (parsedVC && typeof parsedVC === 'object' && 'validFrom' in parsedVC) {
              expiresAt = String((parsedVC as Record<string, unknown>).validUntil ?? '');
              issuedAt = String((parsedVC as Record<string, unknown>).validFrom ?? '');
            }
          } catch {
            // If parsing fails, leave dates as empty strings
            expiresAt = '';
            issuedAt = '';
          }
        } else if (cred.credentialVC && typeof cred.credentialVC === 'object' && 'validFrom' in cred.credentialVC) {
          expiresAt = String((cred.credentialVC as Record<string, unknown>).validUntil ?? '');
          issuedAt = String((cred.credentialVC as Record<string, unknown>).validFrom ?? '');
        }

        // Get the document title from the credential details
        documentTitle = cred.details?.documentTitle || '';

        // Return the formatted credential object
        return {
          id: cred.id,
          name: vcName || 'Verifiable Credential',
          active: cred.active || false,
          issuedAt,
          expiresAt,
          documentTitle,
        };
      });

      // Filter out credentials where documentTitle is 'OTP'
      const filteredCredentials = credentials.filter(
        (cred) => cred.documentTitle !== 'otp',
      );

      // Sort credentials by issuedAt in descending order (newest first)
      const sortedCredentials = [...filteredCredentials].sort((a, b) => {
        const dateA = a.issuedAt ? new Date(a.issuedAt).getTime() : 0;
        const dateB = b.issuedAt ? new Date(b.issuedAt).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });

      return {
        statusCode: 200,
        message: 'VCs retrieved successfully',
        data: sortedCredentials,
      };
    } catch (error: unknown) {
      this.logger.logError('Failed to get VCs', error, 'getAllVCs');
      return {
        statusCode: 500,
        message: 'Failed to get VCs',
      };
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

      const credentialsData = credentialResponse.data as Credential[];
      const credential = credentialsData.find((cred) => cred.id === vcId);

      if (!credential) {
        return {
          statusCode: 404,
          message: 'Credential not found',
        };
      }

      let credentialSubject = credential?.credentialVC;
      if (credentialSubject && typeof credentialSubject === 'string') {
        try {
          credentialSubject = JSON.parse(credentialSubject) as Record<
            string,
            unknown
          >;
        } catch {
          credentialSubject = {};
        }
      }

      // Remove @context, id, start_date from credentialSubject and rename fields
      if (credentialSubject && typeof credentialSubject === 'object') {
        const credentialSubjectObj = credentialSubject;
        const credentialSubjectData =
          (credentialSubjectObj.credentialSubject as Record<string, unknown>) ||
          {};

        const { end_date, issue_date, ...rest } = credentialSubjectData;

        // Rename end_date to 'Expiry Date' and issue_date to 'Issue Date'
        const modifiedCredentialSubject: Record<string, unknown> = {
          ...(rest as Record<string, unknown>),
        };

        if (end_date) {
          modifiedCredentialSubject['Expiry Date'] = end_date;
        }
        if (issue_date) {
          modifiedCredentialSubject['Issue Date'] = issue_date;
        }

        credentialSubjectObj.credentialSubject = modifiedCredentialSubject;
      }

      return {
        statusCode: 200,
        message: 'Successfully fetched the VC',
        data: {
          id: credential.id,
          name: credential.details?.documentTitle || 'Verifiable Credential',
          type: credential.type || 'Verifiable Credential',
          json: credential.credentialVC || {},
          credentialSubject:
            (credentialSubject as Record<string, unknown>)?.credentialSubject ||
            {},
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        (error as ErrorWithMessage).message || 'Unknown error';
      this.logger.error(errorMessage);
      return {
        statusCode: 500,
        message: 'Failed to get VC details',
      };
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
        return {
          statusCode: 404,
          message: 'User not found',
        };
      }

      const did = user.did;
      if (!did) {
        return {
          statusCode: 400,
          message: 'User DID not found',
        };
      }

      if (!qrData) {
        return {
          statusCode: 400,
          message: 'Unable to upload VC from QR: QR data is empty',
        };
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
        detailsDocumentTitle:
          typeof parsedVC.credentialSubject === 'object' &&
          parsedVC.credentialSubject &&
          'name' in parsedVC.credentialSubject
            ? String(
                (parsedVC.credentialSubject as Record<string, unknown>).name,
              )
            : '',
        detailsUser: 'custom',
        type: 'document',
      });
      // Check if VC already exists in wallet
      const credentialsResponse = await axios.get(
        `${this.dhiwayBaseUrl}/api/v1/cred`,
        {
          headers: this.getAuthHeaders(token),
        },
      );

      const credentialsData = credentialsResponse.data as Credential[];

      // Check if a credential with same ID already exists
      const existingCredential = credentialsData.find((cred) => {
        if (typeof cred.credentialVC === 'string') {
          try {
            const parsedCred = JSON.parse(cred.credentialVC);
            return parsedCred.id === parsedVC.id;
          } catch {
            return false;
          }
        } else if (cred.credentialVC && typeof cred.credentialVC === 'object') {
          return cred.credentialVC.id === parsedVC.id;
        }
        return false;
      });

      if (existingCredential) {
        return {
          statusCode: 409,
          message: 'This verifiable credential is already added to your wallet',
        };
      }

      // Create a message with the VC
      const messageResponse = await axios.post(
        `${this.dhiwayBaseUrl}/api/v1/message/create/${did}`,
        messagePayload,
        {
          headers: this.getAuthHeaders(this.apiKey),
        },
      );

      const messageData = messageResponse.data as ApiResponse;

      // Extract the VC ID from the QR data URL
      const vcPublicId = qrData.split('/').pop();
      if (!vcPublicId) {
        throw new Error('Could not extract VC ID from QR data URL');
      }

      // Automatically add a watcher for the uploaded VC
      try {
        const watchData: WatchVcDto = {
          vcPublicId: vcPublicId,
        };

        await this.watchVC(watchData, token);
        this.logger.log(
          'Watcher automatically added for uploaded VC',
          'uploadVCFromQR',
        );
      } catch (watchError) {
        // Log the error but don't fail the upload
        this.logger.error(
          'Failed to add watcher for uploaded VC: ' +
            (watchError instanceof Error
              ? watchError.message
              : 'Unknown error'),
        );
      }

      return {
        statusCode: 200,
        message: 'VC uploaded successfully from QR',
        data: {
          status: 'success',
          vcId: messageData.messageId || 'vc-uploaded',
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        (error as ErrorWithMessage).message || 'Unknown error';
      this.logger.error(errorMessage);
      return {
        statusCode: 500,
        message: 'Failed to upload VC from QR',
      };
    }
  }

  private async extractVCFromQR(
    qrData: string,
  ): Promise<Record<string, unknown>> {
    if (!qrData) {
      throw new Error('QR data is required');
    }
    if (!qrData.startsWith('http://') && !qrData.startsWith('https://')) {
      throw new Error('Invalid QR data: Must be a valid URI');
    }

    try {
      const response = await axios.get(`${qrData}.vc`, { timeout: 10000 });
      const vcData = response?.data as Record<string, unknown>;
      if (!vcData) {
        throw new Error('No verifiable credential data found in response');
      }
      return vcData;
    } catch (error) {
      throw new Error(
        'Failed to extract verifiable credential from QR: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      );
    }
  }

  async watchVC(data: WatchVcDto, token: string): Promise<WatchVcResponse> {
    try {
      // Get the user's DID from local database using token
      const user = await this.userService.findByToken(token);
      if (!user) {
        return {
          statusCode: 404,
          message: 'User not found',
        };
      }

      const did = user.did;
      if (!did) {
        return {
          statusCode: 400,
          message: 'User DID not found',
        };
      }

      data.email = process.env.DHIWAY_WATCHER_EMAIL;
      data.callbackUrl = `${process.env.WALLET_SERVICE_BASE_URL}/api/wallet/vcs/watch/callback`;

      // Get VC data using publicId
      try {
        const vcResponse = await axios.get(
          `${process.env.DHIWAY_VC_ISSUER_GET_VC_BASE_URI}/${data.vcPublicId}.json`,
          { timeout: 10000 },
        );

        const vcData = vcResponse?.data as Record<string, unknown>;
        if (!vcData) {
          return {
            statusCode: 404,
            message: 'No verifiable credential data found',
          };
        }

        // Update vcPublicId from response if needed
        if (vcData.publicId) {
          data.vcPublicId = vcData.publicId as string;
        }

        // Update identifier from response if needed
        if (vcData.identifier) {
          data.identifier = vcData.identifier as string;
        }
      } catch (error) {
        this.logger.error(
          'Failed to fetch VC data: ' +
            (error instanceof Error ? error.message : 'Unknown error'),
        );
        return {
          statusCode: 500,
          message: 'Failed to fetch verifiable credential data',
        };
      }

      // Prepare the watch payload for Dhiway API
      const watchPayload = {
        identifier: data.identifier,
        recordPublicId: data.vcPublicId,
        email: data.email,
        callbackUrl: data.callbackUrl,
      };

      // Call Dhiway watch API
      const response = await axios.post(
        `${process.env.DHIWAY_VC_ISSUER_INSTANCE_URI}/api/watch`,
        watchPayload,
        { headers: this.getHeaders() },
      );

      const responseData = response.data as ApiResponse;

      return {
        statusCode: 200,
        message: 'VC watch registered successfully',
        data: {
          watchId: responseData.messageId || 'watch-registered',
          status: 'success',
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        (error as ErrorWithMessage).message || 'Unknown error';
      this.logger.error(errorMessage);
      return {
        statusCode: 500,
        message: 'Failed to register VC watch',
      };
    }
  }
}

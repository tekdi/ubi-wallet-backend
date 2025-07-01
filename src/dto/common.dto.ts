export class OnboardedUserResponse {
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

export class VCListResponse {
  statusCode: number;
  message: string;
  data?: Array<{
    id: string;
    name: string;
    issuer: string;
    issuedAt: string;
  }>;
}

export class VCDetailsResponse {
  statusCode: number;
  message: string;
  data?: {
    id: string;
    type: string;
    issuer: string;
    credentialSubject: any;
  };
}

export class UploadResponse {
  statusCode: number;
  message: string;
  data?: {
    status: string;
    vcId: string;
  };
}

export class ApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: any;
}

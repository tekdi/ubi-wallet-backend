export class OnboardedUserResponse {
  accountId: string;
  token: string;
}

export class VCListResponse {
  id: string;
  name: string;
  issuer: string;
  issuedAt: string;
}

export class VCDetailsResponse {
  id: string;
  type: string;
  issuer: string;
  credentialSubject: any;
}

export class UploadResponse {
  status: string;
  vcId: string;
}

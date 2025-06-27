Wallet Backend Service Documentation

# Overview

This NestJS backend service acts as a middleware between consumer apps (like the beneficiary app) and wallet service providers (e.g., Dhiway, DigiLocker, Custom Wallet).  
<br/>It provides standardized APIs for:  
\- User onboarding  
\- Listing stored Verifiable Credentials (VCs)  
\- Fetching details of a specific VC  
\- Uploading a VC from a scanned QR code  
\- Login into the wallet service provider  
<br/>The service is provider-agnostic, enabling support for multiple wallet providers via a pluggable adapter pattern.  

# Architecture

Beneficiary App (Client) -> Wallet Backend (NestJS) -> Wallet Provider Adapters -> External Wallet Provider APIs  
<br/>Each adapter implements a common interface and handles specific wallet provider API integration.  

# Folder Structure

src/  
├── adapters/  
│ ├── dhiway.adapter.ts  
│ ├── digilocker.adapter.ts  
│ ├── custom.adapter.ts  
│ └── interfaces/  
│ └── wallet-adapter.interface.ts  
├── wallet/  
│ ├── wallet.controller.ts  
│ ├── wallet.service.ts  
├── dto/  
│ ├── onboard-user.dto.ts  
│ ├── upload-vc.dto.ts  
│ └── common.dto.ts  
├── app.module.ts  
└── main.ts  

# Interface: IWalletAdapter

Each wallet provider adapter must implement the following interface:  
<br/>export interface IWalletAdapter {  
onboardUser(data: OnboardUserDto): Promise&lt;OnboardedUserResponse&gt;;  
getAllVCs(accountId: string): Promise&lt;VCListResponse&gt;;  
getVCById(accountId: string, vcId: string): Promise&lt;VCDetailsResponse&gt;;  
uploadVCFromQR(accountId: string, qrData: string): Promise&lt;UploadResponse&gt;;  
}  

# Sample: Dhiway Adapter

@Injectable()  
export class DhiwayAdapter implements IWalletAdapter {  
async onboardUser(data: OnboardUserDto): Promise&lt;OnboardedUserResponse&gt; {  
const response = await axios.post('<https://dhiway.../custom-user/create>', data);  
return { accountId: response.data.account_id, token: response.data.token };  
}  
<br/>async getAllVCs(accountId: string): Promise&lt;VCListResponse&gt; {  
const response = await axios.post('<https://dhiway.../document/list>', { account_id: accountId });  
return response.data;  
}  
<br/>async getVCById(accountId: string, vcId: string): Promise&lt;VCDetailsResponse&gt; {  
const response = await axios.post('<https://dhiway.../document/get>', { account_id: accountId, document_id: vcId });  
return response.data;  
}  
<br/>async uploadVCFromQR(accountId: string, qrData: string): Promise&lt;UploadResponse&gt; {  
const parsed = extractVCFromQR(qrData);  
const response = await axios.post('<https://dhiway.../document/upload>', {  
account_id: accountId,  
document: parsed,  
});  
return response.data;  
}  
}  

# Environment Configuration

WALLET_PROVIDER=dhiway  
DHIWAY_API_BASE=<https://dhiway>...  
DHIWAY_API_KEY=...  

# Dependency Injection: Adapter Selection

@Module({  
providers: \[  
{  
provide: 'WALLET_ADAPTER',  
useClass: getAdapterBasedOnEnv(process.env.WALLET_PROVIDER),  
},  
\],  
controllers: \[WalletController\],  
})  
export class WalletModule {}  

# API Specifications

## 1\. Onboard User

POST /api/wallet/onboard

Request Body:

{  
"name": "Ankush",  
"phone": "9876543210",  
"externalUserId": "uuid-123"  
}  

Response:

{  
"accountId": "abc123",  
"token": "xyz456"  
}  

## 2\. List Verifiable Credentials

GET /api/wallet/:accountId/vcs

Response:

\[  
{  
"id": "vc-1",  
"name": "10th Grade Certificate",  
"issuer": "CBSE",  
"issuedAt": "2022-04-01"  
}  
\]  

## 3\. Get VC by ID

GET /api/wallet/:accountId/vcs/:vcId

Response:

{  
"id": "vc-1",  
"type": "EducationCredential",  
"issuer": "CBSE",  
"credentialSubject": {  
"name": "Ankush",  
"score": "85%"  
}  
}  

## 4\. Upload VC from QR

POST /api/wallet/:accountId/vcs/upload-qr

Request Body:

{  
"qrData": "&lt;scanned-qr-string&gt;"  
}  

Response:

{  
"status": "success",  
"vcId": "vc-123"  
}
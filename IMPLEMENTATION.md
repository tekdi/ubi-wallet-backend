# Wallet Middleware Implementation

This document describes the implementation of the wallet middleware API based on the specifications in `wallet.md` and integration with Dhiway APIs from `Dhiway-apis.md`.

## Architecture Overview

The implementation follows the adapter pattern as specified in the requirements:

```
Client App → Wallet Controller → Wallet Service → Wallet Adapter → External Wallet Provider (Dhiway)
```

## Key Components

### 1. Interface (`src/adapters/interfaces/wallet-adapter.interface.ts`)
Defines the contract for all wallet provider adapters with methods for:
- User onboarding
- Listing VCs
- Getting VC details
- Uploading VCs from QR codes

### 2. DTOs (`src/dto/`)
- `onboard-user.dto.ts`: Validation for user onboarding data
- `upload-vc.dto.ts`: Validation for QR upload data
- `common.dto.ts`: Common response types

### 3. Dhiway Adapter (`src/adapters/dhiway.adapter.ts`)
Implements the wallet adapter interface and integrates with Dhiway APIs:
- Uses `/api/v1/custom-user/create` for user onboarding
- Uses `/api/v1/users/{id}` to get user details
- Uses `/api/v1/cred` to fetch credentials
- Uses `/api/v1/message/create/{did}` for uploading VCs

### 4. Wallet Service (`src/wallet/wallet.service.ts`)
Business logic layer that uses the injected adapter to perform wallet operations.

### 5. Wallet Controller (`src/wallet/wallet.controller.ts`)
REST API endpoints:
- `POST /api/wallet/onboard` - Onboard new user
- `GET /api/wallet/:accountId/vcs` - List all VCs
- `GET /api/wallet/:accountId/vcs/:vcId` - Get specific VC
- `POST /api/wallet/:accountId/vcs/upload-qr` - Upload VC from QR

### 6. Adapter Factory (`src/adapters/adapter.factory.ts`)
Factory function to select the appropriate adapter based on environment configuration.

## Environment Configuration

Create a `.env` file with the following variables:

```env
# Wallet Provider Configuration
WALLET_PROVIDER=dhiway

# Dhiway API Configuration
DHIWAY_API_BASE=https://api.dhiway.com
DHIWAY_API_KEY=your_dhiway_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

## API Endpoints

### 1. Onboard User
```http
POST /api/wallet/onboard
Content-Type: application/json

{
  "name": "Ankush",
  "phone": "9876543210",
  "externalUserId": "uuid-123"
}
```

Response:
```json
{
  "accountId": "abc123",
  "token": "xyz456"
}
```

### 2. List Verifiable Credentials
```http
GET /api/wallet/:accountId/vcs
```

Response:
```json
[
  {
    "id": "vc-1",
    "name": "10th Grade Certificate",
    "issuer": "CBSE",
    "issuedAt": "2022-04-01"
  }
]
```

### 3. Get VC by ID
```http
GET /api/wallet/:accountId/vcs/:vcId
```

Response:
```json
{
  "id": "vc-1",
  "type": "EducationCredential",
  "issuer": "CBSE",
  "credentialSubject": {
    "name": "Ankush",
    "score": "85%"
  }
}
```

### 4. Upload VC from QR
```http
POST /api/wallet/:accountId/vcs/upload-qr
Content-Type: application/json

{
  "qrData": "<scanned-qr-string>"
}
```

Response:
```json
{
  "status": "success",
  "vcId": "vc-123"
}
```

## Running the Application

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (create `.env` file)

3. Start the development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000/api/wallet/`

## Extending for Other Providers

To add support for other wallet providers (e.g., DigiLocker, Custom):

1. Create a new adapter implementing `IWalletAdapter`
2. Add the adapter to the factory function in `adapter.factory.ts`
3. Update environment configuration to use the new provider

## Error Handling

The implementation includes comprehensive error handling:
- HTTP request failures are caught and re-thrown with descriptive messages
- Missing credentials return appropriate error responses
- Invalid QR data is handled gracefully

## Security Considerations

- API keys are stored in environment variables
- Bearer token authentication is used for Dhiway API calls
- Input validation is performed using class-validator decorators
- Error messages don't expose sensitive information 
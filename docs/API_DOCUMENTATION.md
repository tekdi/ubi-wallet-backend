# Wallet Middleware API Documentation

## Overview

The Wallet Middleware (wallet-mw) is a NestJS service that provides a unified interface for interacting with different wallet providers. It currently supports the Dhiway wallet provider with OTP-based authentication.

## Base URL

```
http://localhost:3000/api/wallet
```

## Authentication

The service uses Bearer token authentication for API calls. The token is obtained through the login process.

## Endpoints

### 1. User Onboarding

**POST** `/api/wallet/onboard`

Creates a new user account in the wallet system.

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "externalUserId": "user_123"
}
```

**Response:**
```json
{
  "accountId": "user_123",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validation:**
- `name`: Required string
- `phone`: Required valid phone number format
- `externalUserId`: Required string

---

### 2. Login (OTP-based)

**POST** `/api/wallet/login`

Initiates the login process by sending an OTP to the user's email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "deviceInfo": "Web Application"
}
```

**Response:**
```json
{
  "sessionId": "session_123456",
  "message": "OTP sent successfully"
}
```

**Validation:**
- `email`: Required valid email format
- `deviceInfo`: Optional string

---

### 3. Verify Login OTP

**POST** `/api/wallet/login/verify`

Verifies the OTP and completes the login process.

**Request Body:**
```json
{
  "sessionId": "session_123456",
  "otp": "123456"
}
```

**Response:**
```json
{
  "token": "user_token_123456",
  "accountId": "user_123",
  "message": "Login successful"
}
```

**Validation:**
- `sessionId`: Required string
- `otp`: Required string

**Note:** This endpoint is only available if the wallet provider supports OTP verification.

---

### 4. Resend OTP

**POST** `/api/wallet/login/resend-otp`

Resends the OTP if the user didn't receive it or it expired.

**Request Body:**
```json
{
  "sessionId": "session_123456"
}
```

**Response:**
```json
{
  "message": "OTP resent successfully"
}
```

**Validation:**
- `sessionId`: Required string

**Note:** This endpoint is only available if the wallet provider supports OTP resend.

---

### 5. Get All VCs

**GET** `/api/wallet/{user_id}/vcs`

Retrieves all verifiable credentials for a specific user.

**Path Parameters:**
- `user_id`: The user's account ID

**Headers:**
```
Authorization: Bearer <user_token>
```

**Response:**
```json
[
  {
    "id": "vc_123",
    "name": "Verifiable Credential",
    "issuer": "Issuing Authority",
    "issuedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 6. Get VC by ID

**GET** `/api/wallet/{user_id}/vcs/{vcId}`

Retrieves a specific verifiable credential by its ID.

**Path Parameters:**
- `user_id`: The user's account ID
- `vcId`: The verifiable credential ID

**Headers:**
```
Authorization: Bearer <user_token>
```

**Response:**
```json
{
  "id": "vc_123",
  "type": "VerifiableCredential",
  "issuer": "Issuing Authority",
  "credentialSubject": {
    "id": "did:example:123",
    "name": "John Doe"
  }
}
```

---

### 7. Upload VC from QR

**POST** `/api/wallet/{user_id}/vcs/upload-qr`

Uploads a Verifiable Credential from QR code data to the user's wallet.

**Path Parameters:**
- `user_id`: The user's account ID

**Headers:**
```
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "qrData": "https://example.com/vc/123"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "VC uploaded successfully from QR",
  "data": {
    "status": "success",
    "vcId": "vc-uploaded"
  }
}
```

**Note:** After successfully uploading a VC, a watcher is automatically added to monitor changes to the credential.

---

### 8. Register VC Watch

**POST** `/api/wallet/vcs/watch`

Registers a watcher for a specific Verifiable Credential.

**Request Body:**
```json
{
  "vcPublicId": "string",
  "email": "string (optional)",
  "callbackUrl": "string (optional)"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "VC watch registered successfully",
  "data": {
    "watchId": "watch-registered",
    "status": "success"
  }
}
```

**Validation:**
- `vcPublicId`: Required string
- `email`: Optional valid email format
- `callbackUrl`: Optional string

**Error Responses:**
- `400`: Watch functionality not supported by wallet provider
- `401`: Invalid authorization
- `404`: User not found
- `500`: Failed to register VC watch

---

### 9. Watch Callback

**POST** `/api/wallet/vcs/watch/callback`

Receives notifications when watched VCs are updated.

**Request Body:**
```json
{
  "identifier": "string",
  "recordPublicId": "string",
  "messageId": "string",
  "data": {},
  "timestamp": "string"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Watch callback processed successfully",
  "data": {
    "processed": true,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "user_id": "user123",
    "recordPublicId": "vc123"
  }
}
```

---

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "OTP verification not supported by this wallet provider",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Failed to onboard user: Invalid credentials",
  "error": "Internal Server Error"
}
```

---

## Environment Variables

The service requires the following environment variables:

```env
# Dhiway API Configuration
DHIWAY_API_BASE=https://api.dhiway.com
DHIWAY_API_KEY=your_api_key_here

# Dhiway VC Issuer Instance URI for watch API
DHIWAY_VC_ISSUER_INSTANCE_URI=https://your-dhiway-instance.com

# Default email for watch notifications
DHIWAY_WATCHER_EMAIL=watcher@example.com

# Wallet service base URL for callback endpoints
WALLET_SERVICE_BASE_URL=http://localhost:3018

# Wallet Provider (optional, defaults to 'dhiway')
WALLET_PROVIDER=dhiway
```

---

## Usage Examples

### Complete Login Flow

1. **Initiate Login:**
```bash
curl -X POST http://localhost:3000/api/wallet/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

2. **Verify OTP:**
```bash
curl -X POST http://localhost:3000/api/wallet/login/verify \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "session_123", "otp": "123456"}'
```

3. **Get User's VCs:**
```bash
curl -X GET http://localhost:3000/api/wallet/user_123/vcs \
  -H "Authorization: Bearer user_token_123456"
```

4. **Register VC Watch:**
```bash
curl -X POST http://localhost:3000/api/wallet/user_123/vcs/watch \
  -H "Authorization: Bearer user_token_123456" \
  -H "Content-Type: application/json" \
  -d '{
    "vcPublicId": "vc-12345",
    "email": "user@example.com"
  }'
```

### User Onboarding

```bash
curl -X POST http://localhost:3000/api/wallet/onboard \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "+1234567890",
    "externalUserId": "user_123"
  }'
```

---

## Wallet Provider Support

### Currently Supported Providers

- **Dhiway**: Full OTP-based authentication support
  - User onboarding
  - OTP login and verification
  - OTP resend functionality
  - VC management
  - VC watch functionality

### Adding New Providers

To add a new wallet provider:

1. Create a new adapter class implementing `IWalletAdapter` or `IWalletAdapterWithOtp`
2. Add the provider to the wallet
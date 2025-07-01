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

Uploads a verifiable credential from QR code data.

**Path Parameters:**
- `user_id`: The user's account ID

**Request Body:**
```json
{
  "qrData": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Headers:**
```
Authorization: Bearer <user_token>
```

**Response:**
```json
{
  "status": "success",
  "vcId": "vc_uploaded_123"
}
```

**Validation:**
- `qrData`: Required string

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

### Adding New Providers

To add a new wallet provider:

1. Create a new adapter class implementing `IWalletAdapter` or `IWalletAdapterWithOtp`
2. Add the provider to the `adapter.factory.ts`
3. Update the environment configuration

---

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production use.

---

## Security Considerations

1. **Token Storage**: Store tokens securely and implement proper token expiration
2. **Input Validation**: All inputs are validated using class-validator decorators
3. **Error Handling**: Sensitive information is not exposed in error messages
4. **HTTPS**: Use HTTPS in production environments

---

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:cov
```

---

## Development

Start the development server:

```bash
npm run start:dev
```

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm run start:prod
``` 
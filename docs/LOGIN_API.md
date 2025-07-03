# Wallet Login API

This document describes the login functionality for the wallet middleware, which supports OTP-based authentication.

## Endpoints

### 1. Initiate Login

**POST** `/api/wallet/login`

Initiates the login process by sending an OTP to the user's email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "deviceInfo": "Web Application" // Optional
}
```

**Response:**
```json
{
  "sessionId": "session_123456",
  "message": "OTP sent successfully"
}
```

### 2. Verify Login

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

### 3. Resend OTP

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

## Usage Flow

1. **Initiate Login**: Call the login endpoint with the user's email
2. **User receives OTP**: The user receives an OTP via email
3. **Verify OTP**: User enters the OTP and calls the verify endpoint
4. **Get Token**: Upon successful verification, the user receives a token for subsequent API calls
5. **Resend if needed**: If OTP expires or not received, use the resend endpoint

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (invalid credentials)
- `500`: Internal Server Error

Error responses include a descriptive message:
```json
{
  "message": "Failed to initiate login: Invalid email format"
}
```

## Adapter Support

Currently, the login functionality is implemented for:
- **Dhiway Adapter**: Uses Dhiway's OTP-based authentication system

The implementation is adapter-specific, so different wallet providers can implement their own authentication mechanisms while maintaining the same API interface. 
<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# UBI Wallet Backend

A NestJS-based backend service for managing digital wallets with Dhiway integration and local user management.

## Features

- **User Management**: Complete user registration and authentication system
- **Dhiway Wallet Integration**: Seamless integration with Dhiway wallet services
- **Verifiable Credentials**: Support for VC management and QR code uploads
- **Bearer Token Authentication**: Secure API access with JWT tokens
- **Database Integration**: PostgreSQL database with TypeORM

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Dhiway API credentials

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ubi-wallet-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env_sample .env
```

4. Configure your `.env` file with the required values:
```env
PORT=3018
WALLET_PROVIDER=dhiway
DHIWAY_API_BASE=https://wallet-api.depwd.onest.dhiway.net
DHIWAY_API_KEY=your-dhiway-api-key
BENEFICIARY_BACKEND_URI=https://beneficiary-backend.example.com

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_DATABASE=wallet_db

# Environment
NODE_ENV=development
```

5. Set up the database:
```bash
# Create the database
createdb wallet_db

# The application will automatically create tables on first run
# (synchronize: true in development mode)
```

6. Start the application:
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Endpoints

### User Management

#### Onboard User
```http
POST /api/wallet/onboard
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "externalUserId": "user123",
  "username": "johndoe",
  "password": "password123",
  "email": "john@example.com",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "accountId": "user123",
  "token": "dhiway-token-here",
  "did": "did:example:123",
  "user": {
    "id": "uuid-123",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "accountId": "user123",
    "status": "active"
  }
}
```

#### Login
```http
POST /api/wallet/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "password123"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "token": "dhiway-token-here",
    "accountId": "user123",
    "user": {
      "id": "uuid-123",
      "firstName": "John",
      "lastName": "Doe",
      "username": "johndoe"
    }
  }
}
```

### Verifiable Credentials

#### Get All VCs
```http
GET /api/wallet/{accountId}/vcs
Authorization: Bearer {token}
```

#### Get VC by ID
```http
GET /api/wallet/{accountId}/vcs/{vcId}
Authorization: Bearer {token}
```

#### Upload VC from QR
```http
POST /api/wallet/{accountId}/vcs/upload-qr
Authorization: Bearer {token}
Content-Type: application/json

{
  "qrData": "qr-code-data-here"
}
```

## Database Schema

### Users Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| first_name | VARCHAR(100) | User's first name |
| last_name | VARCHAR(100) | User's last name |
| account_id | VARCHAR(255) | Unique account identifier |
| username | VARCHAR(100) | Unique username |
| password | VARCHAR(255) | Hashed password |
| token | VARCHAR(255) | Dhiway wallet token |
| did | VARCHAR(255) | Decentralized identifier |
| phone | VARCHAR(20) | Phone number |
| email | VARCHAR(255) | Email address |
| status | ENUM | User status (active/inactive/blocked) |
| blocked | BOOLEAN | Account blocked flag |
| created_by | VARCHAR(255) | Creator identifier |
| updated_by | VARCHAR(255) | Last updater identifier |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## Architecture

### Components

1. **User Module** (`src/users/`)
   - User entity and database operations
   - Password hashing and validation
   - User status management

2. **Wallet Module** (`src/wallet/`)
   - API endpoints and controllers
   - Business logic coordination
   - Authentication handling

3. **Adapter Layer** (`src/adapters/`)
   - Dhiway wallet integration
   - External API communication
   - Response transformation

### Flow

1. **Onboarding Process**:
   - User submits registration data
   - System creates user in Dhiway wallet service
   - System creates user record in local database
   - Returns combined response with user info and token

2. **Login Process**:
   - User submits username/password
   - System validates credentials against local database
   - System checks user status and blocked status
   - System retrieves/regenerates Dhiway token if needed
   - Returns authentication response with token

3. **VC Operations**:
   - All VC operations require bearer token authentication
   - Token is validated and used for Dhiway API calls
   - Responses are transformed to consistent format

## Development

### Running Tests
```bash
npm run test
npm run test:watch
npm run test:cov
```

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Application port | 3018 |
| WALLET_PROVIDER | Wallet provider | dhiway |
| DHIWAY_API_BASE | Dhiway API base URL | - |
| DHIWAY_API_KEY | Dhiway API key | - |
| BENEFICIARY_BACKEND_URI | Beneficiary backend URL | - |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5432 |
| DB_USERNAME | Database username | postgres |
| DB_PASSWORD | Database password | password |
| DB_DATABASE | Database name | wallet_db |
| NODE_ENV | Environment | development |

## Security

- Passwords are hashed using bcrypt
- Bearer token authentication for protected endpoints
- Input validation using class-validator
- SQL injection protection via TypeORM
- Environment-based configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the UNLICENSED license.

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

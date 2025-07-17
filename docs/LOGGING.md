# Logging Implementation

## Overview

The UBI Wallet Backend uses a custom logging service (`LoggerService`) that extends NestJS's built-in Logger for enhanced error logging and structured output.

## Features

- **Structured Logging**: All logs include timestamp, context, and structured data
- **Error Details**: Comprehensive error information including stack traces, error codes, and status codes
- **Context Awareness**: Each log entry includes the service/method context
- **Type Safety**: Properly typed error handling with TypeScript support

## Usage

### Basic Usage

```typescript
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class YourService {
  constructor(private readonly logger: LoggerService) {}

  async someMethod() {
    try {
      // Your business logic
      this.logger.logInfo('Operation completed successfully', { data: 'some data' });
    } catch (error) {
      this.logger.logError('Operation failed', error, 'someMethod');
    }
  }
}
```

### Available Methods

#### `logError(message: string, error: unknown, context?: string)`
Logs error information with full error details:
- Error message and stack trace
- Error name and code
- HTTP status and status code
- Timestamp and context

```typescript
this.logger.logError('Failed to process request', error, 'processRequest');
```

#### `logInfo(message: string, data?: unknown, context?: string)`
Logs informational messages with optional data:

```typescript
this.logger.logInfo('User logged in successfully', { userId: '123' }, 'login');
```

#### `logWarning(message: string, data?: unknown, context?: string)`
Logs warning messages with optional data:

```typescript
this.logger.logWarning('Rate limit approaching', { requests: 95 }, 'rateLimit');
```

## Configuration

The logger is configured as a global module and automatically available throughout the application. It uses NestJS's built-in logging infrastructure and can be configured via environment variables:

- `LOG_LEVEL`: Set the minimum log level (error, warn, info, debug, verbose)
- `NODE_ENV`: Environment affects log formatting (development vs production)

## Integration

The logger is integrated into the following components:

- **DhiwayAdapter**: All error logging from external API calls
- **WalletService**: Service-level error logging
- **UserService**: User-related operation logging

## Example Output

### Error Log
```json
{
  "level": "error",
  "message": "Failed to onboard user",
  "error": {
    "message": "Network timeout",
    "stack": "Error: Network timeout\n    at DhiwayAdapter.onboardUser...",
    "name": "Error",
    "code": "NETWORK_TIMEOUT",
    "status": 408,
    "statusCode": 408
  },
  "context": "DhiwayAdapter",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Info Log
```json
{
  "level": "info",
  "message": "User onboarded successfully",
  "data": {
    "accountId": "acc_123",
    "userId": "user_456"
  },
  "context": "DhiwayAdapter",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Best Practices

1. **Always include context**: Provide meaningful context for each log entry
2. **Use appropriate log levels**: 
   - `logError` for errors that need attention
   - `logWarning` for potential issues
   - `logInfo` for important business events
3. **Include relevant data**: Add structured data that helps with debugging
4. **Don't log sensitive information**: Avoid logging passwords, tokens, or personal data
5. **Use consistent error handling**: Always use `logError` for exception handling 
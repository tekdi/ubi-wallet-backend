# Wallet VC Tracking and Watcher Registration

## Overview

This document describes the implementation of wallet VC tracking and automatic watcher registration functionality in the UBI Wallet Backend service.

## Features

### 1. Wallet VC Tracking Table

A new table `wallet_vcs` has been created to track all VCs uploaded to the wallet service:

```sql
CREATE TABLE wallet_vcs (
    id SERIAL PRIMARY KEY,
    vc_public_id VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    watcher_registered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) DEFAULT '',
    updated_by VARCHAR(255) DEFAULT ''
);
```

#### Table Columns:
- `id`: Primary key, auto-increment
- `vc_public_id`: The public ID of the VC
- `provider`: Name of the wallet provider (e.g., 'dhiway')
- `watcher_registered`: Boolean flag indicating if watcher is registered
- `created_at`: Timestamp when record was created
- `updated_at`: Timestamp when record was last updated
- `created_by`: User who created the record
- `updated_by`: User who last updated the record

### 2. Automatic Record Creation

When a VC is successfully uploaded via QR code, a record is automatically created in the `wallet_vcs` table with:
- `watcher_registered` set to `false` initially
- Provider name extracted from the adapter class name
- VC public ID extracted from the QR data URL

### 3. Automatic Watcher Registration

After successful VC upload, the system automatically attempts to register a watcher for the VC:
- If successful, `watcher_registered` is updated to `true`
- If failed, the record remains with `watcher_registered = false`
- Upload operation continues regardless of watcher registration success/failure

### 4. Cron Job for Watcher Registration

A cron job runs every 5 minutes to check for VCs without watchers and attempts to register them:

#### Cron Job Details:
- **Schedule**: Every 5 minutes
- **Purpose**: Find VCs with `watcher_registered = false` and register watchers
- **Logging**: Comprehensive logging of success/failure counts
- **Error Handling**: Individual VC failures don't stop processing of other VCs

#### Manual Trigger:
- **Endpoint**: `POST /api/wallet/watcher/trigger-registration`
- **Purpose**: Manually trigger watcher registration for testing or immediate execution
- **Response**: Returns success/failure counts and total processed VCs

## Implementation Details

### 1. Database Schema

The `init.sql` file includes:
- `wallet_vcs` table creation
- Indexes for better performance
- Triggers for automatic `updated_at` timestamp updates

### 2. Entity and Service

#### WalletVC Entity (`src/wallet/wallet-vc.entity.ts`)
- TypeORM entity for the `wallet_vcs` table
- Proper column mappings and decorators

#### WalletVCService (`src/wallet/wallet-vc.service.ts`)
- `createWalletVC()`: Create new wallet VC record
- `updateWatcherStatus()`: Update watcher registration status
- `getVCsWithoutWatcher()`: Get VCs that need watcher registration
- `getVCByPublicId()`: Get specific VC by public ID
- `getAllVCs()`: Get all VCs (optionally filtered by provider)

### 3. Cron Service

#### WatcherCronService (`src/wallet/watcher-cron.service.ts`)
- `@Cron(CronExpression.EVERY_5_MINUTES)`: Scheduled job
- `registerWatchersForVCs()`: Main cron job method
- `triggerWatcherRegistration()`: Manual trigger method
- Comprehensive error handling and logging

### 4. Wallet Service Integration

#### Enhanced WalletService (`src/wallet/wallet.service.ts`)
- `uploadVCFromQR()`: Now creates wallet VC records and attempts watcher registration
- `registerWatcherForVC()`: Provider-agnostic watcher registration method
- `getProviderName()`: Extract provider name from adapter

### 5. Module Configuration

#### WalletModule (`src/wallet/wallet.module.ts`)
- Includes `TypeOrmModule.forFeature([WalletVC])`
- Includes `ScheduleModule.forRoot()` for cron jobs
- Exports all new services for dependency injection

## API Endpoints

### Manual Watcher Registration Trigger

```http
POST /api/wallet/watcher/trigger-registration
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Watcher registration triggered successfully",
  "data": {
    "successCount": 5,
    "failureCount": 2,
    "totalProcessed": 7
  }
}
```

## Environment Variables

Add these environment variables for the watcher functionality:

```env
# Default wallet token for cron job watcher registration
DEFAULT_WALLET_TOKEN=your_default_token_here

# Watcher email for Dhiway provider
DHIWAY_WATCHER_EMAIL=watcher@example.com

# Wallet service base URL for callback
WALLET_SERVICE_BASE_URL=http://localhost:3018
```

## Monitoring and Logging

### Log Messages

The system provides comprehensive logging:

1. **VC Upload**: Logs when wallet VC record is created
2. **Watcher Registration**: Logs success/failure of automatic watcher registration
3. **Cron Job**: Logs start, progress, and completion of scheduled jobs
4. **Manual Trigger**: Logs manual trigger execution and results

### Error Handling

- Database errors during record creation don't fail the VC upload
- Individual watcher registration failures don't stop processing of other VCs
- All errors are logged with context for debugging

## Benefits

1. **Complete Tracking**: All VCs uploaded to the wallet are tracked
2. **Automatic Watcher Management**: Ensures all VCs have watchers registered
3. **Provider Agnostic**: Works with any wallet provider adapter
4. **Fault Tolerant**: Failures in one area don't affect other operations
5. **Monitoring**: Comprehensive logging for operational visibility
6. **Manual Control**: Ability to manually trigger watcher registration

## Future Enhancements

1. **Notification System**: Send notifications when watcher registration fails
2. **Retry Logic**: Implement exponential backoff for failed watcher registrations
3. **Metrics**: Add metrics collection for monitoring watcher registration success rates
4. **Bulk Operations**: Support for bulk watcher registration operations
5. **Provider-Specific Logic**: Custom watcher registration logic per provider 
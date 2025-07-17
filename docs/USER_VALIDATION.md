# User Validation & Uniqueness Checks

## Overview

The UBI Wallet Backend now includes comprehensive validation for user onboarding to ensure data integrity and prevent duplicate registrations.

## Validation Features

### 1. Username Uniqueness Check

- **Purpose**: Ensures each username is unique across the system
- **Validation**: Performed before user creation in both application and database layers
- **Error Response**: Returns HTTP 409 (Conflict) with message "Username already exists"

### 2. Email Uniqueness Check

- **Purpose**: Ensures each email address is unique across the system
- **Validation**: Only performed when email is provided (email is optional)
- **Error Response**: Returns HTTP 409 (Conflict) with message "Email already registered"

### 3. Database-Level Constraints

- **Username**: Unique index on the `username` column
- **Email**: Unique index on the `email` column (nullable)
- **Account ID**: Unique index on the `account_id` column

## Implementation Details

### UserService Methods

```typescript
// Check if username already exists
async checkUsernameExists(username: string): Promise<boolean>

// Check if email already exists (returns false if email is null/empty)
async checkEmailExists(email: string): Promise<boolean>

// Find user by email (for active, non-blocked users)
async findByEmail(email: string): Promise<User | null>
```

### Validation Flow

1. **Application-Level Check**: Before creating user in external service
2. **Database-Level Check**: During user creation with constraint handling
3. **Error Handling**: Specific error messages for each constraint violation

### Error Handling

The system handles three types of uniqueness violations:

```typescript
// Username already exists
{
  statusCode: 409,
  message: 'Username already exists'
}

// Email already registered
{
  statusCode: 409,
  message: 'Email already registered'
}

// Account ID already exists
{
  statusCode: 409,
  message: 'Account ID already exists'
}
```

## API Response Examples

### Successful Onboarding
```json
{
  "statusCode": 200,
  "message": "User onboarded successfully",
  "data": {
    "accountId": "user123",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "did": "did:ew:123456789",
    "user": {
      "id": "uuid-123",
      "firstName": "John",
      "lastName": "Doe",
      "username": "johndoe",
      "accountId": "user123",
      "status": "active"
    }
  }
}
```

### Username Already Exists
```json
{
  "statusCode": 409,
  "message": "Username already exists"
}
```

### Email Already Registered
```json
{
  "statusCode": 409,
  "message": "Email already registered"
}
```

## Database Schema

### User Entity Constraints

```typescript
@Entity('users')
export class User {
  @Index({ unique: true })
  @Column({ name: 'account_id', length: 255 })
  accountId: string;

  @Index({ unique: true })
  @Column({ length: 100 })
  username: string;

  @Index({ unique: true })
  @Column({ length: 255, nullable: true })
  email: string;
}
```

## Testing

The validation logic is thoroughly tested with the following scenarios:

- Username exists vs. doesn't exist
- Email exists vs. doesn't exist
- Empty/null email handling
- Database constraint violation handling

### Running Tests

```bash
# Run all user service tests
npm test -- --testPathPattern=user.service.spec.ts

# Run specific test
npm test -- --testNamePattern="should return true when username exists"
```

## Best Practices

1. **Always validate before creation**: Check uniqueness at application level first
2. **Handle database constraints**: Provide specific error messages for constraint violations
3. **Log validation failures**: Use structured logging for debugging
4. **Test edge cases**: Include tests for null/empty values
5. **Consistent error responses**: Use standard HTTP status codes and message formats

## Migration Notes

If you're upgrading from a previous version:

1. **Database Migration**: Ensure unique indexes are created on `username` and `email` columns
2. **Existing Data**: Check for duplicate usernames/emails before applying constraints
3. **API Changes**: Update client code to handle new 409 status codes
4. **Testing**: Add tests for the new validation scenarios 
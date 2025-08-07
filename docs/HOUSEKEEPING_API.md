# Housekeeping API

Secure API endpoints for housekeeping operations with secret key authentication.

## Setup

Add the secret key to your environment variables:

```bash
# .env file
HOUSEKEEPING_SECRET_KEY=your-super-secret-key-here
```

## Authentication

All housekeeping endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer your-super-secret-key-here
```

## API Endpoints

### 1. Get Statistics

**GET** `/housekeeping/stats`

Get comprehensive statistics about wallet VCs and their watcher status.

**Headers:**
```
Authorization: Bearer your-super-secret-key-here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalWalletVCs": 150,
    "totalWatchers": 120,
    "registeredWatchers": 100,
    "unregisteredWatchers": 20,
    "vcsWithoutWatchers": 30
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Add Watchers

**POST** `/housekeeping/add-watchers?chunkSize=100`

Add watchers for wallet VCs that don't have watchers registered.

**Headers:**
```
Authorization: Bearer your-super-secret-key-here
```

**Query Parameters:**
- `chunkSize` (optional): Number of records to process in each chunk (default: 100)

**Response:**
```json
{
  "success": true,
  "message": "Housekeeping task completed. Total VCs: 150, Existing watchers: 120, New watchers created: 30, Errors: 0, Chunks processed: 2",
  "stats": {
    "totalWalletVCs": 150,
    "existingWatchers": 120,
    "newWatchersCreated": 30,
    "errors": 0,
    "chunksProcessed": 2
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. Sync VCs and Add Watchers

**POST** `/housekeeping/sync-vcs-and-add-watchers?provider=dhiway&chunkSize=100`

Sync VCs from provider for all users and add watchers for them. This endpoint:
1. Gets all users from the system
2. For each user, fetches their VCs from the specified provider
3. Syncs missing VCs to our database
4. Adds watchers for those VCs

**Headers:**
```
Authorization: Bearer your-super-secret-key-here
```

**Query Parameters:**
- `provider` (optional): Provider name (default: dhiway)
- `chunkSize` (optional): Number of users to process in each chunk (default: 100)

**Response:**
```json
{
  "success": true,
  "message": "Housekeeping task completed. Total users: 50, Total VCs from provider: 150, New VCs added: 30, Existing VCs found: 120, New watchers created: 30, Existing watchers found: 120, Errors: 0, Users processed: 50",
  "stats": {
    "totalUsers": 50,
    "totalVCsFromProvider": 150,
    "newVCsAdded": 30,
    "existingVCsFound": 120,
    "newWatchersCreated": 30,
    "existingWatchersFound": 120,
    "errors": 0,
    "usersProcessed": 50
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Error Responses

### Unauthorized (401)
```json
{
  "statusCode": 401,
  "message": "Invalid or missing secret key",
  "error": "Unauthorized"
}
```

### Server Error (500)
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## Usage Examples

### Using curl

```bash
# Get statistics
curl -X GET "http://localhost:3012/housekeeping/stats" \
  -H "Authorization: Bearer your-super-secret-key-here"

# Add watchers
curl -X POST "http://localhost:3012/housekeeping/add-watchers?chunkSize=200" \
  -H "Authorization: Bearer your-super-secret-key-here"

# Sync VCs and add watchers
curl -X POST "http://localhost:3012/housekeeping/sync-vcs-and-add-watchers?provider=dhiway&chunkSize=100" \
  -H "Authorization: Bearer your-super-secret-key-here"
```

### Using JavaScript/Node.js

```javascript
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3012';
const SECRET_KEY = 'your-super-secret-key-here';

const headers = {
  'Authorization': `Bearer ${SECRET_KEY}`
};

// Get statistics
async function getStats() {
  const response = await axios.get(`${API_BASE_URL}/housekeeping/stats`, { headers });
  console.log(response.data);
}

// Add watchers
async function addWatchers(chunkSize = 100) {
  const response = await axios.post(
    `${API_BASE_URL}/housekeeping/add-watchers?chunkSize=${chunkSize}`, 
    {}, 
    { headers }
  );
  console.log(response.data);
}

// Sync VCs and add watchers
async function syncVCsAndAddWatchers(provider = 'dhiway', chunkSize = 100) {
  const response = await axios.post(
    `${API_BASE_URL}/housekeeping/sync-vcs-and-add-watchers?provider=${provider}&chunkSize=${chunkSize}`, 
    {}, 
    { headers }
  );
  console.log(response.data);
}
```


## Security Considerations

1. **Secret Key**: Use a strong, randomly generated secret key
2. **Environment Variables**: Store the secret key in environment variables, not in code
3. **HTTPS**: Use HTTPS in production to encrypt the secret key in transit
4. **Access Control**: Limit access to these endpoints to trusted systems only
5. **Logging**: All access attempts are logged for security monitoring

## Monitoring

The API includes comprehensive logging:

- All requests are logged with timestamps
- Failed authentication attempts are logged as errors
- Successful operations are logged with details
- Error responses include detailed error information

## Cron Job Integration

You can use these endpoints in cron jobs or scheduled tasks:

```bash
# Daily statistics check
0 2 * * * curl -X GET "http://localhost:3012/housekeeping/stats" \
  -H "Authorization: Bearer your-super-secret-key-here" \
  >> /var/log/housekeeping.log 2>&1

# Weekly sync and cleanup
0 3 * * 0 curl -X POST "http://localhost:3012/housekeeping/sync-vcs-and-add-watchers?provider=dhiway&chunkSize=100" \
  -H "Authorization: Bearer your-super-secret-key-here" \
  >> /var/log/housekeeping.log 2>&1
``` 
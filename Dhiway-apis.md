# Wallet
cloud wallet (API only)

## Version: 1.4.1

### Terms of service
http://studio.dhiway.com/page/terms-and-conditions

**Contact information:**  
Dhiway Networks  
https://dhiway.com  
info@dhiway.com  

**License:** [Private]()

### /api/v1/users/did-check

#### POST
##### Summary:

Check if a DID exists

##### Description:

This endpoint checks if a given Decentralized Identifier (DID) already exists in the system. It requires a valid Bearer token for authentication.

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Successful response indicating whether the DID exists |
| 400 |  |
| 401 |  |
| 500 |  |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/users

#### POST
##### Summary:

Create a new user

##### Description:

This endpoint creates a new user in the system. It requires a valid Bearer token for authentication and accepts user details such as name, email, and DID name.

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Successful response indicating the user was created |
| 400 |  |
| 401 |  |
| 500 |  |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/users/{id}

#### GET
##### Summary:

Retrieve a user by ID

##### Description:

Fetches the user data for the specified ID, filtered by active status. Requires a valid Bearer token for authentication. The 'active' query parameter can be used to filter results, defaulting to true if not provided.

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path | The unique identifier of the user | Yes | string |
| active | query | Filter by active status. If not provided, defaults to true, returning only active users. | No | boolean |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Successful response with the user data |
| 400 | Bad Request - User not found or invalid ID |
| 401 |  |
| 403 |  |
| 500 |  |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/custom-user/create

#### POST
##### Summary:

Create a new custom user

##### Description:

Creates a new custom user with the provided accountId, generates a decentralized identifier (DID), and issues a unique token.

##### Responses

| Code | Description |
| ---- | ----------- |
| 201 | User created successfully |
| 400 | Invalid accountId or user already exists |
| 500 | Failed to create user or generate token |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/custom-user/regenerate-token

#### POST
##### Summary:

Regenerate token for an existing user

##### Description:

Regenerates a new token for an existing user identified by the provided accountId, replacing any existing session token.

##### Responses

| Code | Description |
| ---- | ----------- |
| 201 | Token regenerated successfully |
| 400 | Invalid accountId or user does not exist |
| 500 | Failed to regenerate token |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/otp-email-verify

#### POST
##### Summary:

Verify email OTP

##### Description:

This endpoint verifies the One-Time Password (OTP) sent to the user's email for authentication purposes. It requires a valid Bearer token and the user ID along with the OTP.

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Successful response indicating OTP verification succeeded |
| 400 |  |
| 401 |  |
| 404 |  |
| 500 |  |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/otp/login

#### POST
##### Summary:

Request OTP for login

##### Description:

This endpoint requests a One-Time Password (OTP) to be sent to the user's email for login purposes. It requires a valid Bearer token and the user's email and device information.

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Successful response indicating OTP request was sent |
| 400 |  |
| 401 |  |
| 404 |  |
| 500 |  |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/otp/login-verify

#### POST
##### Summary:

Verify OTP for login

##### Description:

This endpoint verifies the One-Time Password (OTP) provided by the user for login. It requires a valid Bearer token, session ID, and the OTP.

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Successful response indicating login OTP verification succeeded |
| 400 |  |
| 401 |  |
| 404 |  |
| 500 |  |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/otp/resendOtp

#### POST
##### Summary:

Resend OTP to user's email

##### Description:

Resends a new OTP to the email associated with the provided session ID. This endpoint is used when the user needs a new OTP, for example, if the previous one expired or was not received. It requires a valid Bearer token for authentication.

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | OTP successfully resent to the user's email |
| 400 | Bad Request - Session not found or invalid input |
| 500 | Internal Server Error |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/auth/logout

#### GET
##### Summary:

Logout the user

##### Description:

Logs out the current user by invalidating the session. Note: This endpoint is currently not implemented and returns a placeholder response. It requires a valid Bearer token for authentication.

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Successful response (placeholder) indicating the function is not implemented |
| 401 |  |
| 500 |  |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/auth/submit

#### POST
##### Summary:

Submit verifiable presentation

##### Description:

Submits a verifiable presentation for authentication or verification purposes. It requires a valid Bearer token and a message containing presentation details.

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Successful submission of the verifiable presentation |
| 400 |  |
| 403 |  |
| 404 |  |
| 500 |  |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/auth/login

#### GET
##### Summary:

Check if user is logged in

##### Description:

Verifies if the user is logged in based on the session token. It requires a valid Bearer token for authentication and returns a success flag.

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | User is logged in |
| 403 |  |
| 500 |  |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/cred

#### GET
##### Summary:

Retrieve user credentials

##### Description:

Fetches the credentials associated with the authenticated user's DID. Requires a valid Bearer token or a custom Bearer token in the Authorization header.

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Successful response with the user's credentials |
| 403 | Forbidden - Invalid or missing Bearer token |
| 500 | Internal Server Error |

##### Security

| Security Schema | Scopes |
| --- | --- |
| customBearerAuth | |

### /api/v1/discover/digilocker-request

#### GET
##### Summary:

Initiate DigiLocker request

##### Description:

Initiates a request to DigiLocker for authentication or data retrieval. It requires a valid Bearer token for authentication.

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Successful response indicating DigiLocker request initiation |
| 401 |  |
| 500 |  |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/discover/digilocker-auth

#### POST
##### Summary:

Authenticate with DigiLocker

##### Description:

Authenticates the user with DigiLocker. It requires a valid Bearer token for authentication.

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Successful response indicating DigiLocker authentication succeeded |
| 401 |  |
| 500 |  |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/request/fetch-discover/{orgId}

#### GET
##### Summary:

Fetch discovery data by org ID

##### Description:

Fetches discovery data for a specific organization identified by its unique ID. It requires a valid Bearer token for authentication.

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| orgId | path | The unique organization ID prefixed with 'o' | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Successful response with discovery data for the specified organization |
| 400 |  |
| 401 |  |
| 404 |  |
| 500 |  |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/request/fetch-discover

#### GET
##### Summary:

Fetch all discovery data

##### Description:

Fetches all discovery data for organizations. It requires a valid Bearer token for authentication and returns a list of discoverable organizations.

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Successful response with all discoverable organization data |
| 401 |  |
| 500 |  |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/request/set-discover/{orgId}

#### POST
##### Summary:

Store a new discoverable entry for an organization

##### Description:

Stores a new discoverable entry for an organization identified by its unique ID. It requires a valid Bearer token and a message containing the discovery intent details.

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| orgId | path | The unique organization ID | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 201 | Successfully created a new discoverable entry |
| 400 |  |
| 401 |  |
| 404 |  |
| 500 |  |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/request/update-discover/{orgId}

#### PUT
##### Summary:

Update an existing discoverable registry entry

##### Description:

Updates an existing discoverable registry entry for an organization identified by its unique ID. It requires a valid Bearer token and a message containing the update intent.

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| orgId | path | The unique organization ID | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Successfully updated the discoverable registry entry |
| 400 |  |
| 401 |  |
| 404 |  |
| 500 |  |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/request/update-discover-org/{orgId}

#### PUT
##### Summary:

Update the organization's discoverable details

##### Description:

Updates the organization's discoverable details for an organization identified by its unique ID. It requires a valid Bearer token and a message containing the organization update intent.

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| orgId | path | The unique organization ID | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Successfully updated the organization's discoverable details |
| 400 |  |
| 401 |  |
| 404 |  |
| 500 |  |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/message/create/{did}

#### POST
##### Summary:

Receive a message for a specific DID

##### Description:

This endpoint allows sending a message to a specific Decentralized Identifier (DID). The message can be of type 'document' or 'identity', which also triggers the creation of a credential entry internally. It requires a valid Bearer token for authentication.

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| did | path | The DID of the recipient (Get the DID from the VC generated from your credential) | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Message received successfully |
| 400 | Bad Request - Invalid input data |
| 401 |  |
| 500 |  |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/message/{did}

#### GET
##### Summary:

Retrieve all messages for a specific DID

##### Description:

Fetches all messages for the specified DID. Optionally filters by unread status using the 'unread' query parameter. If unread messages are retrieved, they are marked as read. It requires a valid Bearer token for authentication.

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| did | path | The DID of the user | Yes | string |
| unread | query | Filter messages by unread status. '0' returns read messages, any other value (or absence) returns unread messages. | No | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Successful response with the list of messages |
| 401 |  |
| 500 |  |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/message/{did}/{id}

#### GET
##### Summary:

Retrieve a specific message by ID for a DID

##### Description:

Fetches a specific message by its ID for the given DID. If the message is unread, it is marked as read upon retrieval. It requires a valid Bearer token for authentication.

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| did | path | The DID of the user | Yes | string |
| id | path | The ID of the message | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Successful response with the message data |
| 401 |  |
| 404 | Message not found |
| 500 |  |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/fields/fieldsFetch

#### GET
##### Summary:

Fetch static list of fields

##### Description:

Returns a predefined list of fields with their corresponding values. It requires a valid Bearer token for authentication and is used to retrieve supported field keys and value types.

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Successful response with the list of fields |
| 401 | Unauthorized - Missing or invalid Bearer token |
| 500 | Internal Server Error |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

### /api/v1/fields/details/{did}

#### POST
##### Summary:

Fetch detailed field information for a DID

##### Description:

Retrieves detailed information for the specified fields associated with a given DID. The fields to fetch are provided in the request body. It requires a valid Bearer token for authentication.

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| did | path | The Decentralized Identifier (DID) of the user | Yes | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200 | Successful response with detailed field information |
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Missing or invalid Bearer token |
| 500 | Internal Server Error |

##### Security

| Security Schema | Scopes |
| --- | --- |
| bearerAuth | |

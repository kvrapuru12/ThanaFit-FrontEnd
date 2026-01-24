# Backend API Requirements - Social Login (Google & Apple)

## Required Endpoints

### 1. Google Sign-In Endpoint

**POST `/api/auth/google`**

**Authentication:** Not required (public endpoint for authentication)

**Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...",
  "platform": "ios"
}
```

**Request Fields:**
- `idToken` (String, required) - Google ID Token from frontend
- `platform` (String, required) - "ios" or "android"

**Backend Processing:**
1. Verify Google ID Token signature
2. Verify token expiration
3. Verify audience (matches your Google Client ID)
4. Extract user information:
   - Email (required)
   - Name (givenName, familyName)
   - Google User ID (sub claim)
   - Profile picture URL
5. Check if user exists:
   - By email OR by `google_id`
6. If user exists:
   - Update last login
   - Return existing user with JWT token
7. If user doesn't exist:
   - Create new user account
   - Set `auth_provider = 'google'`
   - Store `google_id`
   - Return new user with JWT token

**Success Response (200 OK - Existing User):**
```json
{
  "token": "your-jwt-token",
  "userId": 123,
  "username": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "role": "USER",
  "message": "Login successful"
}
```

**Success Response (201 Created - New User):**
```json
{
  "token": "your-jwt-token",
  "userId": 124,
  "username": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "newuser@example.com",
  "role": "USER",
  "message": "Account created and login successful"
}
```

**Error Responses:**
- **400 Bad Request:** Invalid ID token format
- **401 Unauthorized:** Invalid or expired Google token
- **422 Unprocessable Entity:** Token verification failed
- **500 Internal Server Error:** Server error

---

### 2. Apple Sign-In Endpoint

**POST `/api/auth/apple`**

**Authentication:** Not required (public endpoint for authentication)

**Request Body:**
```json
{
  "identityToken": "eyJraWQiOiJlWGF1Q...",
  "authorizationCode": "c1234567890...",
  "user": "001234.abcd...",
  "email": "user@privaterelay.appleid.com",
  "fullName": {
    "givenName": "John",
    "familyName": "Doe"
  },
  "platform": "ios"
}
```

**Request Fields:**
- `identityToken` (String, required) - Apple Identity Token (JWT)
- `authorizationCode` (String, optional) - Authorization code (if needed)
- `user` (String, optional) - Apple user identifier (only on first login)
- `email` (String, optional) - User email (may be private relay, may be missing)
- `fullName` (Object, optional) - User name (only on first login)
  - `givenName` (String, optional)
  - `familyName` (String, optional)
- `platform` (String, required) - "ios" or "android"

**Backend Processing:**
1. Verify Apple Identity Token (JWT):
   - Get Apple's public keys from `https://appleid.apple.com/auth/keys`
   - Verify JWT signature
   - Verify issuer is `https://appleid.apple.com`
   - Verify audience matches your App ID or Services ID
   - Verify token expiration
2. Extract user information:
   - Apple User ID (sub claim) - unique per app
   - Email (if provided in token)
   - Name (only in request body on first login)
3. Handle privacy features:
   - Email may be private relay (`@privaterelay.appleid.com`)
   - Email may be missing
   - Name only provided on first login
4. Check if user exists:
   - By `apple_id` (primary)
   - By email (secondary, if email provided)
5. If user exists:
   - Update last login
   - Update email if provided and different
   - Return existing user with JWT token
6. If user doesn't exist:
   - Create new user account
   - Set `auth_provider = 'apple'`
   - Store `apple_id`
   - Store email if provided
   - Store name if provided
   - Return new user with JWT token

**Success Response (200 OK - Existing User):**
```json
{
  "token": "your-jwt-token",
  "userId": 123,
  "username": "001234.abcd...",
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@privaterelay.appleid.com",
  "role": "USER",
  "message": "Login successful"
}
```

**Success Response (201 Created - New User):**
```json
{
  "token": "your-jwt-token",
  "userId": 124,
  "username": "001234.xyz...",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "user@privaterelay.appleid.com",
  "role": "USER",
  "message": "Account created and login successful"
}
```

**Error Responses:**
- **400 Bad Request:** Invalid identity token format
- **401 Unauthorized:** Invalid or expired Apple token
- **422 Unprocessable Entity:** Token verification failed
- **500 Internal Server Error:** Server error

---

## Database Schema Updates

### Required Column Additions

```sql
-- Add social login columns to users table
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) UNIQUE,
ADD COLUMN apple_id VARCHAR(255) UNIQUE,
ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'email', -- 'email', 'google', 'apple'
ADD COLUMN profile_picture_url VARCHAR(500);

-- Create indexes for faster lookups
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_apple_id ON users(apple_id);
CREATE INDEX idx_users_auth_provider ON users(auth_provider);
```

### Field Descriptions

- `google_id`: Google user ID (sub claim from Google ID token)
- `apple_id`: Apple user ID (sub claim from Apple identity token)
- `auth_provider`: Authentication method used ('email', 'google', 'apple')
- `profile_picture_url`: URL to user's profile picture (from Google/Apple)

**Note:** Both `google_id` and `apple_id` should be UNIQUE to prevent duplicate accounts.

---

## Token Verification Libraries

### For Java/Spring Boot Backend

**Google Sign-In:**
```xml
<dependency>
    <groupId>com.google.auth</groupId>
    <artifactId>google-auth-library-oauth2-http</artifactId>
    <version>1.19.0</version>
</dependency>
```

```java
import com.google.auth.oauth2.TokenVerifier;

TokenVerifier verifier = TokenVerifier.newBuilder()
    .setAudience("YOUR_CLIENT_ID.apps.googleusercontent.com")
    .build();

TokenVerifier.VerificationResult result = verifier.verify(idToken);
String email = result.getPayload().getEmail();
String googleId = result.getPayload().getSubject();
String name = (String) result.getPayload().get("name");
```

**Apple Sign-In:**
```xml
<!-- Use a JWT library for Apple token verification -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.11.5</version>
</dependency>
```

**Note:** Apple token verification requires:
1. Fetching Apple's public keys from `https://appleid.apple.com/auth/keys`
2. Verifying JWT signature using the appropriate key
3. Verifying claims (iss, aud, exp)

### Alternative: Use Backend SDKs

- **Google:** Google Auth Library (Java, Node.js, Python, etc.)
- **Apple:** Use JWT libraries (io.jsonwebtoken for Java, jsonwebtoken for Node.js)

---

## Account Linking Strategy

### Recommended Approach

1. **Primary Key: Provider ID**
   - Check by `google_id` or `apple_id` first
   - This is the most reliable method

2. **Secondary Key: Email**
   - If provider ID not found, check by email
   - **Important Decision:** What if email matches but provider ID doesn't?
     - **Option A:** Create separate accounts (different providers = different accounts)
     - **Option B:** Link accounts (same email = same account, allow multiple providers)

3. **Recommended: Option A (Separate Accounts)**
   - Simpler implementation
   - Prevents security issues
   - Users can have separate accounts per provider
   - If they want to link, they can do it manually later

---

## Security Requirements

1. **Always Verify Tokens on Backend**
   - Never trust tokens from frontend
   - Verify signature, expiration, and audience
   - Use official SDKs or well-tested libraries

2. **Rate Limiting**
   - Implement rate limiting on social login endpoints
   - Suggested: 5 requests per minute per IP
   - Prevent abuse and brute force attacks

3. **Token Expiration Handling**
   - Google ID tokens expire in 1 hour
   - Apple identity tokens expire quickly
   - Handle expired tokens with clear error messages

4. **Privacy Compliance**
   - Respect Apple's privacy features
   - Handle private relay emails correctly
   - Don't require fields that may not be available

---

## Implementation Checklist

### Backend Tasks

- [ ] Create `POST /api/auth/google` endpoint
- [ ] Create `POST /api/auth/apple` endpoint
- [ ] Implement Google ID token verification
- [ ] Implement Apple identity token verification
- [ ] Update database schema (add columns)
- [ ] Implement user lookup logic (by provider ID and email)
- [ ] Implement user creation logic for social login
- [ ] Handle account linking/conflicts
- [ ] Add rate limiting
- [ ] Add error handling
- [ ] Write unit tests
- [ ] Update API documentation

### Frontend Tasks (After Backend is Ready)

- [ ] Install required Expo packages
- [ ] Create social auth service
- [ ] Update auth repository interface
- [ ] Implement Google Sign-In flow
- [ ] Implement Apple Sign-In flow
- [ ] Add UI buttons to login screen
- [ ] Handle errors and edge cases
- [ ] Test on iOS device
- [ ] Test on Android device

---

## Example Request/Response Flow

### Google Sign-In Flow

```
1. User taps "Sign in with Google"
2. Expo opens Google OAuth flow
3. User authenticates with Google
4. Google returns ID Token to app
5. Frontend sends to backend:
   POST /api/auth/google
   {
     "idToken": "eyJhbGc...",
     "platform": "ios"
   }
6. Backend verifies token with Google
7. Backend checks if user exists (by google_id or email)
8. Backend returns:
   {
     "token": "your-jwt-token",
     "userId": 123,
     "email": "user@example.com",
     ...
   }
9. Frontend stores token and logs user in
```

### Apple Sign-In Flow

```
1. User taps "Sign in with Apple"
2. Expo opens Apple authentication
3. User authenticates with Face ID/Touch ID
4. Apple returns identity token to app
5. Frontend sends to backend:
   POST /api/auth/apple
   {
     "identityToken": "eyJraWQ...",
     "user": "001234.abcd...",
     "email": "user@privaterelay.appleid.com",
     "fullName": { "givenName": "John", "familyName": "Doe" }
   }
6. Backend verifies token with Apple
7. Backend checks if user exists (by apple_id or email)
8. Backend returns:
   {
     "token": "your-jwt-token",
     "userId": 123,
     "email": "user@privaterelay.appleid.com",
     ...
   }
9. Frontend stores token and logs user in
```

---

## Questions to Answer

Before implementation, decide on:

1. **Account Linking:** Can users link multiple auth methods?
2. **Email Conflicts:** What if same email from different providers?
3. **Required Fields:** What fields are required? How to handle missing data?
4. **Profile Pictures:** Store and display Google profile pictures?

Once these are decided, implementation can proceed!



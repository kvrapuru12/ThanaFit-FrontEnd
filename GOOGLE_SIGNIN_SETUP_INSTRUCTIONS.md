# Google Sign-In Setup Instructions

## Step 1: Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select Project**
   - Click on project dropdown at the top
   - Click "New Project" or select existing project
   - Name: "ThanaFit" (or your preferred name)
   - Note your Project ID

3. **Configure OAuth Consent Screen** (Required - Do This First!)
   
   **Important:** You must configure the OAuth consent screen BEFORE creating OAuth credentials. There is no "Google Sign-In API" to enable - Google Sign-In uses standard OAuth 2.0.
   - Go to "APIs & Services" → "OAuth consent screen"
   - User Type: Choose "External" (for testing/development) or "Internal" (for Google Workspace only)
   - Click "Create"
   - Fill in required information:
     - App name: "ThanaFit" (or your preferred name)
     - User support email: Your email address
     - Developer contact information: Your email address
   - Click "Save and Continue"
   - Scopes: Click "Add or Remove Scopes"
     - The default scopes are usually fine, but make sure these are included:
       - `.../auth/userinfo.email`
       - `.../auth/userinfo.profile`
       - `openid`
   - Click "Update" → "Save and Continue"
   - Test users (if using "External"): Add your Google account email as a test user for testing
   - Click "Save and Continue" → "Back to Dashboard"

   **Note:** You must complete the OAuth consent screen configuration before you can create OAuth credentials.

4. **Create OAuth 2.0 Credentials**

   Now you can create OAuth credentials:
   
   **For iOS:**
   - Go to "APIs & Services" → "Credentials"
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"
   - If you see a message about configuring the consent screen, make sure you completed Step 3 above
   - Application type: **iOS**
   - Name: "ThanaFit iOS" (or your preferred name)
   - Bundle ID: `com.anonymous.thanafit-auth` (from your app.json)
   - Click "Create"
   - **COPY THE CLIENT ID** (looks like: `123456789-abc.apps.googleusercontent.com`)

   **For Android:**
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID" again
   - Application type: **Android**
   - Name: "ThanaFit Android"
   - Package name: `com.anonymous.thanafit-auth` (or your Android package name)
   - SHA-1 certificate fingerprint: Get it using:
     ```bash
     # For debug keystore (development)
     keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA1
     
     # For release keystore (production)
     keytool -list -v -keystore path/to/your-release-key.keystore -alias your-key-alias
     ```
   - Click "Create"
   - **COPY THE CLIENT ID**


## Step 2: Configure Environment Variables

1. **Create or update `.env` file** in your project root:

```bash
# Google Sign-In Client IDs
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com

# Existing variables
EXPO_PUBLIC_API_BASE_URL=http://your-api-url/api
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-key
```

2. **Replace the placeholder values** with your actual Client IDs from Google Cloud Console

3. **Restart Expo server** after adding environment variables:
   ```bash
   # Stop current server (Ctrl+C)
   npm start
   ```

## Step 3: Update app.json (Optional)

If you want to configure the redirect URI scheme explicitly:

```json
{
  "expo": {
    "scheme": "com.anonymous.thanafit-auth",
    "ios": {
      "bundleIdentifier": "com.anonymous.thanafit-auth"
    },
    "android": {
      "package": "com.anonymous.thanafit-auth"
    }
  }
}
```

## Step 4: Backend Endpoint Required

Your backend needs to implement:

**POST `/api/auth/google`**

Request:
```json
{
  "idToken": "google-id-token-here",
  "platform": "ios" // or "android"
}
```

Response (success):
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

See `BACKEND_SOCIAL_LOGIN_REQUIREMENTS.md` for complete backend API specification.

## Step 5: Test Google Sign-In

1. **Make sure backend endpoint is ready**
2. **Start Expo:**
   ```bash
   npm start
   ```
3. **Open app on device/simulator**
4. **Tap "Continue with Google" button**
5. **Select Google account**
6. **Verify login works**

## Troubleshooting

### Error: "Google Client ID not configured"
- Make sure `.env` file has `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` and/or `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- Restart Expo server after adding environment variables
- Make sure variable names start with `EXPO_PUBLIC_`

### Error: "Invalid client ID"
- Verify Client ID is correct (no extra spaces)
- Make sure Bundle ID/Package name matches Google Cloud Console configuration

### Error: "Redirect URI mismatch"
- Check that redirect URI in Google Cloud Console matches your app scheme
- Default redirect URI format: `com.anonymous.thanafit-auth://` (for development with Expo)

### Backend Error: "Invalid ID token"
- Verify backend is verifying the Google token correctly
- Check that backend Client ID matches the one used in frontend
- Make sure token is sent correctly to backend

## Next Steps

Once Google Sign-In is working:
1. Test on both iOS and Android
2. Handle error cases gracefully
3. Implement Apple Sign-In (optional)
4. Add profile picture support from Google


# Google OAuth Complete Checklist

## ✅ FRONTEND VERIFICATION (Already Configured)

### 1. Package Name
- ✅ **app.json:** `com.prod.thanafit`
- ⚠️ **AndroidManifest.xml:** Uses scheme `com.anonymous.thanafit-auth`
- ✅ **Redirect URI:** `com.anonymous.thanafit-auth:/oauthredirect`

### 2. OAuth Client IDs
- ✅ **Android Client ID:** `383964637006-pp6ooio84sr55aro70j1srpjt5909ibh.apps.googleusercontent.com`
- ✅ **iOS Client ID:** `383964637006-dqtvfhqpickel6ilhrrtc2uv1oljnd3d.apps.googleusercontent.com`
- ✅ **Configured in eas.json** for preview and production builds

### 3. App Scheme
- ✅ **app.json scheme:** `com.anonymous.thanafit-auth`
- ✅ **Used for OAuth redirects**

---

## ⚠️ GOOGLE CLOUD CONSOLE - REQUIRED CHECKS

### Step 1: Verify Android OAuth Client Configuration
**URL:** https://console.cloud.google.com/apis/credentials

1. **Find Android OAuth Client ID:** `383964637006-pp6ooio84sr55aro70j1srpjt5909ibh`
2. **Verify:**
   - ✅ **Package name:** `com.prod.thanafit` (must match exactly)
   - ✅ **SHA-1 certificate fingerprint:** Must match EAS production keystore SHA-1
   - ✅ **Authorized redirect URIs:** Should include:
     - `com.anonymous.thanafit-auth:/oauthredirect`
     - OR may auto-generate based on package name

**To get EAS Production SHA-1:**
1. Go to: https://expo.dev/accounts/kvrapuru12/projects/thanafit-auth/credentials
2. Check **Android → Production Keystore**
3. Copy the **SHA-1 fingerprint**
4. Compare with Google Cloud Console

### Step 2: Verify OAuth Consent Screen
**URL:** https://console.cloud.google.com/apis/credentials/consent

**Required Settings:**
- ✅ **Publishing status:** 
  - **Option A:** "In production" (works for all users)
  - **Option B:** "Testing" (must add test users)
- ✅ **User Type:** External (recommended for public apps)
- ✅ **Test users (if Testing mode):** 
  - Your Google email must be in the list
  - Format: `your-email@gmail.com`

**If "Testing" mode:**
1. Click "Add Users"
2. Add your Google account email
3. Save

### Step 3: Verify Scopes
**URL:** https://console.cloud.google.com/apis/credentials/consent

**Required Scopes:**
- ✅ `openid`
- ✅ `profile`
- ✅ `email`

---

## ⚠️ BACKEND VERIFICATION

### Step 1: Verify Backend Endpoint
**Endpoint:** `POST /api/auth/google`

**Test with Postman or cURL:**
```bash
curl -X POST http://healthapp-alb-1571435665.us-east-1.elb.amazonaws.com/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "TEST_ID_TOKEN",
    "platform": "android"
  }'
```

**Expected Success Response:**
```json
{
  "token": "jwt-token",
  "userId": 123,
  "username": "user@example.com",
  "profileComplete": false,
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "role": "USER",
  "gender": null
}
```

### Step 2: Verify Backend Logic
- ✅ **Token Verification:** Verifies Google ID token correctly
- ✅ **User Creation:** Creates new user if doesn't exist
- ✅ **Default Values:** Sets `activityLevel = MODERATE` (cannot be null)
- ✅ **Profile Complete:** Calculates `profileComplete` based on gender/dob
- ✅ **Response:** Returns all required fields including `profileComplete`

See `BACKEND_OAUTH_VERIFICATION.md` for detailed backend checklist.

---

## 🔍 TROUBLESHOOTING "ACCESS BLOCKED" ERROR

### Most Common Causes:

1. **OAuth Consent Screen Not Published / No Test Users**
   - **Fix:** Go to OAuth Consent Screen → Either publish to production OR add your email as test user

2. **SHA-1 Fingerprint Mismatch**
   - **Fix:** 
     - Get production SHA-1 from EAS: https://expo.dev/accounts/kvrapuru12/projects/thanafit-auth/credentials
     - Update Google Cloud Console → Android OAuth Client → SHA-1 fingerprint

3. **Package Name Mismatch**
   - **Current:** `com.prod.thanafit` (in app.json)
   - **Verify:** Google Cloud Console → Android OAuth Client → Package name matches exactly

4. **Redirect URI Not Configured**
   - **Expected:** `com.anonymous.thanafit-auth:/oauthredirect`
   - **Verify:** Google Cloud Console → Android OAuth Client → Authorized redirect URIs

5. **Backend Token Verification Failing**
   - **Fix:** Verify backend endpoint correctly verifies Google ID tokens
   - See `BACKEND_OAUTH_VERIFICATION.md` for details

---

## 📋 QUICK ACTION ITEMS

### For You to Check Now:

1. **✅ Check OAuth Consent Screen:**
   - Go to: https://console.cloud.google.com/apis/credentials/consent
   - If "Testing": Add your Google email as a test user
   - If "In production": Should work for all users

2. **✅ Verify SHA-1 Fingerprint:**
   - Go to: https://expo.dev/accounts/kvrapuru12/projects/thanafit-auth/credentials
   - Get production SHA-1 from Android → Production Keystore
   - Update Google Cloud Console → Android OAuth Client → SHA-1

3. **✅ Verify Package Name:**
   - Google Cloud Console: `com.prod.thanafit`
   - app.json: `com.prod.thanafit` ✅

4. **✅ Check Backend Endpoint:**
   - Test with a valid Google ID token
   - Verify it returns `profileComplete` field
   - Verify it handles null `gender` and sets default `activityLevel`

---

## 🧪 TESTING STEPS

1. **Get Production SHA-1:**
   ```bash
   # Check EAS credentials
   eas credentials
   # Or visit: https://expo.dev/accounts/kvrapuru12/projects/thanafit-auth/credentials
   ```

2. **Update Google Cloud Console:**
   - Android OAuth Client → SHA-1 fingerprint (match EAS production)
   - OAuth Consent Screen → Add test user (if Testing mode)

3. **Test APK:**
   - Install the latest APK
   - Try Google Sign-In
   - Check logs for specific error message

4. **Check Backend Logs:**
   - Verify backend receives the request
   - Verify token verification succeeds
   - Verify user creation/update succeeds

---

## 📞 SUMMARY

**Frontend is correctly configured.** The issue is likely:
1. **OAuth Consent Screen** (most common) - needs to be published or have test users
2. **SHA-1 fingerprint mismatch** - production SHA-1 must match Google Cloud Console
3. **Backend configuration** - verify endpoint works correctly

**Priority Actions:**
1. ✅ Check OAuth Consent Screen status and test users
2. ✅ Verify SHA-1 fingerprint matches EAS production keystore
3. ✅ Test backend endpoint with a valid Google ID token



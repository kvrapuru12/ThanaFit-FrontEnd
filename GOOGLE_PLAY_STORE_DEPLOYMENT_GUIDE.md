# Google Play Store Deployment Guide - ThanaFit

Complete step-by-step guide to deploy your ThanaFit app to the Google Play Store.

---

## Prerequisites

Before starting, ensure you have:
- ✅ Google Play Developer Account ($25 one-time fee)
- ✅ Backend API running in production
- ✅ App fully tested on Android device/emulator
- ✅ All features working correctly
- ✅ No console errors or warnings

---

## Step 1: Prepare Production Configuration

### 1.1 Verify Environment Variables

Ensure your `.env` file has production settings:

```bash
# Production API URL (should already be set)
EXPO_PUBLIC_API_BASE_URL=http://healthapp-alb-1571435665.us-east-1.elb.amazonaws.com/api

# Google Sign-In Client IDs (already configured)
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=383964637006-pp6ooio84sr55aro70j1srpjt5909ibh.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=383964637006-dqtvfhqpickel6ilhrrtc2uv1oljnd3d.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<your-web-client-id-if-needed>

# OpenAI API Key (if used)
EXPO_PUBLIC_OPENAI_API_KEY=<your-key>
```

### 1.2 Update app.json with Production Details

Verify/update your `app.json`:

```json
{
  "expo": {
    "name": "ThanaFit",
    "slug": "thanafit",
    "version": "1.0.0",
    "android": {
      "package": "com.thanafit.app",  // Change to your desired package name
      "versionCode": 1,
      "permissions": [
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ],
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#2563eb"
      },
      "icon": "./assets/icon.png"
    }
  }
}
```

**Important Notes:**
- Package name must be unique (e.g., `com.yourcompany.thanafit`)
- Once published, package name cannot be changed
- Version code must increment with each release

---

## Step 2: Install EAS CLI (Expo Application Services)

EAS is the recommended way to build and deploy Expo apps.

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
eas login

# If you don't have an Expo account, create one at expo.dev
```

---

## Step 3: Configure EAS Build

### 3.1 Initialize EAS Configuration

```bash
# Run this in your project directory
eas build:configure
```

This creates an `eas.json` file. Edit it for production builds:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease"
      },
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "http://healthapp-alb-1571435665.us-east-1.elb.amazonaws.com/api",
        "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID": "383964637006-pp6ooio84sr55aro70j1srpjt5909ibh.apps.googleusercontent.com"
      }
    },
    "development": {
      "android": {
        "buildType": "apk",
        "developmentClient": true
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"  // or "alpha", "beta", "production"
      }
    }
  }
}
```

### 3.2 Prepare App Icons and Splash Screen

Ensure you have:
- **Icon**: 1024x1024px PNG (no transparency) - `assets/icon.png`
- **Adaptive Icon**: 1024x1024px PNG (foreground only, transparent background) - `assets/adaptive-icon.png`
- **Splash Screen**: 2048x2048px PNG (optional but recommended)

You can use Expo's asset generation:
```bash
npx expo install expo-splash-screen
# Then update app.json with splash screen config
```

---

## Step 4: Create Google Play Developer Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Sign in with your Google account
3. Pay the **$25 one-time registration fee**
4. Complete your developer profile:
   - Developer name
   - Email address
   - Phone number
   - Address

**Processing time**: Usually instant, but can take up to 48 hours.

---

## Step 5: Create App in Google Play Console

1. **Create App**:
   - Click "Create app"
   - Enter app name: "ThanaFit"
   - Choose default language: English (United States)
   - Select app type: App
   - Choose "Free" or "Paid"
   - Accept declarations

2. **Complete App Access** (if your app has restricted content)

---

## Step 6: Build Production Android App Bundle (AAB)

### 6.1 Build Using EAS (Recommended)

```bash
# Build production Android App Bundle
eas build --platform android --profile production

# This will:
# - Upload your code to Expo's servers
# - Build the app bundle
# - Provide download link (takes 15-30 minutes)
```

### 6.2 Alternative: Local Build

If you prefer local builds:

```bash
# Generate Android native project
npx expo prebuild --platform android

# Build app bundle locally
cd android
./gradlew bundleRelease

# App bundle will be at:
# android/app/build/outputs/bundle/release/app-release.aab
```

---

## Step 7: Prepare App Store Listing

In Google Play Console, complete these sections:

### 7.1 Store Listing

- **App name**: ThanaFit
- **Short description**: (80 characters max)
  ```
  Your comprehensive health and fitness companion
  ```
- **Full description**: (4000 characters max)
  ```
  ThanaFit is your all-in-one health and fitness tracking app. 
  Monitor your workouts, track nutrition, manage your menstrual 
  cycle, and achieve your wellness goals with personalized insights.
  
  Features:
  • Track daily activities (exercise, water, sleep, steps)
  • Log meals and nutrition
  • Menstrual cycle tracking and predictions
  • Personalized recommendations
  • Goal setting and progress tracking
  • Secure profile management
  
  Start your health journey today with ThanaFit!
  ```

- **App icon**: 512x512px PNG (upload your icon)
- **Feature graphic**: 1024x500px PNG (promotional banner)
- **Screenshots** (required):
  - Phone: At least 2 screenshots (max 8)
  - Tablet (optional): At least 2 screenshots
  - Recommended sizes: 1080x1920px (portrait)

- **Categorization**:
  - Category: Health & Fitness
  - Tags: fitness, health, wellness, nutrition, workout

- **Contact details**:
  - Email: support@thanafit.com (or your support email)
  - Phone: (your support number)
  - Website: (your website if available)

### 7.2 Content Rating

- Complete the content rating questionnaire
- Answer questions about app content
- Get rating (usually "Everyone" for health apps)

### 7.3 Target Audience

- Select target age groups
- Indicate if app is for children

### 7.4 Privacy Policy

**IMPORTANT**: You must have a privacy policy URL.

Options:
1. Host on your website: `https://yourwebsite.com/privacy-policy`
2. Use a free hosting service (GitHub Pages, Google Sites)
3. Create a simple HTML page with your privacy policy

Your privacy policy should include:
- What data you collect
- How you use the data
- Data storage and security
- Third-party services (Google Sign-In, etc.)
- User rights
- Contact information

Example template available in your app at `SettingsScreen.tsx` (Privacy Policy section).

### 7.5 Data Safety

Complete the Data Safety section:
- What data you collect
- How data is used
- Data sharing practices
- Security practices

---

## Step 8: Upload App Bundle

### 8.1 Create Release

1. Go to **Production** → **Releases** → **Create new release**
2. Upload your `.aab` file (from Step 6)
3. Add release notes:
   ```
   Initial release of ThanaFit
   - Complete health and fitness tracking
   - Nutrition and meal logging
   - Menstrual cycle tracking
   - Google Sign-In integration
   - Personalized recommendations
   ```
4. Click **Save**

### 8.2 Review Release

- Review all sections show green checkmarks
- Ensure all required sections are complete:
  ✅ Store listing
  ✅ Content rating
  ✅ Target audience
  ✅ Privacy policy
  ✅ App bundle uploaded

---

## Step 9: Test Your Release

Before publishing to production, test with internal testing:

1. Go to **Testing** → **Internal testing**
2. Create internal test track
3. Upload the same AAB file
4. Add testers (your email)
5. Share testing link with testers
6. Test the app thoroughly

---

## Step 10: Submit for Review

1. Go back to **Production** → **Releases**
2. Review your release
3. Click **Review release**
4. Accept declarations:
   - Content rating
   - Export compliance (if applicable)
   - App signing
5. Click **Start rollout to Production**

---

## Step 11: Wait for Review

- **Review time**: Usually 1-3 days, can take up to 7 days
- Google will check:
  - App functionality
  - Content compliance
  - Security
  - Privacy policy accuracy

You'll receive email notifications about review status.

---

## Step 12: App Goes Live

Once approved:
- App becomes available on Google Play Store
- Users can download and install
- You'll receive a confirmation email

---

## Important Post-Launch Checklist

### Backend Requirements
- ✅ Ensure production backend is stable and scalable
- ✅ Set up monitoring and error tracking
- ✅ Configure proper CORS headers
- ✅ Enable HTTPS (recommended for production)

### App Updates
- Update version in `app.json`:
  ```json
  "version": "1.0.1",  // Increment for updates
  "android": {
    "versionCode": 2  // Always increment this
  }
  ```

### Future Releases
For updates:
1. Make code changes
2. Increment version numbers
3. Build new AAB: `eas build --platform android --profile production`
4. Upload to Google Play Console
5. Add release notes
6. Submit for review

---

## Troubleshooting

### Build Errors
- Check `eas.json` configuration
- Verify environment variables are set correctly
- Review build logs in Expo dashboard

### Rejection Issues
- Ensure privacy policy is accessible
- Complete all required sections
- Fix any policy violations
- Update content rating if needed

### API Connection Issues
- Verify production API URL is correct
- Check backend is accessible from internet
- Ensure CORS is properly configured
- Test API endpoints manually

---

## Additional Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)
- [Privacy Policy Generator](https://www.freeprivacypolicy.com/)

---

## Quick Command Reference

```bash
# Login to EAS
eas login

# Configure EAS
eas build:configure

# Build production Android app
eas build --platform android --profile production

# Check build status
eas build:list

# Submit to Play Store (if configured)
eas submit --platform android --profile production
```

---

Good luck with your launch! 🚀



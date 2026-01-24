# 🚀 ThanaFit - Production Launch Guide

Complete step-by-step guide to launch your ThanaFit app on Google Play Store.

---

## ✅ **Pre-Launch Checklist**

Before starting, ensure:
- ✅ App tested locally on Android device/emulator
- ✅ All features working correctly (Login, Google Sign-In, Profile, etc.)
- ✅ Google Play Developer Account created ($25 one-time fee)
- ✅ Backend API running in production
- ✅ Google OAuth configured with production SHA-1

---

## **Step 1: Build Production Android App Bundle (AAB)**

Google Play Store requires an **AAB (Android App Bundle)** file, not APK.

### 1.1 Build the AAB

Run this command in your project directory:

```bash
eas build --platform android --profile production
```

**What happens:**
- Your code is uploaded to Expo's servers
- Production AAB is built (takes 15-30 minutes)
- You'll get a download link when complete

**Expected output:**
```
✔ Build finished
🤖 Android app bundle:
https://expo.dev/artifacts/eas/[unique-id].aab
```

**⚠️ Important:** Save this download link! You'll need it for Step 3.

---

## **Step 2: Prepare Google Play Console App Listing**

While the build is running, prepare your app listing:

### 2.1 Access Google Play Console

1. Go to: https://play.google.com/console
2. Sign in with your Google account
3. You should see your app "ThanaFit" (if you already created it)

### 2.2 Complete Store Listing

Navigate to: **Setup > Store listing**

**Required fields:**

1. **App name**: `ThanaFit` (max 50 characters)
2. **Short description**: 80-character summary
   - Example: "Your personal fitness companion with workout tracking and nutrition management"
3. **Full description**: Detailed app description (max 4000 characters)
   - Include features, benefits, use cases
   - Be clear and compelling
4. **App icon**: Upload 512x512px PNG (high-res icon)
   - You can use your `assets/icon.png`
5. **Feature graphic**: 1024x500px PNG (banner image for store)
6. **Phone screenshots**: 
   - Minimum 2, maximum 8
   - Size: 16:9 or 9:16 aspect ratio
   - Recommended: 1080x1920 or 1920x1080
7. **Tablet screenshots** (optional but recommended)
8. **Category**: Select appropriate category
   - Suggested: "Health & Fitness"
9. **Content rating**: Complete questionnaire (see Step 5)
10. **Contact details**:
    - Email address
    - Phone number
    - Website (if applicable)

### 2.3 Prepare Screenshots

You'll need:
- **App icon**: 512x512px PNG
- **Feature graphic**: 1024x500px PNG (banner)
- **Phone screenshots**: At least 2-4 screenshots showing:
  - Login screen
  - Main dashboard
  - Workout/fitness features
  - Profile screen

**Quick tip:** Take screenshots from your Android emulator or device:
- Press `Power + Volume Down` on device
- Or use Android Studio's screenshot tool for emulator

---

## **Step 3: Upload AAB to Google Play Console**

### 3.1 Download Your AAB

1. Once the EAS build completes, download the `.aab` file from the link provided
2. Save it to an easy-to-find location

### 3.2 Create New Release

1. In Google Play Console, go to: **Production** (left sidebar) > **Releases**
2. Click **Create new release**
3. You'll be prompted to select an existing release or create a new track

### 3.3 Upload AAB File

1. Click **Upload** under "App bundles and APKs"
2. Select your downloaded `.aab` file
3. Wait for upload to complete (usually 1-2 minutes)
4. Google will validate the file - fix any issues if prompted

### 3.4 Add Release Notes

1. Scroll down to **Release notes**
2. Enter what's new in this version
   - Example: "Initial release of ThanaFit - your personal fitness companion"
3. Add notes in all languages you support (at minimum, English)

### 3.5 Review and Rollout

1. Click **Review release**
2. Review all details:
   - Version number: `1.0.0`
   - Version code: `1`
   - Release notes
   - Countries/regions (default: all countries)
3. Click **Start rollout to Production** (or **Save as draft** if not ready)

**⚠️ Note:** You cannot publish until you complete all required sections (see Step 4).

---

## **Step 4: Complete Required App Content**

### 4.1 Content Rating

1. Go to: **Policy** > **App content**
2. Click **Start** or **Continue** on Content rating
3. Answer the questionnaire about your app:
   - Does your app allow users to share personal information? (Likely: Yes)
   - Does your app contain user-generated content? (Likely: No)
   - Does your app contain ads? (Your answer)
   - Does your app allow users to make purchases? (Your answer)
   - Select categories that apply to your app (e.g., Health & Fitness)
4. Submit for rating (usually instant)

### 4.2 Privacy Policy (⚠️ REQUIRED)

Since your app collects user data (Google Sign-In, profile info), you **MUST** provide a privacy policy.

**Options:**

1. **Host your own privacy policy** (recommended):
   - Create a privacy policy page on your website
   - URL format: `https://yourwebsite.com/privacy-policy`
   - Add this URL in: **Policy** > **App content** > **Privacy Policy**

2. **Use a privacy policy generator**:
   - [PrivacyPolicyGenerator.net](https://www.privacypolicygenerator.net/)
   - [Termly](https://termly.io/)
   - Generate and host it somewhere (GitHub Pages, etc.)

**Privacy Policy must cover:**
- What data you collect (user profile, email, etc.)
- How you use the data
- Data sharing (if applicable)
- User rights (access, deletion, etc.)
- Contact information

### 4.3 Target Audience & Content

1. Go to: **Policy** > **App content**
2. Complete:
   - **Target audience**: Select appropriate age range
   - **Content ratings**: Already done in 4.1
   - **Export compliance**: Answer questions about encryption

### 4.4 Data Safety Section

1. Go to: **Policy** > **Data safety**
2. Complete the data safety form:
   - What data types you collect (personal info, authentication info, etc.)
   - Why you collect it (app functionality, analytics, etc.)
   - Whether data is shared with third parties
   - Data security practices

**For ThanaFit, you likely collect:**
- Personal info (name, email, profile data)
- Authentication info (Google Sign-In)
- Health & fitness data (workout logs, nutrition)

---

## **Step 5: Configure App Signing (Already Done)**

If you used EAS Build, app signing is already handled automatically. You don't need to do anything here.

**To verify:**
1. Go to: **Setup** > **App signing**
2. You should see: "App signing by Google Play" (managed automatically)

---

## **Step 6: Final Checks Before Publishing**

### 6.1 Review App Information

Go through all sections and ensure they're complete:

- ✅ **Store listing** - All required fields filled
- ✅ **Content rating** - Questionnaire completed
- ✅ **Privacy policy** - URL provided
- ✅ **Data safety** - Form completed
- ✅ **App access** - Configured if needed
- ✅ **Production release** - AAB uploaded

### 6.2 Test on Internal/Closed Testing Track (Optional but Recommended)

Before going to production, test with a small group:

1. Go to: **Testing** > **Internal testing** (or **Closed testing**)
2. Create a new release with your AAB
3. Add testers (email addresses)
4. Share the test link with them
5. Test all features thoroughly

**This helps catch issues before public launch.**

---

## **Step 7: Publish to Production**

### 7.1 Submit for Review

1. Go to: **Production** > **Releases**
2. Find your release (should be in "Draft" status if you saved it)
3. Click **Review release**
4. Review everything one more time
5. Click **Start rollout to Production**

### 7.2 Review Process

**What happens:**
- Google reviews your app (typically 1-7 days)
- They check for policy compliance, content, functionality
- You'll receive email notifications about status

**Common review reasons:**
- Privacy policy missing or incomplete
- Content rating issues
- Data safety form incomplete
- App crashes or doesn't work

### 7.3 After Approval

Once approved:
- Your app will be available on Google Play Store
- Users can find it by searching "ThanaFit"
- It will show up within a few hours to 24 hours

**First launch checklist:**
- ✅ Monitor crash reports in Play Console
- ✅ Check user reviews
- ✅ Monitor analytics
- ✅ Be ready to fix any issues quickly

---

## **Step 8: Post-Launch Monitoring**

### 8.1 Monitor Key Metrics

- **Crash reports**: Play Console > **Quality** > **Crashes & ANRs**
- **User reviews**: Play Console > **Ratings and reviews**
- **Analytics**: Play Console > **Statistics**

### 8.2 Update Strategy

For future updates:
1. Update version in `app.json`:
   ```json
   {
     "version": "1.0.1",  // Increment version
     "android": {
       "versionCode": 2  // Increment version code
     }
   }
   ```
2. Build new AAB: `eas build --platform android --profile production`
3. Upload to Play Console
4. Add release notes
5. Rollout to production

---

## **Quick Command Reference**

```bash
# Build production AAB
eas build --platform android --profile production

# Build preview APK (for testing)
eas build --platform android --profile preview

# Check build status
eas build:list --platform android --limit 5

# View build details
eas build:view [build-id]
```

---

## **Important URLs**

- **Google Play Console**: https://play.google.com/console
- **EAS Build Dashboard**: https://expo.dev/accounts/kvrapuru12/projects/thanafit-auth/builds
- **App Credentials**: https://expo.dev/accounts/kvrapuru12/projects/thanafit-auth/credentials

---

## **Need Help?**

- **EAS Build Issues**: Check build logs in Expo dashboard
- **Play Console Issues**: See Play Console Help Center
- **Privacy Policy**: Use generators listed in Step 4.2
- **Screenshots**: Use your emulator/device screenshot tools

---

**Good luck with your launch! 🎉**

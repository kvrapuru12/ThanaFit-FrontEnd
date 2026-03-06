You are a senior engineer helping build an iOS app (IPA) for TestFlight / App Store via **Expo EAS**.

## Goal
Build an IPA for production (TestFlight or App Store submission).

## Versioning
- **Version (semantic)**: Set in `app.json` (bump manually or via version scripts if desired)
- **Build number**: Auto-incremented by EAS on each build (`eas.json` → `production.ios.autoIncrement: "buildNumber"`)

## Build Commands

### Option 1: Using NPM Script (Recommended)

**Production IPA:**
```bash
npm run build:ios
```
- Builds IPA with EAS production profile
- Output: IPA for TestFlight / App Store

### Option 2: Direct EAS Command

**Production IPA:**
```bash
npx eas build --platform ios --profile production
```

**Submit to App Store Connect (TestFlight / App Store):**
```bash
npm run submit:ios
```
or:
```bash
npx eas submit --platform ios --latest --profile production
```
- Uploads the **latest** EAS iOS build to App Store Connect. Use `--latest` to pick the most recent build, or omit it to be prompted to choose a build.

## Workflow

1. **Build IPA**: Run `npm run build:ios` (or you already have a build from EAS).
2. **Wait**: Build takes ~15–25 minutes (EAS cloud build).
3. **Download / Install**: Get IPA from [expo.dev](https://expo.dev) → project → Builds (optional).
4. **Upload to App Store**: Run `npm run submit:ios` to send the latest build to App Store Connect. Then in App Store Connect: add version info, screenshots, submit for TestFlight or App Review.

## What Happens Automatically

1. **Credentials**: EAS uses managed iOS credentials (certificate + provisioning profile) if already set up
2. **Build number**: EAS auto-increments build number for the app
3. **Build IPA**: EAS builds the IPA in the cloud

## Prerequisites (first time only)

- Apple Developer account ($99/year)
- Run `npx eas credentials` for iOS and sign in with Apple (let EAS manage credentials)
- App created in App Store Connect with bundle ID `com.prod.thanafit`
- **Voice transcription (TestFlight):** Set the OpenAI API key as an EAS Secret so production/TestFlight builds have it:
  - [expo.dev](https://expo.dev) → your project → **Secrets** (or run `eas secret:create`)
  - Add secret name: `EXPO_PUBLIC_OPENAI_API_KEY`, value: your OpenAI API key
  - Rebuild the iOS app after adding; the key is inlined at build time. Without this, voice transcription will fail in TestFlight with "OpenAI API key not configured."

## Upload to App Store (EAS Submit)

1. Ensure you have at least one **successful** iOS production build (from `npm run build:ios`).
2. Run:
   ```bash
   npm run submit:ios
   ```
3. If prompted, sign in with your **App Store Connect** Apple ID (or use an App Store Connect API key in `eas.json` for non-interactive submit).
4. EAS will upload the latest build to App Store Connect. After upload:
   - In [App Store Connect](https://appstoreconnect.apple.com) → your app → **TestFlight** or **App Store** tab.
   - Add version info, screenshots, description, privacy, etc., then submit for TestFlight or for App Review.
5. (Optional) Set `app.json` → `extra.appStoreAppId` to your app’s numeric Apple ID so in-app “Rate app” links work.

## Notes

- **Bundle ID**: `com.prod.thanafit` (from `app.json`)
- **Profile**: Uses `production` in `eas.json` (env vars, autoIncrement)
- **Sign In with Apple**: Ensure "Sign In with Apple" is enabled for the app ID in Apple Developer portal when using Apple auth

## Troubleshooting

**Credentials / signing errors:**
- Run `npx eas credentials` and complete iOS setup with your Apple ID
- Ensure app exists in App Store Connect with matching bundle ID

**Build fails:**
- Check [expo.dev](https://expo.dev) build logs for the exact error
- Verify `eas.json` has `production.ios` and required env vars

**Voice transcription fails in TestFlight:**
- Ensure `EXPO_PUBLIC_OPENAI_API_KEY` is set as an **EAS Secret** (project → Secrets on expo.dev). It is not in `eas.json` for security. After adding the secret, create a new production build and submit again.
- The app now uses the same native file upload path on iOS as on Android, so uploads should be reliable in release builds.

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

**Submit to App Store Connect (TestFlight):**
```bash
npx eas submit --platform ios --profile production
```
- Uploads the latest (or selected) iOS build to App Store Connect

## Workflow

1. **Build IPA**: Run `npm run build:ios`
2. **Wait**: Build takes ~15–25 minutes (EAS cloud build)
3. **Download / Install**: Get IPA from [expo.dev](https://expo.dev) → project → Builds
4. **Submit (optional)**: Run submit command to upload to TestFlight / App Store

## What Happens Automatically

1. **Credentials**: EAS uses managed iOS credentials (certificate + provisioning profile) if already set up
2. **Build number**: EAS auto-increments build number for the app
3. **Build IPA**: EAS builds the IPA in the cloud

## Prerequisites (first time only)

- Apple Developer account ($99/year)
- Run `npx eas credentials` for iOS and sign in with Apple (let EAS manage credentials)
- App created in App Store Connect with bundle ID `com.prod.thanafit`

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

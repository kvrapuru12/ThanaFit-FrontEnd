# iOS App Store Pre-Submission Checklist

Use this before building and submitting ThanaFit to the App Store.

## App icon (required for archive)

The iOS app icon set expects a **1024×1024 px PNG** for the App Store.

- **Path:** `ios/ThanaFit/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png`
- **Spec:** Exactly 1024×1024 pixels, PNG, no transparency for App Store (opaque).
- If this file is missing, Xcode archive or EAS iOS build may fail. Add the file before running `eas build --platform ios --profile production`.

You can export this from your design tool or generate it from your logo asset; ensure the filename matches exactly.

## App Store Connect

- Set **App Store App ID** in `app.json` → `extra.appStoreAppId` (e.g. `"1234567890"`) once you create the app in App Store Connect. The Settings screen “Rate app” link uses this for the iOS store URL.
- Leave `extra.playStorePackageId` as-is for Android (defaults to `com.prod.thanafit`).

## Backend

- **Sign in with Apple** requires the backend to implement `POST /api/auth/apple` (see `BACKEND_SOCIAL_LOGIN_REQUIREMENTS.md`). Without it, Apple Sign-In in the app will fail at the API step.

## Build and submit

- iOS production build: `npx eas build --platform ios --profile production`
- Submit latest build: `npx eas submit --platform ios --latest --profile production`

See the main App Store launch plan for full steps.

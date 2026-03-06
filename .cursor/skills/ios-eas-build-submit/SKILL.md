---
name: ios-eas-build-submit
description: Builds and submits iOS production apps with Expo EAS using a non-interactive flow. Use when user asks to create a new Apple build, fix App Store SDK version issues (ITMS-90725), verify Xcode/iOS SDK in logs, or submit latest iOS build to App Store Connect.
---

# iOS EAS Build + Submit

## Use this skill when
- User asks to build a new iOS production binary.
- User asks to submit iOS build to App Store Connect.
- User gets App Store warning `ITMS-90725` (SDK version issue).

## Preconditions
- Project is Expo/EAS based and has `eas.json`.
- `submit.production.ios.ascAppId` is configured in `eas.json` for non-interactive submit.
- iOS bundle identifier and Apple credentials are already valid in EAS.

## Standard workflow (non-interactive)

Copy this checklist and track progress:

```md
- [ ] 1) Ensure iOS build image is current
- [ ] 2) Bump iOS build number
- [ ] 3) Run production iOS build
- [ ] 4) Verify Xcode/iOS SDK from logs
- [ ] 5) Submit latest iOS build
- [ ] 6) Confirm Apple processing started
```

### 1) Ensure iOS build image is current
In `eas.json`, set the iOS production profile(s) to:

```json
"ios": {
  "autoIncrement": "buildNumber",
  "image": "latest"
}
```

Recommended profiles to keep aligned:
- `build.production.ios`
- `build.production-minor.ios`
- `build.production-major.ios`

### 2) Bump iOS build number
- Keep app version as desired.
- Ensure iOS build number increments for each App Store upload.
- If using EAS auto-increment, build may bump automatically; still verify final value.

### 3) Run production iOS build

```bash
npx eas build --platform ios --profile production --non-interactive
```

Save the build ID from output.

### 4) Verify Xcode/iOS SDK from logs
Use one of:

```bash
npx eas build:view <BUILD_ID>
npx eas build:view <BUILD_ID> --json
```

Open the build logs / Xcode logs and confirm evidence like:
- `XCODE_VERSION_MAJOR=2600` (or newer)
- `iPhoneOS26.x.sdk` (or newer)

If logs show older SDK, do fallback flow below.

### 5) Submit latest iOS build

```bash
npx eas submit --platform ios --latest --profile production --non-interactive
```

If error says ascAppId is missing, set:

```json
"submit": {
  "production": {
    "ios": { "ascAppId": "<APP_STORE_APP_ID>" }
  }
}
```

### 6) Confirm Apple processing started
Success criteria:
- EAS submit command exits successfully.
- Output includes “submitted/uploaded to App Store Connect”.
- Build appears in TestFlight processing queue.

## Fallback flow (if SDK is still old)
1. Upgrade Expo SDK to latest compatible release.
2. Re-sync native iOS project if needed.
3. Re-run production iOS build.
4. Re-check Xcode/iOS SDK evidence in logs.
5. Submit again.

## Quick command set

```bash
npx eas build --platform ios --profile production --non-interactive
npx eas build:view <BUILD_ID> --json
npx eas submit --platform ios --latest --profile production --non-interactive
```

Use the `ios-eas-build-submit` skill.

Goal:
- Build a new iOS production binary with EAS.
- Verify the build uses Xcode 26+ and iOS 26 SDK+ in logs.
- Submit the latest iOS build to App Store Connect.

Execution mode:
- Use non-interactive commands by default.
- Continue end-to-end until submission is successful or a blocking error is identified.

Key requirements:
- Ensure `build.production.ios.image` is `latest` in `eas.json`.
- Ensure `submit.production.ios.ascAppId` is set in `eas.json`.
- Keep iOS `buildNumber` incremented for each upload.
- Mandatory pre-build credentials preflight (before any production iOS build):
  - Run `npx eas credentials -p ios`.
  - Verify bundle ID `com.prod.thanafit` has required capabilities enabled in Apple Developer (especially HealthKit).
  - Regenerate/sync the App Store provisioning profile in EAS if capabilities/entitlements changed.
- If build fails with provisioning capability mismatch (e.g. HealthKit entitlement missing), re-run the credentials preflight, then retry the build.

Output:
- Build ID and build URL
- Proof lines that show Xcode/SDK version
- Submission URL and final status

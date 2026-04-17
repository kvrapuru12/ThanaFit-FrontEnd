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
- If entitlements/capabilities changed (e.g. HealthKit), run `npx eas credentials -p ios` to regenerate/sync the App Store provisioning profile before rebuilding.
- If build fails with provisioning capability mismatch (e.g. HealthKit entitlement missing), treat as a required credentials-sync step and retry the build.

Output:
- Build ID and build URL
- Proof lines that show Xcode/SDK version
- Submission URL and final status

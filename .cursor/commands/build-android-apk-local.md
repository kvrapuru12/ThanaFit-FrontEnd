You are a senior engineer helping build an Android APK **locally** with Gradle (no EAS, no cloud).

Goal:
Produce a release APK on this machine using the `android/` native project and report where the output is.

Steps:
1. Ensure dependencies are installed: `npm install`
2. Prebuild only if needed: `npx expo prebuild --platform android --clean` (e.g. if android/ is out of sync or missing)
3. Build release APK:
   - From project root: `cd android && ./gradlew assembleRelease`
   - Or: `npm run build:android:apk:local`
4. APK path: `android/app/build/outputs/apk/release/app-release.apk`
5. Report the path and that the APK is unsigned (suitable for local/testing). For Play Store use the EAS command or a signed build.

Rules:
- Use `assembleRelease` (not `assembleDebug`) for a release APK.
- If the APK path exists after the build, confirm it and state size/date if useful.

Output format:
- Commands run
- APK path
- Note: unsigned (local/testing only)

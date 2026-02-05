You are a senior engineer helping build Android APK for this Expo/React Native app.

Goal:
Produce an Android APK using either (1) local Gradle build or (2) Expo EAS build, and tell the user where the output is.

---

## Option A: Local Gradle build (no EAS, no cloud)

Use when the user wants a quick local APK from the `android/` folder.

Steps:
1. Ensure dependencies are installed: `npm install`
2. Prebuild if needed (Expo): `npx expo prebuild --platform android --clean` (only if android/ is out of sync or missing)
3. Build release APK locally:
   - From project root: `cd android && ./gradlew assembleRelease`
   - Or use script: `npm run build:android:apk:local`
4. Locate the APK: `android/app/build/outputs/apk/release/app-release.apk`
5. Report the path and that the APK is unsigned (suitable for local/testing). For Play Store use EAS or a signed build.

Commands (copy-paste):
```bash
npm install
cd android && ./gradlew assembleRelease
```
APK output: `android/app/build/outputs/apk/release/app-release.apk`

---

## Option B: Expo EAS build (APK via EAS)

Use when the user wants an EAS-managed build (cloud or local EAS).

Steps:
1. Ensure EAS CLI is available: `npx eas-cli --version` (or install: `npm install -g eas-cli`)
2. Log in if needed: `npx eas login`
3. Build Android APK with the **preview** profile (configured in eas.json for APK; production profile builds AAB):
   - Cloud: `npx eas build --platform android --profile preview`
   - Local (build on this machine with EAS): `npx eas build --platform android --profile preview --local`
4. After the build, EAS will output the download URL (cloud) or the path to the APK (local). Summarize for the user.

Commands (copy-paste):

**Cloud build:**
```bash
npm install
npx eas build --platform android --profile preview
```

**Local EAS build (runs on this machine):**
```bash
npm install
npx eas build --platform android --profile preview --local
```

---

## Rules

- Do NOT run `gradlew` with `assembleDebug` when the user asked for an APK “for release” or “APK file”; prefer `assembleRelease` for a release APK.
- For local Gradle, the output is unsigned unless keystore is configured in `android/app/build.gradle`; say so.
- If the user says “local” or “on my machine” without “EAS”, use Option A (Gradle). If they say “EAS” or “Expo build”, use Option B.
- If unclear, offer both options and run the one that matches the project scripts (e.g. `build:android:apk:local` vs `build:android:apk`).

## Assumptions

- Default branch: main. Build does not require a specific branch unless the user specifies.
- Java/JDK and Android SDK are installed for local Gradle builds.
- For EAS cloud build, project is linked to an Expo account (`eas project:link` if needed).

## Output format

- Chosen option (A: Local Gradle / B: EAS)
- Exact commands run
- Path to APK or download link
- One-line note if the APK is unsigned (local Gradle) or EAS-signed

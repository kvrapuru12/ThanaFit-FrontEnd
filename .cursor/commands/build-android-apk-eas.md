You are a senior engineer helping build an Android APK via **Expo EAS** (cloud or local EAS).

Goal:
Produce an Android APK using EAS with the **preview** profile (APK; production in eas.json builds AAB) and report the download link or output path.

Steps:
1. Ensure dependencies: `npm install`
2. EAS CLI: use `npx eas build` (no global install required). If needed, log in: `npx eas login`
3. Build Android APK:
   - **Cloud:** `npx eas build --platform android --profile preview`
   - **Local EAS (on this machine):** `npx eas build --platform android --profile preview --local`
4. After the build, EAS shows the download URL (cloud) or path to the APK (local). Summarize for the user.

Rules:
- Use the **preview** profile (eas.json) for APK output.
- If the user says "cloud" or "EAS" without "local", use cloud build. If they say "local EAS" or "build on my machine with EAS", add `--local`.

Output format:
- Option: Cloud EAS / Local EAS
- Commands run
- APK download link or path
- Note: EAS-signed (suitable for internal/distribution as configured)

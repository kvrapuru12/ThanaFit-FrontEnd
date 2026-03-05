# What You're Missing for App Store

Audit of gaps between your project and Apple’s requirements. Items marked **Fixed** are now done in the repo.

---

## 1. In-app account deletion (Apple required) – **Fixed**

- **Was missing:** The app said “Settings → Privacy → Delete My Account” in the FAQ but there was no button that called the backend or signed the user out.
- **Now:** 
  - **Settings → Privacy** (Privacy Policy screen) has a **“Delete my account”** button.
  - It uses a two-step confirmation, then calls `DELETE /api/users/{id}` and signs the user out.
  - Implemented in: `IAuthRepository.deleteAccount`, `AuthRepositoryImpl`, `AuthProvider.deleteAccount`, `PrivacyPolicyScreen`.

---

## 2. App icon 1024×1024 – **You must add**

- **Status:** Missing.
- **Detail:** `ios/ThanaFit/Images.xcassets/AppIcon.appiconset/Contents.json` references `App-Icon-1024x1024@1x.png`, but that file is **not** in the appiconset (only `Contents.json` exists).
- **Action:** Add a **1024×1024 px PNG** (opaque, no transparency) with the exact filename **`App-Icon-1024x1024@1x.png`** into  
  `ios/ThanaFit/Images.xcassets/AppIcon.appiconset/`.  
  Without it, the iOS archive / EAS build can fail.

---

## 3. Privacy policy URL (for App Store Connect) – **You must add**

- **Status:** Not in the repo (by design).
- **Detail:** You have in-app privacy policy text in `StaticContentScreen.tsx`, but **App Store Connect requires a public URL** (e.g. `https://yoursite.com/privacy`).
- **Action:** Publish the same (or equivalent) policy on a webpage and use that URL in App Store Connect when you create the app. You can also link to it from the app if you want.

---

## 4. Support URL (for App Store Connect) – **You must add**

- **Status:** Not in the repo.
- **Detail:** App Store Connect asks for a Support URL. Your in-app copy mentions `support@thanafit.com`.
- **Action:** Use a support page URL (e.g. `https://yoursite.com/support`) or a `mailto:support@thanafit.com` link when filling the Support URL in App Store Connect.

---

## 5. App Store App ID (for “Rate app” link) – **After you create the app**

- **Status:** `app.json` → `extra.appStoreAppId` is `""`.
- **Detail:** The Settings “Rate the app” link uses this. It’s correct to leave it empty until the app exists in App Store Connect.
- **Action:** After you create the app in App Store Connect, set `extra.appStoreAppId` to the numeric Apple app ID (e.g. `"1234567890"`).

---

## 6. Already in good shape

- Sign in with Apple (frontend) – implemented and wired to `POST /api/auth/apple`.
- Microphone usage – `NSMicrophoneUsageDescription` in Info.plist.
- ATS – `NSAllowsArbitraryLoads` removed; only your API exception remains.
- EAS iOS build/submit – configured in `eas.json`.
- Version alignment – e.g. 3.0.3 in Info.plist and app.json.
- Backend contract – Apple login uses `idToken`, `platform`, `email`, `firstName`, `lastName` as per your BE.

---

## Summary

| Item | Status | Action |
|------|--------|--------|
| In-app account deletion | Fixed | None – use Settings → Privacy → Delete my account. |
| 1024×1024 app icon | Missing | Add `App-Icon-1024x1024@1x.png` to the appiconset. |
| Privacy policy URL | External | Host policy and paste URL in App Store Connect. |
| Support URL | External | Add support URL (or mailto) in App Store Connect. |
| `appStoreAppId` | Later | Set in `app.json` after creating the app in App Store Connect. |

After you add the icon and have the two URLs ready for App Store Connect, you’re set for the store listing and submission.

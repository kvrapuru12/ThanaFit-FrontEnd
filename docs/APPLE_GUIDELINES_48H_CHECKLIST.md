# Apple Guidelines – What to Do While Your Developer Account Activates (48h)

Use this list so you’re ready to submit as soon as your Apple Developer account is active.

---

## 1. Privacy & legal (required by Apple)

| Task | Status | Notes |
|------|--------|--------|
| **Privacy policy URL** | [ ] | Host a real page (your site or GitHub Pages). You’ll paste this URL in App Store Connect. Must explain what data you collect (account, health/fitness, voice, etc.) and how you use it. |
| **Support URL** | [ ] | A page or email (e.g. `mailto:support@yourdomain.com` or a simple “Contact” page). Required in App Store Connect. |
| **In-app account deletion** | [ ] | Apple requires a **clear, in-app** way to delete account and data. Your backend has `DELETE /api/users/{id}`. Ensure the app has a path like **Settings → Privacy → Delete My Account** (or similar) that calls this and then signs the user out. If that flow isn’t in the app yet, add it. |

---

## 2. App content & assets

| Task | Status | Notes |
|------|--------|--------|
| **App icon 1024×1024** | [ ] | Add `ios/ThanaFit/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png` (opaque PNG). Required for archive/upload. See [docs/IOS_APP_STORE_CHECKLIST.md](IOS_APP_STORE_CHECKLIST.md). |
| **Screenshots** | [ ] | Capture for required device sizes (e.g. 6.7", 6.5", 5.5" iPhone). Use Simulator (File → New Screen) or a real device. No placeholder text; use real app screens. |
| **App description & keywords** | [ ] | Draft short description, full description, and keywords for App Store Connect. |
| **Age rating** | [ ] | In App Store Connect you’ll answer the questionnaire. For a fitness/nutrition app with no restricted content, expect 4+. |

---

## 3. Backend & auth

| Task | Status | Notes |
|------|--------|--------|
| **`POST /api/auth/apple` live** | [ ] | Backend must be deployed and accepting requests (idToken, platform, optional email/firstName/lastName). Test with a real device or Simulator once the app can reach the API. |
| **Account deletion endpoint** | [ ] | `DELETE /api/users/{id}` must be live and working. The app should call it from the in-app “Delete account” flow. |

---

## 4. App Store Connect (after account is active)

| Task | Status | Notes |
|------|--------|--------|
| **Create app** | [ ] | Bundle ID: `com.prod.thanafit`. Create the app record in App Store Connect. |
| **Agreements, Tax, Banking** | [ ] | Accept Paid/Free Apps agreements and complete Tax and Banking so you can distribute. |
| **App Privacy** | [ ] | In the app’s “App Privacy” section, declare data types (e.g. account info, health/fitness, identifiers). Say if you use data for tracking. Link to your privacy policy. |
| **Export compliance** | [ ] | If you only use standard HTTPS (no custom crypto), answer “No” to encryption. |
| **Set `appStoreAppId`** | [ ] | After the app is created, put its Apple app ID in `app.json` → `extra.appStoreAppId` so the in-app “Rate app” link works. |

---

## 5. Already done in the app (no action needed)

- Sign in with Apple (frontend) – implemented and wired to `POST /api/auth/apple`.
- Permission string for microphone – `NSMicrophoneUsageDescription` in Info.plist.
- ATS – `NSAllowsArbitraryLoads` removed; only your API exception is used.
- EAS iOS build and submit config in `eas.json`.
- Version alignment (e.g. 3.0.3) and build number handling.

---

## 6. Quick reference

- **Privacy policy** – Required; host it and use the URL in App Store Connect and (if applicable) in the app.
- **Account deletion** – Required; must be discoverable in the app and must delete data on the server.
- **Sign in with Apple** – Required when you offer Google (or other third-party) sign-in; already implemented in the app.
- **Icon & screenshots** – Required for submission; prepare during the 48h so you can submit as soon as the account is active.

When the account is active: create the app in App Store Connect, run `eas build --platform ios --profile production`, then `eas submit --platform ios --latest --profile production`, complete the listing (description, screenshots, privacy, age rating), and submit for review.

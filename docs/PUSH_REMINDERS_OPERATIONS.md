# ThanaFit Push Reminders Operations

This checklist covers external setup and rollout validation for push reminders.

## 1) External Setup

### Expo/EAS credentials
- Run `eas credentials -p ios` and ensure Push Notifications key is configured.
- Run `eas credentials -p android` and ensure FCM credentials are configured.
- Verify `expo.extra.eas.projectId` in `app.json` matches the project configured in EAS.

### Apple/APNs
- In Apple Developer, enable Push Notifications capability on app id `com.prod.thanafit`.
- Ensure APNs Auth Key is active and linked in Expo credentials.
- Build a new iOS binary after capability/key updates.

### Android/FCM
- Create or reuse Firebase project for `com.prod.thanafit`.
- Upload server credentials to Expo/EAS.
- Build new Android binary after FCM credential updates.

## 2) Backend Deployment

- Apply SQL schema in `backend/notifications/schema.sql`.
- Set env vars:
  - `DATABASE_URL`
  - `PORT` (optional, default `8090`)
  - `REMINDER_SCHEDULER_MS` (optional, default `300000`)
- Start service from `backend/notifications`:
  - `npm install`
  - `npm run dev` or `npm run start` after build

## 3) Release Validation

### Functional checks
- Register device token after login and verify row exists in `notification_devices`.
- Open notifications settings and persist preferences.
- Send test notification via `POST /notifications/test`.
- Verify reminder deep-link behavior:
  - food reminder opens Food tab
  - activity reminder opens Exercise tab
  - phase reminder opens CycleSync tab

### Rules checks
- Simulate local time at reminder boundary and validate:
  - no food log -> food reminder queued once
  - no activity log -> activity reminder queued once
- Simulate phase transition and verify one push is queued.

### Reliability checks
- Validate dedupe key uniqueness in `notification_delivery_log`.
- Validate invalid tokens are deactivated.
- Monitor failure rates and receipt outcomes.

## 4) Rollout Guardrails

- Start with internal users only.
- Limit daily reminders per user/type until baseline metrics are stable.
- Enable quiet hours by default for newly onboarded users.
- Review copy for privacy-safe lock-screen text.

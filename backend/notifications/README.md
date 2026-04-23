# ThanaFit Notifications Backend Module

This module provides a drop-in backend implementation for push reminders:

- Device token registration API
- Notification preferences API
- Scheduler for reminder rules
- Expo Push delivery worker with dedupe and token cleanup

## Endpoints

- `POST /notifications/devices/register`
- `DELETE /notifications/devices/:deviceId`
- `GET /notifications/preferences`
- `PATCH /notifications/preferences`
- `POST /notifications/test`

## Rules included

- Missing food logs reminder at user local reminder time.
- Missing activity logs reminder at user local reminder time.
- Cycle phase-change reminder when phase transitions.

## Run

1. Apply SQL in `schema.sql`.
2. Set `DATABASE_URL`.
3. Install deps and run:
   - `npm install`
   - `npm run dev`

## Notes

- This module assumes auth middleware sets `req.user.id`.
- It assumes existing `food_logs`, `activity_logs`, and `cycles` tables.
- Use `docs/PUSH_REMINDERS_OPERATIONS.md` for external credentials and rollout checks.

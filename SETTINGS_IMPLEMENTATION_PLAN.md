# Settings Implementation Plan for App Store Submission

## Overview
This document maps the existing Settings menu structure to required App Store functionality and identifies necessary backend endpoints.

---

## 1. **SETTINGS (App preferences)** 🔧

### Critical Concepts to Implement:
- ✅ **Change Password** - Required for account security
- ✅ **Account Deletion** - **MANDATORY for App Store** (Apple requirement)
- ✅ **Units Preference** - Metric/Imperial (weight, height, distance)
- ✅ **Language Preference** - If supporting multiple languages
- ✅ **Theme Preference** - Light/Dark mode (optional but nice)

### Backend Endpoints Needed:

#### **Change Password**
```
POST /api/auth/change-password
Request Body:
{
  "currentPassword": "string",
  "newPassword": "string"
}
Response: 200 OK
{
  "message": "Password changed successfully"
}
```

#### **Delete Account** (CRITICAL - Required by Apple)
```
DELETE /api/users/{id}
Headers:
  Authorization: Bearer {token}
Response: 200 OK
{
  "message": "Account deleted successfully"
}
Note: Should delete ALL user data including:
- User profile
- Cycle records
- Food logs
- Exercise logs
- Progress data
- All related records
```

#### **Update User Preferences** (if storing preferences on backend)
```
PATCH /api/users/{id}/preferences
Request Body:
{
  "units": "METRIC" | "IMPERIAL",
  "language": "en" | "es" | etc.,
  "theme": "light" | "dark" | "auto"
}
Response: 200 OK
{
  "message": "Preferences updated successfully"
}
```

---

## 2. **NOTIFICATIONS (Manage alerts)** 🔔

### Critical Concepts to Implement:
- ✅ **Push Notifications Toggle** - Master switch
- ✅ **Notification Categories** - Granular control
  - Workout reminders
  - Goal progress updates
  - Cycle predictions/alerts
  - Health tips
  - General app updates

### Backend Endpoints Needed:

#### **Get Notification Settings**
```
GET /api/users/{id}/notification-settings
Response: 200 OK
{
  "pushEnabled": true,
  "workoutReminders": true,
  "goalProgress": true,
  "cycleAlerts": true,
  "healthTips": false,
  "appUpdates": true
}
```

#### **Update Notification Settings**
```
PATCH /api/users/{id}/notification-settings
Request Body:
{
  "pushEnabled": boolean,
  "workoutReminders": boolean,
  "goalProgress": boolean,
  "cycleAlerts": boolean,
  "healthTips": boolean,
  "appUpdates": boolean
}
Response: 200 OK
{
  "message": "Notification settings updated"
}
```

#### **Register Device Token** (for push notifications)
```
POST /api/notifications/register-device
Request Body:
{
  "deviceToken": "string",
  "platform": "ios" | "android"
}
Response: 200 OK
{
  "message": "Device registered successfully"
}
```

---

## 3. **PRIVACY (Data & security)** 🔒

### Critical Concepts to Implement:
- ✅ **Privacy Policy Link** - **MANDATORY for App Store**
- ✅ **Terms of Service Link** - **MANDATORY for App Store**
- ✅ **Data Export** - Download user data (GDPR compliance)
- ✅ **Data Deletion** - Already covered in Settings, but emphasize here
- ✅ **Health Data Permissions** - If using HealthKit/Google Fit
- ✅ **Location Permissions** - If app uses location

### Backend Endpoints Needed:

#### **Get Privacy Policy & Terms URLs** (can be static URLs in app config)
```
GET /api/privacy/policy
Response: 200 OK
{
  "url": "https://yourdomain.com/privacy-policy"
}

GET /api/privacy/terms
Response: 200 OK
{
  "url": "https://yourdomain.com/terms-of-service"
}
```

#### **Export User Data** (GDPR/CCPA compliance)
```
GET /api/users/{id}/data-export
Response: 200 OK
{
  "downloadUrl": "https://yourdomain.com/exports/user-{id}-{timestamp}.json",
  "expiresAt": "2025-01-15T10:00:00Z"
}
OR
Response: 200 OK (direct JSON)
{
  "user": { ... },
  "cycles": [ ... ],
  "foodLogs": [ ... ],
  "exerciseLogs": [ ... ],
  "progressData": [ ... ]
}
```

#### **Manage Health Data Permissions** (if applicable)
```
GET /api/users/{id}/health-permissions
Response: 200 OK
{
  "healthKitEnabled": false,
  "googleFitEnabled": false,
  "permissions": []
}

PATCH /api/users/{id}/health-permissions
Request Body:
{
  "healthKitEnabled": boolean,
  "googleFitEnabled": boolean
}
```

---

## 4. **SUPPORT (Get help)** ❓

### Critical Concepts to Implement:
- ✅ **Contact Support** - Email or in-app form
- ✅ **FAQ/Help Center** - Link to knowledge base
- ✅ **Report a Bug** - Bug reporting form
- ✅ **App Version** - Display current version
- ✅ **Rate the App** - Link to App Store rating

### Backend Endpoints Needed:

#### **Contact Support**
```
POST /api/support/contact
Request Body:
{
  "subject": "string",
  "message": "string",
  "category": "general" | "bug" | "feature" | "account",
  "attachments": [] // optional
}
Response: 200 OK
{
  "message": "Support request submitted",
  "ticketId": "TKT-12345"
}
```

#### **Get FAQ/Help URLs** (can be static)
```
GET /api/support/faq
Response: 200 OK
{
  "url": "https://yourdomain.com/faq"
}
```

#### **Get App Version** (optional - can be from app.json)
```
GET /api/app/version
Response: 200 OK
{
  "version": "1.0.0",
  "buildNumber": "1",
  "lastUpdated": "2025-01-10T10:00:00Z"
}
```

---

## Implementation Priority

### **Phase 1: CRITICAL (Must Have for App Store)**
1. ✅ Privacy Policy & Terms links (can be static URLs)
2. ✅ Delete Account functionality (`DELETE /api/users/{id}`)
3. ✅ Contact Support form (`POST /api/support/contact`)
4. ✅ App version display (from `app.json`)

### **Phase 2: IMPORTANT (Should Have)**
1. ✅ Change Password (`POST /api/auth/change-password`)
2. ✅ Notification Settings (`GET/PATCH /api/users/{id}/notification-settings`)
3. ✅ Data Export (`GET /api/users/{id}/data-export`)
4. ✅ FAQ/Help Center link

### **Phase 3: NICE TO HAVE**
1. ✅ Units preference (metric/imperial)
2. ✅ Theme preference (light/dark)
3. ✅ Device token registration for push notifications
4. ✅ Health data permissions management

---

## Frontend Implementation Notes

### Settings Screen Structure:
```
SettingsScreen
├── Settings Section
│   ├── Change Password
│   ├── Units (Metric/Imperial)
│   ├── Theme (Light/Dark)
│   └── Delete Account (with confirmation)
│
├── Notifications Section
│   ├── Push Notifications Toggle
│   ├── Workout Reminders Toggle
│   ├── Goal Progress Toggle
│   ├── Cycle Alerts Toggle
│   └── Health Tips Toggle
│
├── Privacy Section
│   ├── Privacy Policy (link)
│   ├── Terms of Service (link)
│   ├── Export My Data (button)
│   └── Delete My Account (link to Settings)
│
└── Support Section
    ├── Contact Support (form)
    ├── FAQ/Help Center (link)
    ├── Report a Bug (form)
    ├── Rate the App (link)
    └── App Version (display)
```

---

## Next Steps

1. **Create Settings Screen Component** - New screen with 4 sections
2. **Implement Navigation** - Link menu items in Profile to Settings screen
3. **Backend Endpoints** - Implement critical endpoints first
4. **Test Account Deletion** - Ensure complete data removal
5. **Add Privacy Policy & Terms** - Create and host these documents
6. **Submit for Review** - Once critical items are complete




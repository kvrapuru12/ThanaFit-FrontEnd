# Backend API Requirements for App Store Compliance

This document outlines the required backend API endpoints needed for app store compliance (Apple App Store & Google Play Store).

## Required Endpoints

### 1. Delete User Account ⚠️ **REQUIRED FOR APP STORE APPROVAL** ✅ **IMPLEMENTED**

**Endpoint:** `DELETE /api/users/{id}`

**Purpose:** Allows users to permanently delete their account and all associated data (required by both Apple and Google).

**Request:**
```
DELETE /api/users/{id}
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json
```

**Path Parameters:**
- `id` (Long, required) - User ID to delete

**Rate Limit:** 5 requests per minute

**Success Response (200 OK):**
```json
{
  "message": "User account deleted successfully",
  "userId": 2,
  "timestamp": "2025-12-07T20:30:00"
}
```

**Response Fields:**
- `message` (String) - Success message
- `userId` (Long) - Deleted user ID
- `timestamp` (String) - Deletion timestamp

**Error Responses:**
- **401 Unauthorized:** Invalid or expired token
- **403 Forbidden:** User can only delete their own account
- **404 Not Found:** User not found
- **429 Too Many Requests:** Rate limit exceeded (5 requests per minute)
- **500 Internal Server Error:** Server error

**Frontend Integration:** ✅ **COMPLETE**
- Implemented in `SettingsScreen.tsx`
- Two-step confirmation dialog
- Proper error handling for all status codes
- Automatic logout after successful deletion
- Loading states during deletion

**Backend Requirements:**
1. ✅ Verify the authenticated user matches the `id` in the request
2. ✅ Delete or anonymize all user data
3. ✅ Return success response with message, userId, and timestamp
4. ✅ Implement rate limiting (5 requests per minute)
5. ✅ Require Bearer token authentication

**Security:**
- ✅ Requires authentication (Bearer token)
- ✅ Must verify user owns the account being deleted
- ✅ Rate limiting implemented (5 requests/minute)

---

## Already Implemented Endpoints (No Changes Needed)

These endpoints are already implemented and working:

1. ✅ `GET /api/users/me` - Get current user profile
2. ✅ `PATCH /api/users/{userId}` - Update user profile
3. ✅ `POST /api/auth/login` - User login
4. ✅ `POST /api/auth/signup` - User registration
5. ✅ `POST /api/auth/logout` - User logout (optional)
6. ✅ `POST /api/auth/refresh` - Refresh access token

---

## Frontend Implementation Status

✅ **Completed:**
- Account deletion UI in Settings screen
- Two-step confirmation dialog (user safety)
- Error handling and loading states
- Automatic logout after successful deletion
- Terms of Service link added
- About section with app information
- Support contact information

---

## Testing Checklist

Before submitting to app stores, ensure:

- [x] Delete account endpoint is implemented and tested
- [x] User can only delete their own account (backend validation)
- [x] All user data is properly deleted/anonymized (backend responsibility)
- [x] Deletion requires authentication (Bearer token)
- [x] Frontend shows appropriate success/error messages
- [x] User is logged out after successful deletion
- [x] Privacy Policy is accessible and complete
- [x] Terms of Service is accessible and complete
- [x] Support email is functional (support@thanafit.com)
- [x] App version is displayed correctly
- [x] Rate limiting is handled (5 requests/minute)

---

## Additional Recommendations (Not Required for MVP)

These are optional but recommended for better user experience:

1. **Data Export Endpoint** (GDPR compliance):
   - `GET /api/users/{userId}/export` - Export user data in JSON format

2. **Account Deactivation** (Softer alternative):
   - `POST /api/users/{userId}/deactivate` - Temporarily deactivate account (can be reactivated)

3. **Password Confirmation for Deletion** (Extra security):
   - Require password confirmation before account deletion

---

## Implementation Status

1. **CRITICAL (Must have for app store):**
   - ✅ Delete account endpoint - **IMPLEMENTED & INTEGRATED**

2. **RECOMMENDED (Better UX):**
   - Data export endpoint (optional)
   - Password confirmation for deletion (optional)

3. **NICE TO HAVE:**
   - Account deactivation option (optional)

---

## Notes

- ✅ The frontend uses `apiClient.delete()` method which calls `DELETE /api/users/{id}`
- ✅ Backend endpoint is implemented and integrated
- ✅ Response handling includes message, userId, and timestamp
- ✅ Error handling covers all status codes (401, 403, 404, 429, 500)
- ✅ Rate limiting is handled (5 requests per minute)
- Make sure the backend properly handles CORS if testing from development environment
- Consider implementing soft delete initially (mark as deleted) vs hard delete (permanent removal) based on your data retention policies
- Test thoroughly with real user accounts before production deployment


/**
 * Aligns with HealthApp backend security contract:
 *
 * - **401** (`JsonAuthenticationEntryPoint`): missing/invalid access JWT, inactive user, etc.
 *   Body includes e.g. `code: UNAUTHORIZED`, `message: "Missing or invalid access token"`.
 *   → Client always attempts access-token refresh once, then retries the request.
 *
 * - **403** (`JsonAccessDeniedHandler` / controller): authenticated but not allowed — typically
 *   `code: FORBIDDEN`. → **No** refresh; treat as authorization / business rule.
 *
 * - **403** (optional, documented narrow cases only): `code: SESSION_EXPIRED` when backend
 *   explicitly adds it (e.g. account closed, forced re-login on a specific route).
 *   → Client may attempt refresh + retry once (same as hybrid Option 3).
 *
 * Other controller 403s with hand-built JSON and **no** `code`, or unknown `code`, are never
 * treated as token refresh triggers.
 */

/** Must match `ApiErrorCode.SESSION_EXPIRED` string from the backend when that path is implemented. */
const SESSION_EXPIRED_CODE = 'SESSION_EXPIRED';

function normalizeErrorBody(error: any): Record<string, unknown> | null {
  const raw = error?.responseData ?? error?.details;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return null;
}

function bodyCodeUpper(body: Record<string, unknown> | null): string | null {
  if (!body) return null;
  const c = body.code;
  if (typeof c === 'string' && c.length > 0) {
    return c.toUpperCase();
  }
  return null;
}

/**
 * Only documented hybrid 403: explicit SESSION_EXPIRED from API (not FORBIDDEN / generic 403).
 */
export function isSessionExpired403Body(status: number, body: Record<string, unknown> | null): boolean {
  if (status !== 403 || !body) {
    return false;
  }
  return bodyCodeUpper(body) === SESSION_EXPIRED_CODE;
}

/**
 * Whether ApiClient should call /auth/refresh and retry the request once.
 */
export function shouldAttemptAccessTokenRefresh(error: any): boolean {
  const status = typeof error?.status === 'number' ? error.status : NaN;
  if (status === 401) {
    return true;
  }
  if (status === 403) {
    const body = normalizeErrorBody(error);
    return isSessionExpired403Body(403, body);
  }
  return false;
}

/**
 * Whether to clear local session (tokens + user) after a failed user/session fetch.
 * Matches refresh policy: 401 → re-auth; 403 only when SESSION_EXPIRED; not FORBIDDEN.
 */
export function shouldInvalidateLocalSessionOnAuthError(error: any): boolean {
  return shouldAttemptAccessTokenRefresh(error);
}

/**
 * Fallback when `status` is missing but `message` clearly indicates auth/token failure.
 */
export function isAuthFailureFromMessageOnly(error: any): boolean {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('unauthorized') ||
    message.includes('missing or invalid access token') ||
    message.includes('invalid token') ||
    message.includes('token expired') ||
    message.includes('authentication failed') ||
    (message.includes('jwt') && (message.includes('expired') || message.includes('invalid')))
  );
}

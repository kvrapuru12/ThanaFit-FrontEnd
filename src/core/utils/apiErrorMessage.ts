/**
 * Join Spring-style `fieldErrors` map into a single readable string, or null if empty.
 */
function formatFieldErrorsSummary(fieldErrors: unknown): string | null {
  if (!fieldErrors || typeof fieldErrors !== 'object' || Array.isArray(fieldErrors)) {
    return null;
  }
  const parts = Object.entries(fieldErrors as Record<string, unknown>)
    .map(([k, v]) => {
      if (typeof v === 'string' && v.trim()) return `${k}: ${v.trim()}`;
      if (Array.isArray(v)) return `${k}: ${v.map(String).join(', ')}`;
      return null;
    })
    .filter((p): p is string => !!p);
  return parts.length ? parts.join('\n') : null;
}

/**
 * Build one user-facing string from Spring validation / error bodies:
 * when `fieldErrors` is present, append it after `message` or `error` so alerts show specifics.
 */
export function composeSpringApiErrorMessage(data: unknown): string | null {
  const d =
    data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
  if (!d) return null;

  const fe = formatFieldErrorsSummary(d.fieldErrors);
  const msg = typeof d.message === 'string' && d.message.trim() ? d.message.trim() : '';
  const err = typeof d.error === 'string' && d.error.trim() ? d.error.trim() : '';

  if (fe) {
    if (msg) return `${msg}\n\n${fe}`;
    if (err) return `${err}\n\n${fe}`;
    return fe;
  }
  if (msg) return msg;
  if (err) return err;
  return null;
}

/**
 * Best-effort user-facing message from fetch/ApiClient errors.
 * Supports Spring-style bodies: message, error, fieldErrors, ApiError.details, and thrown Error.message.
 */
export function getUserFacingApiMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    const fromRd = composeSpringApiErrorMessage(e.responseData);
    if (fromRd) return fromRd;
    const fromDetails = composeSpringApiErrorMessage(e.details);
    if (fromDetails) return fromDetails;
    if (typeof e.message === 'string' && e.message.trim()) {
      return e.message.trim();
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return 'Something went wrong. Please try again.';
}

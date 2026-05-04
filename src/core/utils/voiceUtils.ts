/** Backend `VoiceActivityLogRequest` constraint (Bean Validation). */
export const ACTIVITY_VOICE_TEXT_MIN_LEN = 5;
export const ACTIVITY_VOICE_TEXT_MAX_LEN = 1000;

/**
 * Returns a user-facing validation message if `voiceText` is out of bounds, else null.
 */
export function validateActivityVoiceTextLength(voiceText: string): string | null {
  const t = voiceText.trim();
  if (t.length < ACTIVITY_VOICE_TEXT_MIN_LEN) {
    return `Please enter at least ${ACTIVITY_VOICE_TEXT_MIN_LEN} characters (e.g. "30 min walk").`;
  }
  if (t.length > ACTIVITY_VOICE_TEXT_MAX_LEN) {
    return `Please keep your description under ${ACTIVITY_VOICE_TEXT_MAX_LEN} characters.`;
  }
  return null;
}

/**
 * Returns true if the transcript is effectively empty/silence (e.g. Whisper returns ". . ." or ". ." when no speech is detected).
 * Use this to show a "No speech detected" message instead of displaying the raw result.
 */
export function isSilentOrEmptyTranscript(text: string | undefined | null): boolean {
  const t = (text ?? '').trim();
  if (t.length === 0) return true;
  // No letters or digits = no real speech (covers ". .", ". . .", "…", " - ", etc.)
  if (!/[a-zA-Z0-9]/.test(t)) return true;
  return false;
}

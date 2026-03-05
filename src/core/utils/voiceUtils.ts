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

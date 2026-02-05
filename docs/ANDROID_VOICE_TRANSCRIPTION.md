# Android vs iOS: Voice Recording & Transcription (Whisper)

## Why it works on iOS but often fails on Android

### 1. **FormData + file URI handling**

- **iOS:** When you do `formData.append('file', { uri, name, type })` and call `fetch(url, { body: formData })`, the native iOS networking layer reads the file from the `uri` (e.g. `file:///...`) and builds the multipart body correctly.
- **Android:** The same JS code uses React Native’s networking, which on Android does **not** always read from `file://` (or cache) URIs when building the multipart request. The request can be sent with an empty or invalid file part, so Whisper returns an error or “empty file”.
- **Result:** Same code path works on iOS; on Android the upload often fails even though the recording file exists on disk.

### 2. **Recording format and storage**

- **iOS:** expo-av uses WAV (LINEARPCM); the file is in a path the system handles consistently.
- **Android:** expo-av can use M4A (which Whisper supports), but the **URI** may point into app cache (`file:///data/user/0/.../cache/...`). Some devices or React Native versions have issues when the **JS/networking layer** tries to read from that path for `fetch` + FormData.
- **Result:** Recording itself can be fine on both; the **upload** step is where Android breaks when using `fetch` + FormData with that URI.

### 3. **Permissions and timing**

- **Android** requires explicit **runtime** `RECORD_AUDIO`; the first time you must call `Audio.requestPermissionsAsync()` and wait for “granted” before starting the recording. If you don’t, recording can fail or produce empty files.
- **iOS** also needs permission but is often more forgiving with timing; the same code can appear to “just work” on iOS.

### 4. **Audio focus (TTS vs recording)**

- **expo-speech** (TTS) and **expo-av** recording both use the audio pipeline. If TTS runs right before or during recording, Android may not give the recorder focus, leading to silence or very low volume in the file.
- **iOS** tends to handle quick TTS → record sequences more reliably.
- **Mitigation:** Call `Speech.stop()` and add a short delay (e.g. 400 ms) before starting the recording.

### 5. **Empty or tiny files**

- On Android, if the file is 0 bytes or very small, the problem is **recording** (permission, format, or audio focus), not Whisper.
- Checking file size with `FileSystem.getInfoAsync(uri, { size: true })` after stopping the recording helps distinguish “recording failed” from “upload/transcription failed”.

---

## What we do to make it work on both platforms

1. **Android upload: use native file upload**
   - On **Android**, we **do not** use `fetch` + FormData with the recording URI.
   - We use **`expo-file-system`’s `FileSystem.uploadAsync()`** with:
     - Same Whisper API URL
     - `uploadType: FileSystem.FileSystemUploadType.MULTIPART`
     - `fieldName: 'file'`
     - `mimeType` and optional `parameters` (e.g. model, language)
     - `headers: { Authorization: 'Bearer ...' }`
   - The **native** Android code reads the file from the URI and builds the multipart request, which works reliably.
   - On **iOS**, we keep using **`fetch` + FormData** with `{ uri, name, type }` because it already works.

2. **Recording**
   - Use **explicit** Android recording options: M4A, mono, 16 kHz (or 44.1 kHz), so the file is Whisper‑friendly and consistent.
   - Call **`Audio.requestPermissionsAsync()`** before starting and only start when status is `granted`.
   - Set **`Audio.setAudioModeAsync()`** appropriately for recording (and for Android, e.g. `shouldDuckAndroid`, `playThroughEarpieceAndroid`).

3. **TTS vs recording**
   - Before starting the recorder: **`Speech.stop()`** then **`await new Promise(r => setTimeout(r, 400))`** (or similar) so the recorder gets a clean audio focus.

4. **Visibility**
   - After stopping the recording, **log or check file size** (e.g. with `FileSystem.getInfoAsync(uri, { size: true })`). If size is 0 or very small, the issue is recording; if size is normal but Whisper fails, the issue is upload or API.

With these changes, the same feature (record → upload → Whisper) works on **both iOS and Android**: iOS keeps using fetch + FormData; Android uses FileSystem.uploadAsync so the file is read and sent by the native layer.

---

## Emulator vs real device

- **Android Emulator** often has a broken or absent virtual microphone. Logcat may show:
  - `pcm_readi failed with 'cannot read/write stream data: I/O error'` (from `android.hardware.audio.service` / ranchu).
- In that case recording will produce **empty or silent files** no matter what the app does. **Test voice recording on a real Android device** (Expo Go or a dev build); the emulator is not reliable for mic input.

## TTS (expo-speech) errors in logcat

- You may see **Google TTS** errors such as:
  - `Error parsing '^|[^\p{Letter}\\]': invalid character class range`
  - `Error creating replacement rule`
- These come from the system TTS engine, not from the app. They can occur on some devices/emulators and may cause the spoken instruction (“Please describe what you ate”) to fail or be skipped. The app treats TTS as optional: if it throws, we log and continue; **recording and Whisper still work**.

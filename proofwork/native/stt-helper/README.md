# STTStreamHelper

On-device speech-to-text helper for Proofwork (macOS, Swift). It is a background `.app` (LSUIElement) driven over stdin/stdout and fd 3 by the Electron main process.

## Build

```sh
bash native/stt-helper/build.sh      # or: npm run stt:build
```

Output: `native/stt-helper/build/STTStreamHelper.app`. The script compiles with `swiftc -O -target arm64-apple-macos13.0`, links `Info.plist` into `__TEXT,__info_plist`, and ad-hoc signs the bundle (`codesign --force --sign - --timestamp=none`). It is idempotent. Full Xcode is not required; Command Line Tools are enough.

## Test

```sh
bash native/stt-helper/test.sh
```

- Fake-mode protocol test (`PW_STT_FAKE=1`): starts the helper with fd 3 on a pipe, sends `warmup`, `start t1`, streams 2 s of 440 Hz Float32 audio, sends `stop`, then asserts `STATUS: Ready`, `STATUS: Started t1`, at least one `PARTIAL t1`, exactly one `FINAL t1`, and exit 0 after `quit`.
- Real-mode smoke: runs `STTStreamHelper check` only and checks the `AUTH:` line. It does not attempt recognition.

## Protocol

**Commands (stdin, one per line, UTF-8)**

| Command | Behaviour |
|---|---|
| `warmup` | Creates the en-US recognizer and the 16 kHz Float32 mono format. Prints `STATUS: Ready`. |
| `vocab a\|b\|c` | Contextual strings for the next `start` only. |
| `start <turnId>` | Begins a turn. Prints `STATUS: Started <turnId>`. The turn id must not contain spaces. |
| `stop [watermark]` | Ends audio for the active turn, prints `FINAL`, then `STATUS: Stopped <turnId>`. The watermark is accepted and ignored. |
| `quit` | Exits 0. EOF on stdin also exits 0. Quit and EOF do not emit `FINAL`. |

**Audio (fd 3)**: raw Float32 little-endian, 16 kHz, mono. Read continuously on a background thread. Samples arriving while no turn is active are discarded.

**Output (stdout, flushed per line)**

- `PARTIAL <turnId> <seq>: <text>` (seq starts at 1 per turn)
- `FINAL <turnId> <seq>: <text>`, exactly once per turn after `stop`. The text is empty when nothing was recognized.
- `ERROR <turnId|-> <code>: <message>`. Codes: `not_authorized`, `recognizer_unavailable`, `recognition_error`, `bad_command`, `audio_error`.
- `STATUS: <...>`
- `check` prints `AUTH: authorized|denied|restricted|notDetermined` and exits 0.

**Failed start**: a `start` that fails (for example `not_authorized`) prints an `ERROR` and registers a turn with no recognition. The caller's `stop` still produces `FINAL` with empty text and `STATUS: Stopped`, so the caller's turn state machine stays consistent.

**Fake mode (`PW_STT_FAKE=1`)**: Speech and AVFoundation are never touched. A `PARTIAL` is emitted every 0.5 s of received audio, with text `(speech N.Ns)` or `(silence N.Ns)` depending on the RMS energy of that window. `FINAL` reads `fake transcript of N.Ns of audio`. `check` prints `AUTH: authorized`.

## Permissions

- Authorization is requested once, on the first `start`, when the status is `notDetermined`. The first `start` blocks up to 120 s while the prompt is answered.
- Both `NSSpeechRecognitionUsageDescription` and `NSMicrophoneUsageDescription` are in `Info.plist` and embedded in the binary. They are required for the TCC prompt.
- In development, TCC attributes the permission to the parent app that launched the helper: Electron in dev, or Terminal when run from a shell. Grant access to that app in System Settings > Privacy & Security > Speech Recognition. A packaged build attributes it to the helper bundle itself (`com.proofwork.stthelper`).
- Recognition uses on-device mode when `supportsOnDeviceRecognition` is true, with partial results and `addsPunctuation`.

## Layout

```
Info.plist                 bundle Info.plist (also embedded into the binary)
build.sh                   swiftc + bundle + ad-hoc codesign
test.sh                    fake-mode protocol test and check smoke step
Sources/main.swift         mode selection, `check`, wiring
Sources/CommandLoop.swift  stdin command parser
Sources/AudioPipe.swift    fd 3 reader (Float32 LE decoding)
Sources/Recognizer.swift   Recognizer protocol and SFSpeechRecognizer backend
Sources/FakeRecognizer.swift  PW_STT_FAKE backend
Sources/Output.swift       serialised, flushed stdout writer
```

Sources are compiled in Swift 5 language mode (`-swift-version 5`). Cross-thread state is guarded by `NSLock`.

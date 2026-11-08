import AVFoundation
import Foundation
import Speech

/// Contract shared by the real and fake backends.
/// Commands arrive on the main thread; `feed` arrives on the fd 3 reader thread.
protocol Recognizer: AnyObject {
    /// Creates the recognizer and audio format, then prints `STATUS: Ready`.
    func warmup()
    /// Begins a turn and prints `STATUS: Started <id>`, or an `ERROR` line.
    /// A failed start still registers the turn, so the matching `stop` emits `FINAL` with empty text.
    func start(turn: String, vocab: [String])
    /// Ends the active turn, prints `FINAL` then `STATUS: Stopped`. Returns false when no turn is active.
    func stop() -> Bool
    /// Receives Float32 mono samples at 16 kHz. Samples are discarded when no turn is active.
    func feed(_ samples: [Float])
}

/// Maps an authorization status to the name printed by `check` and used in error text.
func authorizationName(_ status: SFSpeechRecognizerAuthorizationStatus) -> String {
    switch status {
    case .authorized: return "authorized"
    case .denied: return "denied"
    case .restricted: return "restricted"
    case .notDetermined: return "notDetermined"
    @unknown default: return "unknown"
    }
}

/// Real backend: SFSpeechRecognizer with on-device recognition where supported.
final class SpeechRecognizerEngine: Recognizer {
    private final class Turn {
        let id: String
        /// nil for a turn whose start failed. Audio is dropped and stop emits an empty FINAL.
        let request: SFSpeechAudioBufferRecognitionRequest?
        var task: SFSpeechRecognitionTask?
        var seq = 0
        var text = ""
        var ending = false
        var closed = false
        var doneSignalled = false
        let done = DispatchSemaphore(value: 0)

        init(id: String, request: SFSpeechAudioBufferRecognitionRequest?) {
            self.id = id
            self.request = request
        }
    }

    /// "No speech detected" (kAFAssistantErrorDomain 1110), expected when a turn ends in silence.
    private let noSpeechErrorCode = 1110

    private let lock = NSLock()
    private var recognizer: SFSpeechRecognizer?
    private var format: AVAudioFormat?
    /// The turn that accepts audio. Set and cleared only under `lock`.
    private var turn: Turn?
    /// Only touched from the command thread.
    private var authRequested = false

    func warmup() {
        lock.lock()
        defer { lock.unlock() }
        if prepareLocked() {
            Output.line("STATUS: Ready")
        }
    }

    func start(turn id: String, vocab: [String]) {
        if let busy = currentTurnID() {
            Output.error(id, "bad_command", "turn \(busy) is already active")
            return
        }

        lock.lock()
        let prepared = prepareLocked()
        let speech = recognizer
        lock.unlock()

        var failure: (code: String, message: String)?
        if !prepared || speech == nil {
            failure = ("recognizer_unavailable", "could not create an en-US speech recognizer")
        } else if let denied = authorizationProblem() {
            failure = ("not_authorized", denied)
        } else if let speech, !speech.isAvailable {
            failure = ("recognizer_unavailable", "speech recognizer is not available right now")
        }

        if let failure {
            Output.error(id, failure.code, failure.message)
            lock.lock()
            turn = Turn(id: id, request: nil)
            lock.unlock()
            return
        }

        guard let speech else { return } // unreachable: checked above
        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        if speech.supportsOnDeviceRecognition {
            request.requiresOnDeviceRecognition = true
        }
        request.addsPunctuation = true
        request.contextualStrings = vocab

        let t = Turn(id: id, request: request)
        t.task = speech.recognitionTask(with: request) { [weak self] result, error in
            self?.handle(t, result: result, error: error)
        }

        lock.lock()
        turn = t
        lock.unlock()
        Output.line("STATUS: Started \(id)")
    }

    func stop() -> Bool {
        lock.lock()
        guard let t = turn else {
            lock.unlock()
            return false
        }
        turn = nil // feed() drops audio from here on
        t.ending = true
        t.request?.endAudio()
        lock.unlock()

        if t.request != nil, t.done.wait(timeout: .now() + 10) == .timedOut {
            t.task?.cancel()
        }

        lock.lock()
        t.closed = true // no PARTIAL or ERROR for this turn after this point
        t.task = nil
        let text = t.text
        let seq = t.seq + 1
        lock.unlock()

        Output.line("FINAL \(t.id) \(seq): \(text)")
        Output.line("STATUS: Stopped \(t.id)")
        return true
    }

    func feed(_ samples: [Float]) {
        lock.lock()
        defer { lock.unlock() }
        guard let t = turn, let request = t.request, let format, !samples.isEmpty else { return }
        let frames = AVAudioFrameCount(samples.count)
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frames) else { return }
        buffer.frameLength = frames
        samples.withUnsafeBufferPointer { src in
            buffer.floatChannelData![0].update(from: src.baseAddress!, count: samples.count)
        }
        request.append(buffer)
    }

    // MARK: - Private

    private func currentTurnID() -> String? {
        lock.lock()
        defer { lock.unlock() }
        return turn?.id
    }

    /// Creates the recognizer and audio format once. Caller holds `lock`.
    private func prepareLocked() -> Bool {
        if recognizer == nil {
            guard let r = SFSpeechRecognizer(locale: Locale(identifier: "en-US")) else {
                Output.error("-", "recognizer_unavailable", "no speech recognizer for en-US")
                return false
            }
            recognizer = r
        }
        if format == nil {
            format = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: 16_000, channels: 1, interleaved: false)
        }
        return format != nil
    }

    /// Requests authorization once, on the first start. Returns a message when not authorized.
    private func authorizationProblem() -> String? {
        var status = SFSpeechRecognizer.authorizationStatus()
        if status == .notDetermined && !authRequested {
            authRequested = true
            let sem = DispatchSemaphore(value: 0)
            SFSpeechRecognizer.requestAuthorization { _ in sem.signal() }
            _ = sem.wait(timeout: .now() + 120)
            status = SFSpeechRecognizer.authorizationStatus()
        }
        if status == .authorized { return nil }
        return "speech recognition is \(authorizationName(status)); grant access to the parent app in System Settings > Privacy & Security > Speech Recognition"
    }

    private func handle(_ t: Turn, result: SFSpeechRecognitionResult?, error: Error?) {
        lock.lock()
        defer { lock.unlock() }
        if t.closed { return }

        if let result {
            t.text = result.bestTranscription.formattedString
            if result.isFinal {
                signalDone(t)
            } else {
                t.seq += 1
                Output.line("PARTIAL \(t.id) \(t.seq): \(t.text)")
            }
        }

        if let error {
            let silent = t.ending && (error as NSError).code == noSpeechErrorCode
            if !silent {
                Output.error(t.id, "recognition_error", error.localizedDescription)
            }
            signalDone(t)
        }
    }

    private func signalDone(_ t: Turn) {
        if !t.doneSignalled {
            t.doneSignalled = true
            t.done.signal()
        }
    }
}

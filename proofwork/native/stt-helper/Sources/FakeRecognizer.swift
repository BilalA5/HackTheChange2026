import Foundation

/// Backend used when PW_STT_FAKE=1. It never touches Speech or AVFoundation,
/// so automated tests run without any macOS permission.
final class FakeRecognizer: Recognizer {
    private final class Turn {
        let id: String
        var frames = 0             // total frames received in this turn
        var windowSumSquares = 0.0 // energy since the last PARTIAL
        var windowFrames = 0
        var lastPartialAt = 0
        var seq = 0

        init(id: String) { self.id = id }
    }

    private let sampleRate = 16_000
    private let partialEveryFrames = 8_000 // 0.5 s of audio
    private let speechRMSThreshold = 0.01

    private let lock = NSLock()
    private var turn: Turn?

    func warmup() {
        Output.line("STATUS: Ready")
    }

    func start(turn id: String, vocab: [String]) {
        lock.lock()
        if let busy = turn {
            lock.unlock()
            Output.error(id, "bad_command", "turn \(busy.id) is already active")
            return
        }
        turn = Turn(id: id)
        lock.unlock()
        Output.line("STATUS: Started \(id)")
    }

    func feed(_ samples: [Float]) {
        guard !samples.isEmpty else { return }
        lock.lock()
        defer { lock.unlock() }
        guard let t = turn else { return } // no active turn: discard

        for s in samples {
            t.windowSumSquares += Double(s) * Double(s)
        }
        t.windowFrames += samples.count
        t.frames += samples.count

        if t.frames - t.lastPartialAt >= partialEveryFrames {
            let rms = (t.windowSumSquares / Double(max(t.windowFrames, 1))).squareRoot()
            let label = rms >= speechRMSThreshold ? "speech" : "silence"
            t.seq += 1
            Output.line("PARTIAL \(t.id) \(t.seq): (\(label) \(seconds(t.frames))s)")
            t.lastPartialAt = t.frames
            t.windowSumSquares = 0
            t.windowFrames = 0
        }
    }

    func stop() -> Bool {
        lock.lock()
        guard let t = turn else {
            lock.unlock()
            return false
        }
        turn = nil
        lock.unlock()

        Output.line("FINAL \(t.id) \(t.seq + 1): fake transcript of \(seconds(t.frames))s of audio")
        Output.line("STATUS: Stopped \(t.id)")
        return true
    }

    private func seconds(_ frames: Int) -> String {
        String(format: "%.1f", Double(frames) / Double(sampleRate))
    }
}

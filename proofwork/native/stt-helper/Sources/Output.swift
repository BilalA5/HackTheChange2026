import Foundation

/// Serialised, flushed stdout writer. Every protocol line goes through here so
/// lines from the command loop, the audio reader and recognizer callbacks never interleave.
enum Output {
    private static let lock = NSLock()

    /// Writes one protocol line and flushes it. Embedded CR/LF are replaced with spaces
    /// so a transcript can never split a line.
    static func line(_ text: String) {
        lock.lock()
        defer { lock.unlock() }
        fputs(singleLine(text) + "\n", stdout)
        fflush(stdout)
    }

    /// Writes `ERROR <turn|-> <code>: <message>`.
    static func error(_ turn: String, _ code: String, _ message: String) {
        line("ERROR \(turn) \(code): \(message)")
    }

    private static func singleLine(_ s: String) -> String {
        s.replacingOccurrences(of: "\r", with: " ").replacingOccurrences(of: "\n", with: " ")
    }
}

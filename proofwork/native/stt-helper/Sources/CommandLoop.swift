import Foundation

/// Reads newline-delimited commands from stdin on the main thread.
/// Returns on `quit` or EOF; the caller then exits 0.
final class CommandLoop {
    private let recognizer: Recognizer
    /// Contextual strings set by `vocab`, consumed by the next `start`.
    private var vocab: [String] = []

    init(recognizer: Recognizer) {
        self.recognizer = recognizer
    }

    func run() {
        while let raw = readLine(strippingNewline: true) {
            let line = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            if line.isEmpty { continue }

            let parts = line.split(separator: " ", maxSplits: 1).map(String.init)
            let command = parts[0]
            let argument = parts.count > 1 ? parts[1].trimmingCharacters(in: .whitespaces) : ""

            switch command {
            case "warmup":
                recognizer.warmup()

            case "vocab":
                vocab = argument
                    .split(separator: "|")
                    .map { $0.trimmingCharacters(in: .whitespaces) }
                    .filter { !$0.isEmpty }

            case "start":
                guard !argument.isEmpty, !argument.contains(" ") else {
                    Output.error("-", "bad_command", "start needs a turn id without spaces")
                    continue
                }
                recognizer.start(turn: argument, vocab: vocab)
                vocab = []

            case "stop":
                // The optional watermark is accepted for the caller's bookkeeping and not used here.
                if !recognizer.stop() {
                    Output.error("-", "bad_command", "stop with no active turn")
                }

            case "quit":
                return

            default:
                Output.error("-", "bad_command", "unknown command '\(command)'")
            }
        }
    }
}

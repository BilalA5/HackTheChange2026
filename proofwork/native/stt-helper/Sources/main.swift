import Foundation
import Speech

// A closed stdout must not kill the helper with SIGPIPE; writes simply fail.
signal(SIGPIPE, SIG_IGN)

let fakeMode = ProcessInfo.processInfo.environment["PW_STT_FAKE"] == "1"

if CommandLine.arguments.count > 1 {
    switch CommandLine.arguments[1] {
    case "check":
        let status = fakeMode ? "authorized" : authorizationName(SFSpeechRecognizer.authorizationStatus())
        Output.line("AUTH: \(status)")
        exit(0)
    default:
        FileHandle.standardError.write("usage: STTStreamHelper [check]\n".data(using: .utf8)!)
        exit(2)
    }
}

let recognizer: Recognizer = fakeMode ? FakeRecognizer() : SpeechRecognizerEngine()

AudioPipe(
    fd: 3,
    onSamples: { recognizer.feed($0) },
    onError: { Output.error("-", "audio_error", $0) }
).start()

CommandLoop(recognizer: recognizer).run()
exit(0)

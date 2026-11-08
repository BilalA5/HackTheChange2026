import Darwin
import Foundation

/// Reads raw PCM from fd 3 on a background thread.
/// Format: Float32 little-endian, 16 kHz, mono. Byte chunks may split a sample,
/// so a partial trailing sample is carried over to the next read.
final class AudioPipe {
    private let fd: Int32
    private let onSamples: ([Float]) -> Void
    private let onError: (String) -> Void

    init(fd: Int32 = 3, onSamples: @escaping ([Float]) -> Void, onError: @escaping (String) -> Void) {
        self.fd = fd
        self.onSamples = onSamples
        self.onError = onError
    }

    func start() {
        let thread = Thread { [self] in self.run() }
        thread.name = "stt.audio-fd3"
        thread.start()
    }

    private func run() {
        var chunk = [UInt8](repeating: 0, count: 16_384)
        var carry: [UInt8] = []

        while true {
            let n = chunk.withUnsafeMutableBytes { read(fd, $0.baseAddress, $0.count) }
            if n < 0 {
                if errno == EINTR { continue }
                onError("read(fd \(fd)) failed: \(String(cString: strerror(errno)))")
                return
            }
            if n == 0 { return } // EOF: the writer closed fd 3

            carry.append(contentsOf: chunk[0..<n])
            let whole = carry.count - carry.count % 4
            if whole == 0 { continue }

            var samples = [Float](repeating: 0, count: whole / 4)
            for i in 0..<samples.count {
                let b = i * 4
                let bits = UInt32(carry[b])
                    | UInt32(carry[b + 1]) << 8
                    | UInt32(carry[b + 2]) << 16
                    | UInt32(carry[b + 3]) << 24
                samples[i] = Float(bitPattern: bits)
            }
            carry.removeFirst(whole)
            onSamples(samples)
        }
    }
}

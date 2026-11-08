#!/usr/bin/env bash
# Fake-mode protocol test plus a real-mode `check` smoke step. Run build.sh first.
# Real recognition is not exercised: it needs the user to grant Speech permission.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN="$HERE/build/STTStreamHelper.app/Contents/MacOS/STTStreamHelper"

if [ ! -x "$BIN" ]; then
  echo "helper not built: run bash native/stt-helper/build.sh first" >&2
  exit 1
fi

echo "== fake-mode protocol test"
PW_STT_FAKE=1 python3 -I - "$BIN" <<'PY'
import math, os, struct, subprocess, sys, threading, time

helper = sys.argv[1]

# Audio pipe: the read end becomes fd 3 in the helper.
r, w = os.pipe()
if r != 3:
    os.dup2(r, 3, inheritable=True)
    os.close(r)
    r = 3

env = dict(os.environ, PW_STT_FAKE="1")
proc = subprocess.Popen(
    [helper], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
    pass_fds=(3,), env=env,
)

lines = []
lock = threading.Lock()

def pump():
    for raw in proc.stdout:
        with lock:
            lines.append(raw.decode("utf-8", "replace").rstrip("\n"))

threading.Thread(target=pump, daemon=True).start()

def send(text):
    proc.stdin.write((text + "\n").encode())
    proc.stdin.flush()

def snapshot():
    with lock:
        return list(lines)

def wait_for(pred, timeout=10.0):
    end = time.time() + timeout
    while time.time() < end:
        hits = [l for l in snapshot() if pred(l)]
        if hits:
            return hits
        time.sleep(0.02)
    return []

def write_all(fd, data):
    view = memoryview(data)
    while view:
        view = view[os.write(fd, view):]

def fail(msg):
    print("FAIL: " + msg)
    print("--- helper output ---")
    print("\n".join(snapshot()))
    raise SystemExit(1)

try:
    send("warmup")
    if not wait_for(lambda l: l == "STATUS: Ready"):
        fail("no STATUS: Ready")

    send("start t1")
    if not wait_for(lambda l: l == "STATUS: Started t1"):
        fail("no STATUS: Started t1")

    # 2 seconds of 440 Hz sine, Float32 LE, 16 kHz mono, sent in 100 ms chunks.
    rate, seconds, chunk = 16000, 2, 1600
    for start in range(0, rate * seconds, chunk):
        samples = [0.5 * math.sin(2 * math.pi * 440 * i / rate) for i in range(start, start + chunk)]
        write_all(w, struct.pack("<%df" % len(samples), *samples))

    # Wait until the helper has consumed all audio (the 2.0 s partial), so stop sees the full 2 s.
    if not wait_for(lambda l: l.startswith("PARTIAL t1 ") and "(speech 2.0s)" in l):
        fail("no PARTIAL t1 covering the full 2.0 s")

    send("stop")
    if not wait_for(lambda l: l == "STATUS: Stopped t1"):
        fail("no STATUS: Stopped t1")

    out = snapshot()
    partials = [l for l in out if l.startswith("PARTIAL t1 ")]
    finals = [l for l in out if l.startswith("FINAL t1 ")]
    if len(partials) < 1:
        fail("expected at least one PARTIAL t1")
    if len(finals) != 1:
        fail("expected exactly one FINAL t1, got %d" % len(finals))
    if "fake transcript of 2.0s of audio" not in finals[0]:
        fail("unexpected FINAL text: " + finals[0])

    send("quit")
    rc = proc.wait(timeout=10)
    if rc != 0:
        fail("helper exited with %d" % rc)
    print("ok: %d partials, %s" % (len(partials), finals[0]))
finally:
    if proc.poll() is None:
        proc.kill()
        proc.wait()
    os.close(w)
PY

echo "== real-mode smoke (check only)"
out="$("$HERE/build/STTStreamHelper.app/Contents/MacOS/STTStreamHelper" check)"
echo "$out"
case "$out" in
  "AUTH: authorized"|"AUTH: denied"|"AUTH: restricted"|"AUTH: notDetermined"|"AUTH: unknown") ;;
  *) echo "unexpected check output" >&2; exit 1 ;;
esac

echo "PASS"

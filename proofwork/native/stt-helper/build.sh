#!/usr/bin/env bash
# Builds build/STTStreamHelper.app (arm64, macOS 13+ target), embeds Info.plist, and ad-hoc signs it.
# Idempotent: the bundle is rebuilt from scratch on every run. Exits non-zero on any failure.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="$HERE/build/STTStreamHelper.app"
BIN="$APP/Contents/MacOS/STTStreamHelper"
PLIST="$HERE/Info.plist"

rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS"
cp "$PLIST" "$APP/Contents/Info.plist"

swiftc -O \
  -target arm64-apple-macos13.0 \
  -swift-version 5 \
  -module-name STTStreamHelper \
  -framework Speech \
  -framework AVFoundation \
  -Xlinker -sectcreate -Xlinker __TEXT -Xlinker __info_plist -Xlinker "$PLIST" \
  "$HERE"/Sources/*.swift \
  -o "$BIN"

codesign --force --sign - --timestamp=none "$APP"
codesign --verify --verbose=2 "$APP"

echo "built $APP"

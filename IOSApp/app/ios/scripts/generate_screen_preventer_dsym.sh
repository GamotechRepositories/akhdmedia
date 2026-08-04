#!/bin/sh
# ScreenPreventerKit ships as a prebuilt XCFramework without dSYMs.
# App Store Connect rejects archives missing UUID 9D0A700C-9AE2-32BA-A006-C56BB7B6833F.
# dsymutil still emits a matching-UUID dSYM (even when the binary is stripped).
# See: https://github.com/prongbang/screen_protector/issues/56

set -e

if [ "${CONFIGURATION}" = "Debug" ]; then
  exit 0
fi

if [ -z "${DWARF_DSYM_FOLDER_PATH:-}" ]; then
  echo "note: DWARF_DSYM_FOLDER_PATH unset; skipping ScreenPreventerKit dSYM"
  exit 0
fi

BINARY="${PODS_ROOT}/ScreenProtectorKit/Frameworks/ScreenPreventerKit.xcframework/ios-arm64/ScreenPreventerKit.framework/ScreenPreventerKit"

if [ ! -f "${BINARY}" ]; then
  echo "note: ScreenPreventerKit binary not found; skipping dSYM generation"
  exit 0
fi

DSYM_OUT="${DWARF_DSYM_FOLDER_PATH}/ScreenPreventerKit.framework.dSYM"
mkdir -p "${DWARF_DSYM_FOLDER_PATH}"
rm -rf "${DSYM_OUT}"
dsymutil "${BINARY}" -o "${DSYM_OUT}"
echo "Generated ScreenPreventerKit dSYM → ${DSYM_OUT}"

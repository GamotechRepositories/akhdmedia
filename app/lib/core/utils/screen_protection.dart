import 'package:flutter/foundation.dart';
import 'package:flutter/scheduler.dart';
import 'package:screen_protector/screen_protector.dart';

/// Set to true before Play Store / production release.
const screenProtectionEnabled = true;

/// Blocks screenshots and screen recording where the platform supports it.
Future<void> enableAppScreenProtection() async {
  if (kIsWeb) return;

  if (!screenProtectionEnabled) {
    await disableAppScreenProtection();
    return;
  }

  try {
    await ScreenProtector.protectDataLeakageOn();
  } catch (_) {}

  try {
    await ScreenProtector.preventScreenshotOn();
  } catch (_) {}
}

Future<void> disableAppScreenProtection() async {
  if (kIsWeb) return;

  try {
    await ScreenProtector.protectDataLeakageOff();
  } catch (_) {}

  try {
    await ScreenProtector.preventScreenshotOff();
  } catch (_) {}
}

/// Ensures protection runs after the native activity/window is available.
void scheduleAppScreenProtection() {
  if (kIsWeb) return;

  SchedulerBinding.instance.addPostFrameCallback((_) {
    enableAppScreenProtection();
  });
}

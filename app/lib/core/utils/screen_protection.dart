import 'package:flutter/foundation.dart';
import 'package:flutter/scheduler.dart';
import 'package:screen_protector/screen_protector.dart';

/// Blocks screenshots and screen recording where the platform supports it.
Future<void> enableAppScreenProtection() async {
  if (kIsWeb) return;

  try {
    await ScreenProtector.protectDataLeakageOn();
  } catch (_) {}

  try {
    await ScreenProtector.preventScreenshotOn();
  } catch (_) {}
}

/// Ensures protection runs after the native activity/window is available.
void scheduleAppScreenProtection() {
  if (kIsWeb) return;

  SchedulerBinding.instance.addPostFrameCallback((_) {
    enableAppScreenProtection();
  });
}

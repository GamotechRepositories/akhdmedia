import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:video_player/video_player.dart';

import '../../providers/auth_provider.dart';

const kPreviewAuthLimit = Duration(seconds: 10);

void enforcePreviewVideoAuthGate(
  BuildContext context,
  VideoPlayerController controller, {
  required bool Function() isGateTriggered,
  required void Function(bool value) setGateTriggered,
}) {
  if (!context.mounted) return;

  final auth = context.read<AuthProvider>();
  if (auth.isAuthenticated) {
    if (isGateTriggered()) setGateTriggered(false);
    return;
  }

  final position = controller.value.position;
  if (position < kPreviewAuthLimit) return;

  controller.pause();
  if (position > kPreviewAuthLimit) {
    controller.seekTo(kPreviewAuthLimit);
  }

  if (isGateTriggered()) return;
  setGateTriggered(true);

  final redirect = GoRouterState.of(context).uri.toString();
  context.push('/login?redirect=${Uri.encodeComponent(redirect)}');
}

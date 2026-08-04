import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:video_player/video_player.dart';

import '../../providers/auth_provider.dart';

const kPreviewAuthLimit = Duration(seconds: 10);

const kPreviewSignInMessage =
    'Sign in to continue watching all the videos, details and full previews.';

Future<void> showPreviewSignInPrompt(BuildContext context) {
  if (!context.mounted) return Future.value();

  final auth = context.read<AuthProvider>();
  if (auth.isAuthenticated) return Future.value();

  return showDialog<void>(
    context: context,
    barrierDismissible: true,
    builder: (dialogContext) => Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Sign in',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              kPreviewSignInMessage,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: () {
                Navigator.pop(dialogContext);
                final redirect = GoRouterState.of(context).uri.toString();
                context.push('/login?redirect=${Uri.encodeComponent(redirect)}');
              },
              child: const Text('Sign in'),
            ),
          ],
        ),
      ),
    ),
  );
}

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

  showPreviewSignInPrompt(context).then((_) {
    if (context.mounted && !context.read<AuthProvider>().isAuthenticated) {
      setGateTriggered(false);
    }
  });
}

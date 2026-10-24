import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:video_player/video_player.dart';

import '../../providers/auth_provider.dart';

const kPreviewAuthLimit = Duration(seconds: 10);

const kPreviewSignInMessage =
    'Sign in to continue watching all the videos, details and full previews.';

/// Shows the "Sign in to keep watching" prompt.
///
/// Set [closeRouteOnSignIn] when the prompt is shown from a fullscreen /
/// lightbox route pushed with `Navigator.push` — that route is closed first so
/// the login screen is not hidden behind it.
Future<void> showPreviewSignInPrompt(
  BuildContext context, {
  bool closeRouteOnSignIn = false,
}) {
  if (!context.mounted) return Future.value();

  final auth = context.read<AuthProvider>();
  if (auth.isAuthenticated) return Future.value();

  void goToSignIn(BuildContext dialogContext) {
    final router = GoRouter.of(context);
    final redirect = router.routerDelegate.currentConfiguration.uri.toString();

    Navigator.of(dialogContext).pop();

    if (closeRouteOnSignIn && context.mounted) {
      final navigator = Navigator.of(context);
      if (navigator.canPop()) navigator.pop();
    }

    router.push('/login?redirect=${Uri.encodeComponent(redirect)}');
  }

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
              onPressed: () => goToSignIn(dialogContext),
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
  bool closeRouteOnSignIn = false,
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

  showPreviewSignInPrompt(
    context,
    closeRouteOnSignIn: closeRouteOnSignIn,
  ).then((_) {
    if (context.mounted && !context.read<AuthProvider>().isAuthenticated) {
      setGateTriggered(false);
    }
  });
}

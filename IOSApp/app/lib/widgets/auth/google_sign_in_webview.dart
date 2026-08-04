import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:webview_flutter/webview_flutter.dart';

import '../../core/constants/auth_config.dart';

/// Opens Google Sign-In using the web OAuth client (same as the website).
Future<String?> showGoogleSignInWebView(
  BuildContext context, {
  required String googleClientId,
}) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    isDismissible: true,
    backgroundColor: Colors.transparent,
    builder: (context) => _GoogleSignInSheet(googleClientId: googleClientId),
  );
}

class _GoogleSignInSheet extends StatefulWidget {
  const _GoogleSignInSheet({required this.googleClientId});

  final String googleClientId;

  @override
  State<_GoogleSignInSheet> createState() => _GoogleSignInSheetState();
}

class _GoogleSignInSheetState extends State<_GoogleSignInSheet> {
  WebViewController? _controller;
  var _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initWebView();
  }

  Future<void> _clearGoogleSession() async {
    final controller = _controller;
    if (controller == null) return;

    final cookieManager = WebViewCookieManager();
    await cookieManager.clearCookies();
    await controller.clearCache();
    await controller.clearLocalStorage();
  }

  Future<void> _loadAuthPage() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final template = await rootBundle.loadString('assets/google_sign_in.html');
      final html = template.replaceAll('__GOOGLE_CLIENT_ID__', widget.googleClientId);

      final controller = _controller ?? _createController();
      await _clearGoogleSession();
      await controller.loadHtmlString(html, baseUrl: AuthConfig.googleAuthOrigin);

      if (!mounted) return;
      setState(() => _controller = controller);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Could not open Google Sign-In.';
      });
    }
  }

  WebViewController _createController() {
    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFF3F4F6))
      ..addJavaScriptChannel(
        'GoogleAuthChannel',
        onMessageReceived: (message) {
          final credential = message.message.trim();
          if (credential.isNotEmpty && mounted) {
            Navigator.of(context).pop(credential);
          }
        },
      )
      ..addJavaScriptChannel(
        'ReloadAuthChannel',
        onMessageReceived: (_) {
          _loadAuthPage();
        },
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) {
            if (mounted) setState(() => _loading = false);
          },
          onWebResourceError: (error) {
            if (!mounted) return;
            setState(() {
              _loading = false;
              _error = error.description;
            });
          },
          onNavigationRequest: (request) => NavigationDecision.navigate,
        ),
      );

    return controller;
  }

  Future<void> _initWebView() async {
    _controller = _createController();
    await _loadAuthPage();
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.sizeOf(context).height * 0.78;

    return Container(
      height: height,
      decoration: const BoxDecoration(
        color: Color(0xFFF3F4F6),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          Align(
            alignment: Alignment.centerRight,
            child: IconButton(
              tooltip: 'Close',
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.close_rounded),
            ),
          ),
          Expanded(
            child: Stack(
              children: [
                if (_controller != null)
                  WebViewWidget(controller: _controller!)
                else if (_error != null)
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(_error!, textAlign: TextAlign.center),
                    ),
                  ),
                if (_loading)
                  const Center(child: CircularProgressIndicator(strokeWidth: 2)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
